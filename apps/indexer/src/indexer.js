import { createPublicClient, decodeEventLog, http } from "viem";
import { factoryViewAbi, protocolAbi, swapEvent, tokenAbi, transferEvent } from "./abi.js";
import { applyTransfer, quotePerToken, tokenIsCurrency0, tradeVolumes, upsertCandles } from "./market-store.js";
import { nextRange, retryBackoff, rewindHeight } from "./ranges.js";

const json = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item);
const lower = (value) => value?.toLowerCase();
const ZERO = "0x0000000000000000000000000000000000000000";

function routedTradeKey(transactionHash, poolId) {
  return `${lower(transactionHash)}:${lower(poolId)}`;
}

export function routedTradeSenders(protocolEvents) {
  const senders = new Map();
  for (const event of protocolEvents) {
    if (event.eventName === "ZapBuy") {
      senders.set(routedTradeKey(event.log.transactionHash, event.args.poolId), lower(event.args.buyer));
    } else if (event.eventName === "ZapSell") {
      senders.set(routedTradeKey(event.log.transactionHash, event.args.poolId), lower(event.args.seller));
    }
  }
  return senders;
}

export function createIndexer(config, db, eventHub, logger = console, dependencies = {}) {
  const client = dependencies.client || createPublicClient({ transport: http(config.rpcUrl, { timeout: 25_000, retryCount: config.rpcRetryCount, retryDelay: config.rpcRetryDelayMs }) });
  let stopped = false;
  const runtime = { consecutiveFailures: 0, lastSuccessAt: null, lastErrorAt: null, lastCursor: null, lastTarget: null };

  async function ensureState() {
    await db.query(`INSERT INTO indexer_state(chain_id,cursor_block) VALUES($1,$2) ON CONFLICT(chain_id) DO NOTHING`, [config.chainId, (config.startBlock - 1n).toString()]);
  }

  async function state() {
    const result = await db.query(`SELECT cursor_block,cursor_block_hash FROM indexer_state WHERE chain_id=$1`, [config.chainId]);
    return { cursor: BigInt(result.rows[0].cursor_block), hash: result.rows[0].cursor_block_hash };
  }

  async function rebuildDerivedData(tx) {
    await tx.query(`DELETE FROM candles WHERE chain_id=$1`, [config.chainId]);
    await tx.query(
      `INSERT INTO candles(chain_id,token_address,interval_seconds,bucket_start,open,high,low,close,token_volume,quote_volume,trade_count,first_block,first_log_index,last_block,last_log_index)
       SELECT chain_id,token_address,interval_seconds,bucket_start,
         (array_agg(price_quote_per_token ORDER BY block_number,log_index))[1],max(price_quote_per_token),min(price_quote_per_token),
         (array_agg(price_quote_per_token ORDER BY block_number DESC,log_index DESC))[1],sum(token_volume),sum(quote_volume),count(*)::integer,
         min(block_number),(array_agg(log_index ORDER BY block_number,log_index))[1],max(block_number),(array_agg(log_index ORDER BY block_number DESC,log_index DESC))[1]
       FROM (SELECT t.*,i.interval_seconds,to_timestamp(floor(extract(epoch FROM t.block_time)/i.interval_seconds)*i.interval_seconds) bucket_start
         FROM trades t CROSS JOIN unnest($2::integer[]) i(interval_seconds)
         WHERE t.chain_id=$1 AND t.price_quote_per_token IS NOT NULL AND t.block_time IS NOT NULL) source
       GROUP BY chain_id,token_address,interval_seconds,bucket_start`,
      [config.chainId, [60, 300, 900, 3_600, 86_400]],
    );
    await tx.query(`DELETE FROM holder_balances WHERE chain_id=$1`, [config.chainId]);
    await tx.query(
      `INSERT INTO holder_balances(chain_id,token_address,holder_address,balance,updated_block)
       SELECT chain_id,token_address,holder_address,sum(delta),max(block_number) FROM (
         SELECT chain_id,token_address,from_address holder_address,-amount delta,block_number FROM token_transfers WHERE chain_id=$1 AND from_address<>$2
         UNION ALL SELECT chain_id,token_address,to_address holder_address,amount delta,block_number FROM token_transfers WHERE chain_id=$1 AND to_address<>$2
       ) movements GROUP BY chain_id,token_address,holder_address HAVING sum(delta)>=0`,
      [config.chainId, ZERO],
    );
  }

  async function reconcileReorg(current) {
    if (!current.hash || current.cursor < config.startBlock) return current;
    const block = await client.getBlock({ blockNumber: current.cursor });
    if (lower(block.hash) === lower(current.hash)) return current;
    const resume = rewindHeight(current.cursor, config.startBlock, config.reorgRewind);
    const nextCursor = resume - 1n;
    const previous = nextCursor >= 0n ? await client.getBlock({ blockNumber: nextCursor }) : null;
    await db.transaction(async (tx) => {
      for (const table of ["raw_events", "trades", "fee_collections", "fee_claims", "token_transfers", "reward_funding", "reward_finalizations", "indexed_blocks"]) {
        await tx.query(`DELETE FROM ${table} WHERE chain_id=$1 AND block_number >= $2`, [config.chainId, resume.toString()]);
      }
      await tx.query(`DELETE FROM launches WHERE chain_id=$1 AND block_number >= $2`, [config.chainId, resume.toString()]);
      await rebuildDerivedData(tx);
      await tx.query(`UPDATE indexer_state SET cursor_block=$2,cursor_block_hash=$3,updated_at=now() WHERE chain_id=$1`, [config.chainId, nextCursor.toString(), previous?.hash || null]);
    });
    eventHub?.publish({ type: "chain.reorg", chainId: config.chainId, resumeBlock: resume.toString(), confirmed: true });
    logger.warn(`Reorg detected; rewound to block ${nextCursor}.`);
    return { cursor: nextCursor, hash: previous?.hash || null };
  }

  async function metadata(address) {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({ address, abi: tokenAbi, functionName: "name" }),
      client.readContract({ address, abi: tokenAbi, functionName: "symbol" }),
      client.readContract({ address, abi: tokenAbi, functionName: "decimals" }),
    ]);
    return { name, symbol, decimals: Number(decimals) };
  }

  async function launchMetadata(token, pair) {
    const [tokenData, pairData, record] = await Promise.all([
      metadata(token), lower(pair) === ZERO ? Promise.resolve({ name: "Ether", symbol: "ETH", decimals: 18 }) : metadata(pair),
      client.readContract({ address: config.contracts.factory, abi: factoryViewAbi, functionName: "getLaunchedToken", args: [token] }),
    ]);
    return { token: { ...tokenData, creatorFeeRecipient: record.creatorFeeRecipient }, pair: pairData };
  }

  const decode = (log, abi) => {
    try { return { log, ...decodeEventLog({ abi, data: log.data, topics: log.topics }) }; }
    catch { return null; }
  };

  async function loadBlocks(numbers) {
    const unique = [...new Set(numbers.map(String))];
    const entries = [];
    for (let offset = 0; offset < unique.length; offset += 20) {
      const batch = unique.slice(offset, offset + 20);
      entries.push(...await Promise.all(batch.map(async (number) => {
        const block = await client.getBlock({ blockNumber: BigInt(number) });
        return [number, { number, hash: block.hash, parentHash: block.parentHash, time: new Date(Number(block.timestamp) * 1_000) }];
      })));
    }
    return new Map(entries);
  }

  async function transferLogsFor(tokens, fromBlock, toBlock) {
    const logs = [];
    for (let offset = 0; offset < tokens.length; offset += 100) {
      logs.push(...await client.getLogs({ address: tokens.slice(offset, offset + 100), event: transferEvent, fromBlock, toBlock }));
    }
    return logs;
  }

  async function ingestRange(fromBlock, toBlock) {
    const addresses = [config.contracts.factory, config.contracts.router, config.contracts.locker, config.contracts.feeEscrow, config.contracts.feeSplitter, config.contracts.rewardVault].filter(Boolean);
    const [protocolLogs, swapLogs, launches] = await Promise.all([
      client.getLogs({ address: addresses, fromBlock, toBlock }),
      client.getLogs({ address: config.contracts.poolManager, event: swapEvent, fromBlock, toBlock }),
      db.query(`SELECT pool_id,token_address,pair_token,token_decimals,pair_decimals FROM launches WHERE chain_id=$1`, [config.chainId]),
    ]);
    const protocolEvents = protocolLogs.map((log) => decode(log, protocolAbi)).filter(Boolean);
    const routedSenders = routedTradeSenders(protocolEvents);
    const newTokens = protocolEvents.filter((event) => event.eventName === "TokenLaunched").map((event) => lower(event.args.token));
    const trackedTokens = [...new Set([...launches.rows.map((row) => lower(row.token_address)), ...newTokens])];
    const transferLogs = trackedTokens.length ? await transferLogsFor(trackedTokens, fromBlock, toBlock) : [];
    const events = [...protocolEvents, ...swapLogs.map((log) => decode(log, [swapEvent])).filter(Boolean), ...transferLogs.map((log) => decode(log, [transferEvent])).filter(Boolean)]
      .sort((a, b) => Number(a.log.blockNumber - b.log.blockNumber) || a.log.logIndex - b.log.logIndex);
    const blocks = await loadBlocks([...events.map((event) => event.log.blockNumber), toBlock]);
    const pools = new Map(launches.rows.map((row) => [lower(row.pool_id), { token: lower(row.token_address), pair: lower(row.pair_token), tokenDecimals: row.token_decimals, pairDecimals: row.pair_decimals }]));
    const tracked = new Set(trackedTokens);
    const changed = new Set();

    await db.transaction(async (tx) => {
      for (const block of blocks.values()) {
        await tx.query(`INSERT INTO indexed_blocks(chain_id,block_number,block_hash,parent_hash,block_time) VALUES($1,$2,$3,$4,$5)
          ON CONFLICT(chain_id,block_number) DO UPDATE SET block_hash=excluded.block_hash,parent_hash=excluded.parent_hash,block_time=excluded.block_time`,
        [config.chainId, block.number, block.hash, block.parentHash, block.time]);
      }
      for (const event of events) {
        const { log, eventName, args } = event;
        const block = blocks.get(String(log.blockNumber));
        if (eventName === "Swap" && !pools.has(lower(args.id))) continue;
        if (eventName === "Transfer" && !tracked.has(lower(log.address))) continue;
        await tx.query(`INSERT INTO raw_events(chain_id,block_number,block_hash,transaction_hash,transaction_index,log_index,contract_address,event_name,event_args)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) ON CONFLICT DO NOTHING`,
        [config.chainId, log.blockNumber.toString(), log.blockHash, log.transactionHash, log.transactionIndex, log.logIndex, lower(log.address), eventName, json(args)]);

        if (eventName === "TokenLaunched") {
          let data = { token: { name: null, symbol: null, decimals: 18, creatorFeeRecipient: null }, pair: { symbol: null, decimals: 18 } };
          try { data = await launchMetadata(args.token, args.pairToken); } catch (error) { logger.warn(`Metadata read failed for ${args.token}: ${error.shortMessage || error.message}`); }
          await tx.query(`INSERT INTO launches(chain_id,token_address,pool_id,deployer,creator_fee_recipient,pair_token,launch_config_id,pool_fee,token_name,token_symbol,token_decimals,pair_symbol,pair_decimals,block_number,block_time,transaction_hash,log_index)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
            ON CONFLICT(chain_id,token_address) DO UPDATE SET pool_id=excluded.pool_id,creator_fee_recipient=excluded.creator_fee_recipient,pair_symbol=excluded.pair_symbol,pair_decimals=excluded.pair_decimals`,
          [config.chainId, lower(args.token), lower(args.poolId), lower(args.deployer), lower(data.token.creatorFeeRecipient), lower(args.pairToken), args.launchConfigId.toString(), Number(args.poolFee), data.token.name, data.token.symbol, data.token.decimals, data.pair.symbol, data.pair.decimals, log.blockNumber.toString(), block.time, log.transactionHash, log.logIndex]);
          pools.set(lower(args.poolId), { token: lower(args.token), pair: lower(args.pairToken), tokenDecimals: data.token.decimals, pairDecimals: data.pair.decimals });
          tracked.add(lower(args.token));
          changed.add(lower(args.token));
        } else if (eventName === "LaunchPositionMinted") {
          await tx.query(`UPDATE launches SET position_id=$3,tick_lower=$4,tick_upper=$5,liquidity=$6,token_amount=$7,phantom_quote=$8 WHERE chain_id=$1 AND token_address=$2`, [config.chainId, lower(args.token), args.positionId.toString(), Number(args.tickLower), Number(args.tickUpper), args.liquidity.toString(), args.tokenAmount.toString(), args.phantomQuote.toString()]);
          changed.add(lower(args.token));
        } else if (eventName === "CreatorFeeRecipientUpdated") {
          await tx.query(`UPDATE launches SET creator_fee_recipient=$3 WHERE chain_id=$1 AND token_address=$2`, [config.chainId, lower(args.token), lower(args.newRecipient)]);
        } else if (eventName === "Swap") {
          const market = pools.get(lower(args.id));
          const sender = routedSenders.get(routedTradeKey(log.transactionHash, args.id)) || lower(args.sender);
          const first = tokenIsCurrency0(market.token, market.pair);
          const volumes = tradeVolumes({ amount0: args.amount0, amount1: args.amount1, tokenIsCurrency0: first });
          const price = quotePerToken({ sqrtPriceX96: args.sqrtPriceX96, tokenIsCurrency0: first, tokenDecimals: market.tokenDecimals ?? 18, pairDecimals: market.pairDecimals ?? 18 });
          const inserted = await tx.query(`INSERT INTO trades(chain_id,pool_id,token_address,sender,amount0,amount1,sqrt_price_x96,liquidity,tick,fee,pair_address,token_is_currency0,price_quote_per_token,token_volume,quote_volume,block_number,block_time,transaction_hash,log_index)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) ON CONFLICT DO NOTHING RETURNING 1`,
          [config.chainId, lower(args.id), market.token, sender, args.amount0.toString(), args.amount1.toString(), args.sqrtPriceX96.toString(), args.liquidity.toString(), Number(args.tick), Number(args.fee), market.pair, first, price, volumes.tokenVolume.toString(), volumes.quoteVolume.toString(), log.blockNumber.toString(), block.time, log.transactionHash, log.logIndex]);
          if (inserted.rowCount) await upsertCandles(tx, { chainId: config.chainId, tokenAddress: market.token, price, ...volumes, blockNumber: log.blockNumber, blockTime: block.time, logIndex: log.logIndex });
          changed.add(market.token);
        } else if (eventName === "Transfer") {
          const token = lower(log.address);
          await applyTransfer(tx, { chainId: config.chainId, tokenAddress: token, from: lower(args.from), to: lower(args.to), amount: args.value, blockNumber: log.blockNumber, blockTime: block.time, transactionHash: log.transactionHash, logIndex: log.logIndex });
          changed.add(token);
        } else if (eventName === "FeesCollected") {
          await tx.query(`INSERT INTO fee_collections(chain_id,token_address,currency0,currency1,protocol_amount0,protocol_amount1,creator_amount0,creator_amount1,block_number,block_time,transaction_hash,log_index)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING`, [config.chainId, lower(args.token), lower(args.currency0), lower(args.currency1), args.protocolAmount0.toString(), args.protocolAmount1.toString(), args.creatorAmount0.toString(), args.creatorAmount1.toString(), log.blockNumber.toString(), block.time, log.transactionHash, log.logIndex]);
        } else if (["Claimed", "ClaimedToken", "RewardClaimed"].includes(eventName)) {
          await tx.query(`INSERT INTO fee_claims(chain_id,recipient,token_address,amount,block_number,block_time,transaction_hash,log_index)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`, [config.chainId, lower(args.recipient), args.token ? lower(args.token) : args.currency ? lower(args.currency) : null, args.amount.toString(), log.blockNumber.toString(), block.time, log.transactionHash, log.logIndex]);
        } else if (eventName === "EpochFunded") {
          await tx.query(`INSERT INTO reward_funding(chain_id,epoch_id,currency,amount,block_number,block_time,transaction_hash,log_index) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`, [config.chainId, args.epochId.toString(), lower(args.currency), args.amount.toString(), log.blockNumber.toString(), block.time, log.transactionHash, log.logIndex]);
        } else if (eventName === "EpochFinalized") {
          await tx.query(`INSERT INTO reward_finalizations(chain_id,epoch_id,currency,total_amount,recipients,amounts,block_number,block_time,transaction_hash,log_index)
            VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10) ON CONFLICT(chain_id,epoch_id,currency) DO NOTHING`, [config.chainId, args.epochId.toString(), lower(args.currency), args.totalAmount.toString(), json(args.recipients), json(args.amounts), log.blockNumber.toString(), block.time, log.transactionHash, log.logIndex]);
        }
      }
      const checkpoint = blocks.get(String(toBlock));
      await tx.query(`UPDATE indexer_state SET cursor_block=$2,cursor_block_hash=$3,updated_at=now() WHERE chain_id=$1`, [config.chainId, toBlock.toString(), checkpoint.hash]);
    });
    for (const tokenAddress of changed) eventHub?.publish({ type: "market.updated", chainId: config.chainId, tokenAddress, blockNumber: toBlock.toString(), confirmed: true });
    return events.length;
  }

  async function syncOnce() {
    await ensureState();
    let current = await reconcileReorg(await state());
    const head = await client.getBlockNumber();
    const target = head > config.confirmations ? head - config.confirmations : 0n;
    let range;
    while (!stopped && (range = nextRange(current.cursor, target, config.batchSize))) {
      const count = await ingestRange(range.fromBlock, range.toBlock);
      const checkpoint = await client.getBlock({ blockNumber: range.toBlock });
      current = { cursor: range.toBlock, hash: checkpoint.hash };
      logger.info(`Indexed ${range.fromBlock}-${range.toBlock}: ${count} events.`);
    }
    return { cursor: current.cursor, cursorBlockHash: current.hash, target };
  }

  async function run() {
    while (!stopped) {
      let waitMs = config.pollMs;
      try {
        const completed = await syncOnce();
        runtime.consecutiveFailures = 0;
        runtime.lastSuccessAt = new Date().toISOString();
        runtime.lastCursor = completed.cursor.toString();
        runtime.lastTarget = completed.target.toString();
      } catch (error) {
        runtime.consecutiveFailures += 1;
        runtime.lastErrorAt = new Date().toISOString();
        waitMs = retryBackoff(runtime.consecutiveFailures, config.pollMs, config.rpcMaxBackoffMs);
        logger.error(JSON.stringify({ event: "indexer.sync_failed", failures: runtime.consecutiveFailures, retryInMs: waitMs, errorType: error?.name || "Error", errorCode: error?.code || null }));
      }
      if (!stopped) await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  return { run, syncOnce, ingestRange, stop: () => { stopped = true; }, client, status: () => ({ ...runtime }) };
}
