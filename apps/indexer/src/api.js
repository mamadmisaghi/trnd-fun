import http from "node:http";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const intervals = new Map([["1m", 60], ["5m", 300], ["15m", 900], ["1h", 3_600], ["1d", 86_400]]);
const corsHeaders = (origin) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type,last-event-id",
  vary: "origin",
});
const send = (res, status, body, origin) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...corsHeaders(origin) });
  res.end(JSON.stringify(body));
};
const limitOf = (url, fallback = 50, maximum = 200) => {
  const value = Number.parseInt(url.searchParams.get("limit") || String(fallback), 10);
  return Number.isFinite(value) ? Math.min(maximum, Math.max(1, value)) : fallback;
};
const tokenFrom = (pathname, suffix = "") => pathname.match(new RegExp(`^/v1/markets/(0x[0-9a-fA-F]{40})${suffix}$`));

const marketSelect = `
  SELECT l.*,
    latest.price_quote_per_token AS latest_price,
    latest.block_time AS latest_trade_time,
    COALESCE(day.token_volume,0)::text AS token_volume_24h,
    COALESCE(day.quote_volume,0)::text AS quote_volume_24h,
    COALESCE(day.trade_count,0)::integer AS trade_count_24h,
    COALESCE(holders.holder_count,0)::integer AS holder_count
  FROM launches l
  LEFT JOIN LATERAL (
    SELECT price_quote_per_token,block_time FROM trades t
    WHERE t.chain_id=l.chain_id AND t.token_address=l.token_address
    ORDER BY block_number DESC,log_index DESC LIMIT 1
  ) latest ON true
  LEFT JOIN LATERAL (
    SELECT sum(token_volume) token_volume,sum(quote_volume) quote_volume,count(*) trade_count FROM trades t
    WHERE t.chain_id=l.chain_id AND t.token_address=l.token_address AND t.block_time>=now()-interval '24 hours'
  ) day ON true
  LEFT JOIN LATERAL (
    SELECT count(*) holder_count FROM holder_balances h
    WHERE h.chain_id=l.chain_id AND h.token_address=l.token_address AND h.balance>0
  ) holders ON true`;

export function startApi(config, db, eventHub, indexer = null) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders(config.corsOrigin));
      return res.end();
    }
    if (req.method !== "GET") return send(res, 405, { error: "method_not_allowed" }, config.corsOrigin);
    try {
      if (url.pathname === "/health") {
        await db.query("SELECT 1");
        const state = await db.query(`SELECT cursor_block,cursor_block_hash,updated_at FROM indexer_state WHERE chain_id=$1`, [config.chainId]);
        return send(res, 200, { ok: true, chainId: config.chainId, indexer: state.rows[0] || null, runtime: indexer?.status?.() || null, subscribers: eventHub?.size || 0 }, config.corsOrigin);
      }
      if (url.pathname === "/ready") {
        if (!indexer?.client) return send(res, 503, { ready: false, reason: "chain_client_unavailable" }, config.corsOrigin);
        const [state, head] = await Promise.all([
          db.query(`SELECT cursor_block,cursor_block_hash,updated_at FROM indexer_state WHERE chain_id=$1`, [config.chainId]),
          indexer.client.getBlockNumber(),
        ]);
        const row = state.rows[0];
        if (!row) return send(res, 503, { ready: false, reason: "indexer_state_missing" }, config.corsOrigin);
        const target = head > config.confirmations ? head - config.confirmations : 0n;
        const cursor = BigInt(row.cursor_block);
        const lagBlocks = target > cursor ? target - cursor : 0n;
        const ready = Boolean(row.cursor_block_hash) && lagBlocks <= config.readinessMaxLagBlocks && (indexer.status?.().consecutiveFailures || 0) === 0;
        return send(res, ready ? 200 : 503, { ready, chainId: config.chainId, head: head.toString(), confirmedTarget: target.toString(), cursor: cursor.toString(), lagBlocks: lagBlocks.toString(), maximumLagBlocks: config.readinessMaxLagBlocks.toString(), runtime: indexer.status?.() || null }, config.corsOrigin);
      }
      if (url.pathname === "/v1/stream") {
        const token = url.searchParams.get("token")?.toLowerCase();
        if (token && !addressPattern.test(token)) return send(res, 400, { error: "invalid_token" }, config.corsOrigin);
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no", ...corsHeaders(config.corsOrigin) });
        const state = await db.query(`SELECT cursor_block FROM indexer_state WHERE chain_id=$1`, [config.chainId]);
        res.write(`retry: ${config.sseRetryMs}\nevent: ready\ndata: ${JSON.stringify({ chainId: config.chainId, cursorBlock: state.rows[0]?.cursor_block || null, confirmedOnly: true })}\n\n`);
        const unsubscribe = eventHub?.subscribe((event) => {
          if (event.confirmed === true && (!token || !event.tokenAddress || event.tokenAddress === token)) {
            const id = event.blockNumber ? `id: ${event.blockNumber}\n` : "";
            res.write(`${id}event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
          }
        });
        const heartbeat = setInterval(() => res.write(`: heartbeat ${Date.now()}\n\n`), config.sseHeartbeatMs);
        req.on("close", () => { clearInterval(heartbeat); unsubscribe?.(); });
        return;
      }
      if (url.pathname === "/v1/markets") {
        const rows = await db.query(`${marketSelect} WHERE l.chain_id=$1 ORDER BY l.block_number DESC,l.log_index DESC LIMIT $2`, [config.chainId, limitOf(url)]);
        return send(res, 200, { data: rows.rows }, config.corsOrigin);
      }
      const market = tokenFrom(url.pathname);
      if (market) {
        const rows = await db.query(`${marketSelect} WHERE l.chain_id=$1 AND l.token_address=$2`, [config.chainId, market[1].toLowerCase()]);
        return send(res, rows.rowCount ? 200 : 404, rows.rowCount ? { data: rows.rows[0] } : { error: "market_not_found" }, config.corsOrigin);
      }
      const trades = tokenFrom(url.pathname, "/trades");
      if (trades) {
        const rows = await db.query(`SELECT * FROM trades WHERE chain_id=$1 AND token_address=$2 ORDER BY block_number DESC,log_index DESC LIMIT $3`, [config.chainId, trades[1].toLowerCase(), limitOf(url, 100)]);
        return send(res, 200, { data: rows.rows }, config.corsOrigin);
      }
      const candles = tokenFrom(url.pathname, "/candles");
      if (candles) {
        const label = url.searchParams.get("interval") || "5m";
        const interval = intervals.get(label);
        if (!interval) return send(res, 400, { error: "invalid_interval", supported: [...intervals.keys()] }, config.corsOrigin);
        const rows = await db.query(`SELECT * FROM candles WHERE chain_id=$1 AND token_address=$2 AND interval_seconds=$3 ORDER BY bucket_start DESC LIMIT $4`, [config.chainId, candles[1].toLowerCase(), interval, limitOf(url, 120, 1_000)]);
        rows.rows.reverse();
        return send(res, 200, { data: rows.rows, interval: label }, config.corsOrigin);
      }
      const holders = tokenFrom(url.pathname, "/holders");
      if (holders) {
        const rows = await db.query(`SELECT holder_address,balance,updated_block FROM holder_balances WHERE chain_id=$1 AND token_address=$2 AND balance>0 ORDER BY balance DESC LIMIT $3`, [config.chainId, holders[1].toLowerCase(), limitOf(url, 100, 1_000)]);
        return send(res, 200, { data: rows.rows }, config.corsOrigin);
      }
      const fees = url.pathname.match(/^\/v1\/creators\/(0x[0-9a-fA-F]{40})\/fees$/);
      if (fees) {
        const [collections, claims] = await Promise.all([
          db.query(`SELECT f.* FROM fee_collections f JOIN launches l ON l.chain_id=f.chain_id AND l.token_address=f.token_address WHERE f.chain_id=$1 AND l.creator_fee_recipient=$2 ORDER BY f.block_number DESC LIMIT 200`, [config.chainId, fees[1].toLowerCase()]),
          db.query(`SELECT * FROM fee_claims WHERE chain_id=$1 AND recipient=$2 ORDER BY block_number DESC LIMIT 200`, [config.chainId, fees[1].toLowerCase()]),
        ]);
        return send(res, 200, { data: { collections: collections.rows, claims: claims.rows } }, config.corsOrigin);
      }
      return send(res, 404, { error: "not_found" }, config.corsOrigin);
    } catch (error) {
      console.error(error);
      return send(res, 500, { error: "internal_error" }, config.corsOrigin);
    }
  });
  server.listen(config.apiPort, "0.0.0.0", () => console.log(`Indexer API listening on :${config.apiPort}`));
  return server;
}
