export const CANDLE_INTERVALS = Object.freeze([60, 300, 900, 3_600, 86_400]);
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const Q192 = 2n ** 192n;

export function absolute(value) {
  return value < 0n ? -value : value;
}

export function tokenIsCurrency0(token, pair) {
  return BigInt(token.toLowerCase()) < BigInt(pair.toLowerCase());
}

export function ratioToDecimal(numerator, denominator, scale = 40) {
  if (denominator === 0n) throw new Error("Cannot divide by zero");
  const factor = 10n ** BigInt(scale);
  const scaled = numerator * factor / denominator;
  const raw = scaled.toString().padStart(scale + 1, "0");
  const whole = raw.slice(0, -scale);
  const fraction = raw.slice(-scale).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

export function quotePerToken({ sqrtPriceX96, tokenIsCurrency0: tokenFirst, tokenDecimals, pairDecimals }) {
  const squared = BigInt(sqrtPriceX96) ** 2n;
  const tokenScale = 10n ** BigInt(tokenDecimals);
  const pairScale = 10n ** BigInt(pairDecimals);
  return tokenFirst
    ? ratioToDecimal(squared * tokenScale, Q192 * pairScale)
    : ratioToDecimal(Q192 * tokenScale, squared * pairScale);
}

export function tradeVolumes({ amount0, amount1, tokenIsCurrency0: tokenFirst }) {
  return tokenFirst
    ? { tokenVolume: absolute(BigInt(amount0)), quoteVolume: absolute(BigInt(amount1)) }
    : { tokenVolume: absolute(BigInt(amount1)), quoteVolume: absolute(BigInt(amount0)) };
}

export function bucketStart(blockTime, intervalSeconds) {
  const epoch = Math.floor(new Date(blockTime).getTime() / 1_000);
  return new Date(Math.floor(epoch / intervalSeconds) * intervalSeconds * 1_000);
}

export async function upsertCandles(tx, trade) {
  for (const interval of CANDLE_INTERVALS) {
    await tx.query(
      `INSERT INTO candles(
         chain_id,token_address,interval_seconds,bucket_start,open,high,low,close,
         token_volume,quote_volume,trade_count,first_block,first_log_index,last_block,last_log_index
       ) VALUES($1,$2,$3,$4,$5,$5,$5,$5,$6,$7,1,$8,$9,$8,$9)
       ON CONFLICT(chain_id,token_address,interval_seconds,bucket_start) DO UPDATE SET
         high=GREATEST(candles.high,excluded.high),
         low=LEAST(candles.low,excluded.low),
         close=CASE WHEN (excluded.last_block,excluded.last_log_index) >= (candles.last_block,candles.last_log_index)
                    THEN excluded.close ELSE candles.close END,
         open=CASE WHEN (excluded.first_block,excluded.first_log_index) < (candles.first_block,candles.first_log_index)
                   THEN excluded.open ELSE candles.open END,
         token_volume=candles.token_volume+excluded.token_volume,
         quote_volume=candles.quote_volume+excluded.quote_volume,
         trade_count=candles.trade_count+1,
         first_block=LEAST(candles.first_block,excluded.first_block),
         first_log_index=CASE WHEN excluded.first_block < candles.first_block THEN excluded.first_log_index
                              WHEN excluded.first_block = candles.first_block THEN LEAST(candles.first_log_index,excluded.first_log_index)
                              ELSE candles.first_log_index END,
         last_block=GREATEST(candles.last_block,excluded.last_block),
         last_log_index=CASE WHEN excluded.last_block > candles.last_block THEN excluded.last_log_index
                             WHEN excluded.last_block = candles.last_block THEN GREATEST(candles.last_log_index,excluded.last_log_index)
                             ELSE candles.last_log_index END`,
      [
        trade.chainId,
        trade.tokenAddress,
        interval,
        bucketStart(trade.blockTime, interval).toISOString(),
        trade.price,
        trade.tokenVolume.toString(),
        trade.quoteVolume.toString(),
        trade.blockNumber.toString(),
        trade.logIndex,
      ],
    );
  }
}

export async function rebuildDerivedData(tx, chainId) {
  await tx.query(`DELETE FROM candles WHERE chain_id=$1`, [chainId]);
  await tx.query(
    `INSERT INTO candles(
       chain_id,token_address,interval_seconds,bucket_start,open,high,low,close,
       token_volume,quote_volume,trade_count,first_block,first_log_index,last_block,last_log_index
     )
     SELECT chain_id,token_address,interval_seconds,bucket_start,
       (array_agg(price_quote_per_token ORDER BY block_number,log_index))[1],
       max(price_quote_per_token),min(price_quote_per_token),
       (array_agg(price_quote_per_token ORDER BY block_number DESC,log_index DESC))[1],
       sum(token_volume),sum(quote_volume),count(*)::integer,
       min(block_number),
       (array_agg(log_index ORDER BY block_number,log_index))[1],
       max(block_number),
       (array_agg(log_index ORDER BY block_number DESC,log_index DESC))[1]
     FROM (
       SELECT t.*, i.interval_seconds,
         to_timestamp(floor(extract(epoch FROM t.block_time) / i.interval_seconds) * i.interval_seconds) AS bucket_start
       FROM trades t CROSS JOIN unnest($2::integer[]) AS i(interval_seconds)
       WHERE t.chain_id=$1 AND t.price_quote_per_token IS NOT NULL AND t.block_time IS NOT NULL
     ) source
     GROUP BY chain_id,token_address,interval_seconds,bucket_start`,
    [chainId, CANDLE_INTERVALS],
  );

  await tx.query(`DELETE FROM holder_balances WHERE chain_id=$1`, [chainId]);
  await tx.query(
    `INSERT INTO holder_balances(chain_id,token_address,holder_address,balance,updated_block)
     SELECT chain_id,token_address,holder_address,sum(delta),max(block_number)
     FROM (
       SELECT chain_id,token_address,from_address AS holder_address,-amount AS delta,block_number
       FROM token_transfers WHERE chain_id=$1 AND from_address<>$2
       UNION ALL
       SELECT chain_id,token_address,to_address AS holder_address,amount AS delta,block_number
       FROM token_transfers WHERE chain_id=$1 AND to_address<>$2
     ) movements
     GROUP BY chain_id,token_address,holder_address
     HAVING sum(delta) >= 0`,
    [chainId, ZERO_ADDRESS],
  );
}

export async function applyTransfer(tx, transfer) {
  const inserted = await tx.query(
    `INSERT INTO token_transfers(
       chain_id,token_address,from_address,to_address,amount,block_number,block_time,transaction_hash,log_index
     ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING 1`,
    [
      transfer.chainId,transfer.tokenAddress,transfer.from,transfer.to,transfer.amount.toString(),
      transfer.blockNumber.toString(),new Date(transfer.blockTime).toISOString(),transfer.transactionHash,transfer.logIndex,
    ],
  );
  if (!inserted.rowCount) return false;

  if (transfer.from !== ZERO_ADDRESS) {
    await tx.query(
      `INSERT INTO holder_balances(chain_id,token_address,holder_address,balance,updated_block)
       VALUES($1,$2,$3,0,$4)
       ON CONFLICT(chain_id,token_address,holder_address) DO UPDATE SET
         balance=holder_balances.balance-$5,updated_block=GREATEST(holder_balances.updated_block,$4)`,
      [transfer.chainId,transfer.tokenAddress,transfer.from,transfer.blockNumber.toString(),transfer.amount.toString()],
    );
  }
  if (transfer.to !== ZERO_ADDRESS) {
    await tx.query(
      `INSERT INTO holder_balances(chain_id,token_address,holder_address,balance,updated_block)
       VALUES($1,$2,$3,$5,$4)
       ON CONFLICT(chain_id,token_address,holder_address) DO UPDATE SET
         balance=holder_balances.balance+$5,updated_block=GREATEST(holder_balances.updated_block,$4)`,
      [transfer.chainId,transfer.tokenAddress,transfer.to,transfer.blockNumber.toString(),transfer.amount.toString()],
    );
  }
  return true;
}
