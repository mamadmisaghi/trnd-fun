import { createPublicClient, decodeEventLog, http } from "viem";
import { factoryViewAbi, protocolAbi, swapEvent, tokenAbi } from "./abi.js";
import { nextRange, rewindHeight } from "./ranges.js";

const json = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item);
const lower = (value) => value?.toLowerCase();

export function createIndexer(config, db, logger = console) {
  const client = createPublicClient({ transport: http(config.rpcUrl, { timeout: 25_000, retryCount: 3 }) });
  let stopped = false;

  async function ensureState() {
    await db.query(
      `INSERT INTO indexer_state(chain_id, cursor_block) VALUES ($1,$2) ON CONFLICT (chain_id) DO NOTHING`,
      [config.chainId, (config.startBlock - 1n).toString()],
    );
  }

  async function state() {
    const result = await db.query(`SELECT cursor_block, cursor_block_hash FROM indexer_state WHERE chain_id=$1`, [config.chainId]);
    return { cursor: BigInt(result.rows[0].cursor_block), hash: result.rows[0].cursor_block_hash };
  }

  async function reconcileReorg(current) {
    if (!current.hash || current.cursor < config.startBlock) return current;
    const block = await client.getBlock({ blockNumber: current.cursor });
    if (lower(block.hash) === lower(current.hash)) return current;
    const resume = rewindHeight(current.cursor, config.startBlock, config.reorgRewind);
    const nextCursor = resume - 1n;
    const previous = nextCursor >= 0n ? await client.getBlock({ blockNumber: nextCursor }) : null;
    await db.transaction(async (tx) => {
      for (const table of ["raw_events", "trades", "fee_collections", "fee_claims", "launches"]) {
        await tx.query(`DELETE FROM ${table} WHERE chain_id=$1 AND block_number >= $2`, [config.chainId, resume.toString()]);
      }
      await tx.query(`UPDATE indexer_state SET cursor_block=$2,cursor_block_hash=$3,updated_at=now() WHERE chain_id=$1`, [config.chainId, nextCursor.toString(), previous?.hash || null]);
    });
    logger.warn(`Reorg detected; rewound to block ${nextCursor}.`);
    return { cursor: nextCursor, hash: previous?.hash || null };
  }

  async function tokenMetadata(token) {
    const reads = ["name", "symbol", "decimals"].map((functionName) => client.readContract({ address: token, abi: tokenAbi, functionName }));
    const launch = client.readContract({ address: config.contracts.factory, abi: factoryViewAbi, functionName: "getLaunchedToken", args: [token] });
    const [name, symbol, decimals, record] = await Promise.all([...reads, launch]);
    return { name, symbol, decimals: Number(decimals), creatorFeeRecipient: record.creatorFeeRecipient };
  }

  async function ingestRange(fromBlock, toBlock) {
    const protocolAddresses = [config.contracts.factory, config.contracts.locker, config.contracts.feeEscrow];
    const [protocolLogs, swapLogs, checkpoint] = await Promise.all([
      client.getLogs({ address: protocolAddresses, fromBlock, toBlock }),
      client.getLogs({ address: config.contracts.poolManager, event: swapEvent, fromBlock, toBlock }),
      client.getBlock({ blockNumber: toBlock }),
    ]);
    const pools = await db.query(`SELECT pool_id,token_address FROM launches WHERE chain_id=$1`, [config.chainId]);
    const poolTokens = new Map(pools.rows.map((row) => [lower(row.pool_id), lower(row.token_address)]));
    const decoded = [];
    for (const log of protocolLogs) {
      try { decoded.push({ log, ...decodeEventLog({ abi: protocolAbi, data: log.data, topics: log.topics }) }); } catch {}
    }
    for (const log of swapLogs) {
      const event = decodeEventLog({ abi: [swapEvent], data: log.data, topics: log.topics });
      decoded.push({ log, ...event });
    }
    decoded.sort((a, b) => Number(a.log.blockNumber - b.log.blockNumber) || a.log.logIndex - b.log.logIndex);

    await db.transaction(async (tx) => {
      for (const event of decoded) {
        const { log, eventName, args } = event;
        if (eventName === "Swap" && !poolTokens.has(lower(args.id))) continue;
        const common = [config.chainId, log.blockNumber.toString(), log.blockHash, log.transactionHash, log.transactionIndex, log.logIndex];
        await tx.query(
          `INSERT INTO raw_events(chain_id,block_number,block_hash,transaction_hash,transaction_index,log_index,contract_address,event_name,event_args)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) ON CONFLICT DO NOTHING`,
          [...common, lower(log.address), eventName, json(args)],
        );
        if (eventName === "TokenLaunched") {
          let metadata = { name: null, symbol: null, decimals: null, creatorFeeRecipient: null };
          try { metadata = await tokenMetadata(args.token); } catch (error) { logger.warn(`Metadata read failed for ${args.token}: ${error.shortMessage || error.message}`); }
          await tx.query(
            `INSERT INTO launches(chain_id,token_address,pool_id,deployer,creator_fee_recipient,pair_token,launch_config_id,pool_fee,token_name,token_symbol,token_decimals,block_number,transaction_hash,log_index)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             ON CONFLICT(chain_id,token_address) DO UPDATE SET pool_id=excluded.pool_id,creator_fee_recipient=excluded.creator_fee_recipient`,
            [config.chainId, lower(args.token), lower(args.poolId), lower(args.deployer), lower(metadata.creatorFeeRecipient), lower(args.pairToken), args.launchConfigId.toString(), Number(args.poolFee), metadata.name, metadata.symbol, metadata.decimals, log.blockNumber.toString(), log.transactionHash, log.logIndex],
          );
          poolTokens.set(lower(args.poolId), lower(args.token));
        } else if (eventName === "LaunchPositionMinted") {
          await tx.query(
            `UPDATE launches SET position_id=$3,tick_lower=$4,tick_upper=$5,liquidity=$6,token_amount=$7,phantom_quote=$8 WHERE chain_id=$1 AND token_address=$2`,
            [config.chainId, lower(args.token), args.positionId.toString(), Number(args.tickLower), Number(args.tickUpper), args.liquidity.toString(), args.tokenAmount.toString(), args.phantomQuote.toString()],
          );
        } else if (eventName === "CreatorFeeRecipientUpdated") {
          await tx.query(`UPDATE launches SET creator_fee_recipient=$3 WHERE chain_id=$1 AND token_address=$2`, [config.chainId, lower(args.token), lower(args.newRecipient)]);
        } else if (eventName === "Swap") {
          const token = poolTokens.get(lower(args.id));
          if (token) await tx.query(
            `INSERT INTO trades(chain_id,pool_id,token_address,sender,amount0,amount1,sqrt_price_x96,liquidity,tick,fee,block_number,transaction_hash,log_index)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING`,
            [config.chainId, lower(args.id), token, lower(args.sender), args.amount0.toString(), args.amount1.toString(), args.sqrtPriceX96.toString(), args.liquidity.toString(), Number(args.tick), Number(args.fee), log.blockNumber.toString(), log.transactionHash, log.logIndex],
          );
        } else if (eventName === "FeesCollected") {
          await tx.query(
            `INSERT INTO fee_collections(chain_id,token_address,currency0,currency1,protocol_amount0,protocol_amount1,creator_amount0,creator_amount1,block_number,transaction_hash,log_index)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
            [config.chainId, lower(args.token), lower(args.currency0), lower(args.currency1), args.protocolAmount0.toString(), args.protocolAmount1.toString(), args.creatorAmount0.toString(), args.creatorAmount1.toString(), log.blockNumber.toString(), log.transactionHash, log.logIndex],
          );
        } else if (eventName === "Claimed" || eventName === "ClaimedToken") {
          await tx.query(
            `INSERT INTO fee_claims(chain_id,recipient,token_address,amount,block_number,transaction_hash,log_index)
             VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
            [config.chainId, lower(args.recipient), eventName === "ClaimedToken" ? lower(args.token) : null, args.amount.toString(), log.blockNumber.toString(), log.transactionHash, log.logIndex],
          );
        }
      }
      await tx.query(`UPDATE indexer_state SET cursor_block=$2,cursor_block_hash=$3,updated_at=now() WHERE chain_id=$1`, [config.chainId, toBlock.toString(), checkpoint.hash]);
    });
    return decoded.length;
  }

  async function syncOnce() {
    await ensureState();
    let current = await reconcileReorg(await state());
    const head = await client.getBlockNumber();
    const target = head > config.confirmations ? head - config.confirmations : 0n;
    let range;
    while (!stopped && (range = nextRange(current.cursor, target, config.batchSize))) {
      const count = await ingestRange(range.fromBlock, range.toBlock);
      current = { cursor: range.toBlock, hash: null };
      logger.info(`Indexed ${range.fromBlock}-${range.toBlock}: ${count} protocol events.`);
    }
  }

  async function run() {
    while (!stopped) {
      try { await syncOnce(); } catch (error) { logger.error(error); }
      if (!stopped) await new Promise((resolve) => setTimeout(resolve, config.pollMs));
    }
  }

  return { run, syncOnce, stop: () => { stopped = true; }, client };
}
