import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";
import { createPublicClient, decodeEventLog, http } from "viem";
import {
  factoryViewAbi,
  feeEscrowViewAbi,
  lockerKeeperAbi,
  pairRegistryViewAbi,
  protocolAbi,
  swapEvent,
  tokenReconciliationAbi,
  transferEvent,
} from "../src/abi.js";
import { loadConfig } from "../src/config.js";
import { createDatabase } from "../src/db.js";
import { quotePerToken, tokenIsCurrency0, tradeVolumes, ZERO_ADDRESS } from "../src/market-store.js";
import { normalizeRouteAllowlist, publicPair } from "../src/route-policy.js";

const lower = (value) => value?.toLowerCase();
const normalizeDecimal = (value) => String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
const eventKey = (recipient, currency) => `${lower(recipient)}:${lower(currency)}`;
const json = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item, 2);

async function manifest(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), "utf8"));
}

function decode(log, abi) {
  try { return decodeEventLog({ abi, data: log.data, topics: log.topics }); }
  catch { return null; }
}

function expectAddress(actual, expected, label) {
  assert.equal(lower(actual), lower(expected), `${label} differs from the deployment manifest`);
}

async function retryRead(work, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await work(); }
    catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await wait(Math.min(8_000, 1_000 * (2 ** attempt)));
    }
  }
  throw lastError;
}

async function logsForAddresses(client, addresses, fromBlock, toBlock) {
  const logs = [];
  for (let offset = 0; offset < addresses.length; offset += 100) {
    logs.push(...await retryRead(() => client.getLogs({
      address: addresses.slice(offset, offset + 100),
      fromBlock,
      toBlock,
    })));
  }
  return logs;
}

async function canonicalEventsBetween(client, scope, fromBlock, toBlock) {
  if (toBlock < fromBlock) return [];
  const events = [];
  for (const log of await logsForAddresses(client, scope.addresses, fromBlock, toBlock)) {
    const address = lower(log.address);
    if (scope.protocolAddresses.has(address)) {
      const event = decode(log, protocolAbi);
      if (event) events.push(event);
    } else if (address === scope.poolManager) {
      const event = decode(log, [swapEvent]);
      if (event && scope.poolIds.has(lower(event.args.id))) events.push(event);
    } else if (scope.launchedTokens.has(address)) {
      const event = decode(log, [transferEvent]);
      if (event) events.push(event);
    }
  }
  return events;
}

async function main() {
  const config = loadConfig();
  assert.equal(config.chainId, 46_630, "reconciliation is pinned to the Robinhood testnet manifest");
  const [core, routes] = await Promise.all([
    manifest("../../../contracts/deployments/46630/core.json"),
    manifest("../../../contracts/deployments/46630/eth-routes.json"),
  ]);

  expectAddress(config.contracts.factory, core.contracts.launchFactory.address, "factory");
  expectAddress(config.contracts.factory, routes.contracts.factory, "route factory");
  expectAddress(config.contracts.router, routes.contracts.router, "active router");
  expectAddress(config.contracts.locker, core.contracts.launchLocker.address, "locker");
  expectAddress(config.contracts.feeEscrow, core.contracts.feeEscrow.address, "fee escrow");
  expectAddress(config.contracts.feeSplitter, core.contracts.feeSplitter.address, "fee splitter");
  expectAddress(config.contracts.rewardVault, core.contracts.rewardVault.address, "reward vault");
  expectAddress(config.contracts.pairRegistry, core.contracts.pairRegistry.address, "pair registry");
  expectAddress(config.contracts.poolManager, core.dependencies.poolManager, "pool manager");

  const db = createDatabase(config.databaseUrl);
  const client = createPublicClient({ transport: http(config.rpcUrl, { timeout: 25_000, retryCount: 3 }) });
  try {
    const stateResult = await db.query("SELECT cursor_block,cursor_block_hash FROM indexer_state WHERE chain_id=$1", [config.chainId]);
    assert.equal(stateResult.rowCount, 1, "indexer state is missing");
    const cursor = BigInt(stateResult.rows[0].cursor_block);
    const cursorBlock = await client.getBlock({ blockNumber: cursor });
    assert.equal(lower(stateResult.rows[0].cursor_block_hash), lower(cursorBlock.hash), "indexer cursor is not canonical");
    const chainHead = await client.getBlockNumber();
    const launches = (await db.query("SELECT * FROM launches WHERE chain_id=$1 ORDER BY block_number,log_index", [config.chainId])).rows;
    assert.ok(launches.length > 0, "no indexed launches to reconcile");
    const monitoredAddresses = [...new Set([
      ...Object.values(config.contracts),
      ...launches.map((launch) => launch.token_address),
    ].filter(Boolean).map(lower))];
    const canonicalScope = {
      addresses: monitoredAddresses,
      protocolAddresses: new Set(Object.values(config.contracts).filter((address) => lower(address) !== lower(config.contracts.poolManager)).map(lower)),
      launchedTokens: new Set(launches.map((launch) => lower(launch.token_address))),
      poolManager: lower(config.contracts.poolManager),
      poolIds: new Set(launches.map((launch) => lower(launch.pool_id))),
    };
    const newerCanonicalEvents = await canonicalEventsBetween(client, canonicalScope, cursor + 1n, chainHead);
    assert.equal(newerCanonicalEvents.length, 0, "canonical protocol state changed after the confirmed cursor; rerun backfill before reconciling");

    const holderChecks = [];
    const pendingFees = [];
    const routeAllowlist = normalizeRouteAllowlist(config.routePolicy.allowlist, { chainId: config.chainId, wrappedNative: config.routePolicy.wrappedNative, adapter: config.routePolicy.adapter });
    const routesByAsset = new Map(routeAllowlist.map((entry) => [entry.asset, entry]));
    const pairRows = (await db.query("SELECT * FROM pair_assets WHERE chain_id=$1 ORDER BY config_version", [config.chainId])).rows;
    assert.ok(pairRows.length > 0, "no pair-registry events were indexed");
    const pairChecks = [];
    for (const row of pairRows) {
      const onchain = await retryRead(() => client.readContract({
        address: config.contracts.pairRegistry,
        abi: pairRegistryViewAbi,
        functionName: "getPair",
        args: [row.asset_address],
      }));
      assert.equal(onchain.registered, row.registered, `pair registered mismatch for ${row.asset_address}`);
      assert.equal(onchain.enabled, row.enabled, `pair enabled mismatch for ${row.asset_address}`);
      assert.equal(Number(onchain.pairType), row.pair_type, `pair type mismatch for ${row.asset_address}`);
      assert.equal(Number(onchain.decimals), row.decimals, `pair decimals mismatch for ${row.asset_address}`);
      assert.equal(onchain.configVersion.toString(), row.config_version, `pair version mismatch for ${row.asset_address}`);
      const catalogPair = publicPair(row, routesByAsset.get(row.asset_address));
      pairChecks.push({ address: row.asset_address, symbol: row.token_symbol, configVersion: row.config_version, enabled: catalogPair.enabled, metadataValid: catalogPair.metadataValid, routeKind: catalogPair.route?.kind || null });
    }

    for (const launch of launches) {
      const record = await retryRead(() => client.readContract({
        address: config.contracts.factory,
        abi: factoryViewAbi,
        functionName: "getLaunchedToken",
        args: [launch.token_address],
      }));
      assert.equal(record.exists, true, `${launch.token_address} is absent from factory state`);
      expectAddress(record.token, launch.token_address, "launch token");
      expectAddress(record.deployer, launch.deployer, "launch deployer");
      expectAddress(record.creatorFeeRecipient, launch.creator_fee_recipient, "creator fee recipient");
      expectAddress(record.pairToken, launch.pair_token, "pair token");
      assert.equal(record.poolFee, launch.pool_fee, "pool fee mismatch");
      if (launch.position_id !== null) assert.equal(record.positionId.toString(), launch.position_id, "position id mismatch");
      if (launch.liquidity !== null) assert.equal(record.liquidity.toString(), launch.liquidity, "liquidity mismatch");

      const holders = (await db.query(
        "SELECT holder_address,balance FROM holder_balances WHERE chain_id=$1 AND token_address=$2 AND balance>0 ORDER BY holder_address",
        [config.chainId, launch.token_address],
      )).rows;
      let indexedSupply = 0n;
      for (const holder of holders) {
        const canonical = await retryRead(() => client.readContract({
          address: launch.token_address,
          abi: tokenReconciliationAbi,
          functionName: "balanceOf",
          args: [holder.holder_address],
        }));
        assert.equal(canonical.toString(), holder.balance, `holder balance mismatch for ${holder.holder_address}`);
        indexedSupply += BigInt(holder.balance);
      }
      const totalSupply = await retryRead(() => client.readContract({
        address: launch.token_address,
        abi: tokenReconciliationAbi,
        functionName: "totalSupply",
      }));
      assert.equal(indexedSupply, totalSupply, `indexed holder supply mismatch for ${launch.token_address}`);
      holderChecks.push({ token: launch.token_address, holders: holders.length, totalSupply: totalSupply.toString() });

      const pending = await retryRead(() => client.readContract({
        address: config.contracts.locker,
        abi: lockerKeeperAbi,
        functionName: "pendingFees",
        args: [launch.token_address],
      }));
      pendingFees.push({ token: launch.token_address, amount0: pending[0].toString(), amount1: pending[1].toString() });
    }

    const feeEvents = (await db.query(
      "SELECT contract_address,event_name,event_args FROM raw_events WHERE chain_id=$1 AND event_name IN ('FeesSplit','Claimed','ClaimedToken') ORDER BY block_number,log_index",
      [config.chainId],
    )).rows;
    const expectedClaims = new Map();
    for (const event of feeEvents) {
      const args = event.event_args;
      if (event.event_name === "FeesSplit" && lower(event.contract_address) === config.contracts.feeSplitter) {
        const key = eventKey(args.creator, args.currency);
        expectedClaims.set(key, (expectedClaims.get(key) || 0n) + BigInt(args.creatorAmount));
      } else if (lower(event.contract_address) === config.contracts.feeEscrow) {
        const currency = event.event_name === "ClaimedToken" ? args.token : ZERO_ADDRESS;
        const key = eventKey(args.recipient, currency);
        expectedClaims.set(key, (expectedClaims.get(key) || 0n) - BigInt(args.amount));
      }
    }

    const claimableChecks = [];
    for (const [key, expected] of expectedClaims) {
      assert.ok(expected >= 0n, `negative indexed claimable balance for ${key}`);
      const [recipient, currency] = key.split(":");
      const native = currency === ZERO_ADDRESS;
      const canonical = await retryRead(() => client.readContract({
        address: config.contracts.feeEscrow,
        abi: feeEscrowViewAbi,
        functionName: native ? "balanceOf" : "balanceOfToken",
        args: native ? [recipient] : [recipient, currency],
      }));
      assert.equal(canonical, expected, `claimable balance mismatch for ${key}`);
      claimableChecks.push({ recipient, currency, amount: expected.toString() });
    }

    const trades = (await db.query("SELECT * FROM trades WHERE chain_id=$1 ORDER BY block_number,log_index", [config.chainId])).rows;
    const maximumTrades = Number.parseInt(process.env.RECONCILE_MAX_TRADES || "5000", 10);
    assert.ok(trades.length <= maximumTrades, `refusing a partial trade check: ${trades.length} exceeds RECONCILE_MAX_TRADES=${maximumTrades}`);
    const receipts = new Map();
    let routedTrades = 0;
    for (const trade of trades) {
      let receipt = receipts.get(trade.transaction_hash);
      if (!receipt) {
        receipt = await retryRead(() => client.getTransactionReceipt({ hash: trade.transaction_hash }));
        receipts.set(trade.transaction_hash, receipt);
      }
      const rawSwap = receipt.logs.find((log) => log.logIndex === trade.log_index && lower(log.address) === config.contracts.poolManager);
      assert.ok(rawSwap, `canonical Swap log missing for ${trade.transaction_hash}:${trade.log_index}`);
      const decodedSwap = decode(rawSwap, [swapEvent]);
      assert.equal(decodedSwap?.eventName, "Swap", "stored trade does not point to a Swap event");
      const args = decodedSwap.args;
      assert.equal(lower(args.id), trade.pool_id);
      assert.equal(args.amount0.toString(), trade.amount0);
      assert.equal(args.amount1.toString(), trade.amount1);
      assert.equal(args.sqrtPriceX96.toString(), trade.sqrt_price_x96);
      const volumes = tradeVolumes({ amount0: args.amount0, amount1: args.amount1, tokenIsCurrency0: trade.token_is_currency0 });
      const price = quotePerToken({
        sqrtPriceX96: args.sqrtPriceX96,
        tokenIsCurrency0: trade.token_is_currency0,
        tokenDecimals: launches.find((launch) => launch.token_address === trade.token_address).token_decimals,
        pairDecimals: launches.find((launch) => launch.token_address === trade.token_address).pair_decimals,
      });
      assert.equal(volumes.tokenVolume.toString(), trade.token_volume);
      assert.equal(volumes.quoteVolume.toString(), trade.quote_volume);
      assert.equal(normalizeDecimal(trade.price_quote_per_token), normalizeDecimal(price));

      const routed = receipt.logs
        .filter((log) => lower(log.address) === config.contracts.router)
        .map((log) => decode(log, protocolAbi))
        .find((event) => ["ZapBuy", "ZapSell"].includes(event?.eventName) && lower(event.args.poolId) === trade.pool_id);
      const expectedSender = routed
        ? lower(routed.eventName === "ZapBuy" ? routed.args.buyer : routed.args.seller)
        : lower(args.sender);
      assert.equal(trade.sender, expectedSender, `trade sender attribution mismatch for ${trade.transaction_hash}`);
      if (routed) routedTrades += 1;
    }

    const finalHead = await client.getBlockNumber();
    const racedCanonicalEvents = await canonicalEventsBetween(client, canonicalScope, chainHead + 1n, finalHead);
    assert.equal(racedCanonicalEvents.length, 0, "canonical protocol state changed during reconciliation; rerun backfill before reconciling");

    const report = {
      chainId: config.chainId,
      cursor: cursor.toString(),
      cursorBlockHash: cursorBlock.hash,
      stateVerifiedThrough: finalHead.toString(),
      manifests: { coreVerified: core.deployment.verified, ethRoutesTestnetOnly: routes.testnetOnly },
      launches: launches.length,
      holders: holderChecks,
      claimable: claimableChecks,
      pendingFees,
      trades: { checked: trades.length, routed: routedTrades },
      pairs: pairChecks,
    };
    if (process.env.RECONCILIATION_REPORT_PATH) await writeFile(process.env.RECONCILIATION_REPORT_PATH, `${json(report)}\n`);
    console.log(json(report));
  } finally {
    await db.close();
  }
}

await main();
