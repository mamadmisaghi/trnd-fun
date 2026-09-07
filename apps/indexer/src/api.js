import http from "node:http";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const send = (res, status, body, origin) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": origin, "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};
const limitOf = (url, fallback = 50) => Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get("limit") || String(fallback), 10)));

export function startApi(config, db) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    try {
      if (url.pathname === "/health") {
        const state = await db.query(`SELECT cursor_block,updated_at FROM indexer_state WHERE chain_id=$1`, [config.chainId]);
        return send(res, 200, { ok: true, chainId: config.chainId, indexer: state.rows[0] || null }, config.corsOrigin);
      }
      if (url.pathname === "/v1/markets") {
        const rows = await db.query(`SELECT * FROM launches WHERE chain_id=$1 ORDER BY block_number DESC,log_index DESC LIMIT $2`, [config.chainId, limitOf(url)]);
        return send(res, 200, { data: rows.rows }, config.corsOrigin);
      }
      const market = url.pathname.match(/^\/v1\/markets\/(0x[0-9a-fA-F]{40})$/);
      if (market) {
        const rows = await db.query(`SELECT * FROM launches WHERE chain_id=$1 AND token_address=$2`, [config.chainId, market[1].toLowerCase()]);
        return send(res, rows.rowCount ? 200 : 404, rows.rowCount ? { data: rows.rows[0] } : { error: "market_not_found" }, config.corsOrigin);
      }
      const trades = url.pathname.match(/^\/v1\/markets\/(0x[0-9a-fA-F]{40})\/trades$/);
      if (trades) {
        const rows = await db.query(`SELECT * FROM trades WHERE chain_id=$1 AND token_address=$2 ORDER BY block_number DESC,log_index DESC LIMIT $3`, [config.chainId, trades[1].toLowerCase(), limitOf(url, 100)]);
        return send(res, 200, { data: rows.rows }, config.corsOrigin);
      }
      const fees = url.pathname.match(/^\/v1\/creators\/(0x[0-9a-fA-F]{40})\/fees$/);
      if (fees && addressPattern.test(fees[1])) {
        const [collections, claims] = await Promise.all([
          db.query(`SELECT f.* FROM fee_collections f JOIN launches l ON l.chain_id=f.chain_id AND l.token_address=f.token_address WHERE f.chain_id=$1 AND l.creator_fee_recipient=$2 ORDER BY f.block_number DESC LIMIT 200`, [config.chainId, fees[1].toLowerCase()]),
          db.query(`SELECT * FROM fee_claims WHERE chain_id=$1 AND recipient=$2 ORDER BY block_number DESC LIMIT 200`, [config.chainId, fees[1].toLowerCase()]),
        ]);
        return send(res, 200, { data: { collections: collections.rows, claims: claims.rows } }, config.corsOrigin);
      }
      return send(res, 404, { error: "not_found" }, config.corsOrigin);
    } catch (error) { console.error(error); return send(res, 500, { error: "internal_error" }, config.corsOrigin); }
  });
  server.listen(config.apiPort, "0.0.0.0", () => console.log(`Indexer API listening on :${config.apiPort}`));
  return server;
}
