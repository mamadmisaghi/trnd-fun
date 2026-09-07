const RPC_URLS = [
  "https://46630.rpc.thirdweb.com",
  "https://rpc.testnet.chain.robinhood.com",
];
const CHAIN_ID = 46630;
const FACTORY = "0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C";
const POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
const FACTORY_DEPLOY_TX = "0xf2c907e57fb639554d1caa94ed02e54cf0a18c17d061d001e62978b96cf44982";
const TOPICS = {
  launch: "0xb6c7b1c782b79bdb5091830e037f9ebc94bdc6e5b07b5cff47220272a2b360e8",
  swap: "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f",
};
const PAIRS = {
  "0x0000000000000000000000000000000000000000": "ETH",
  "0x20a887523fbbf0024eb46ee672df15a95521e680": "USDG",
  "0xc9f9c86933092bbbfff3ccb4b105a4a94bf3bd4e": "TSLA",
};

const json = (value, status = 200) => new Response(JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type", "cache-control": "no-store" },
});

async function rpc(method, params = []) {
  let lastError = null;
  for (const rpcUrl of RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(8_000),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) throw new Error(payload.error?.message || `RPC ${response.status}`);
      return payload.result;
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error("All RPC endpoints failed");
}

const hexNumber = (value) => Number.parseInt(value || "0x0", 16);
const addressWord = (word) => `0x${word.slice(-40)}`.toLowerCase();
const topicAddress = (topic) => `0x${topic.slice(-40)}`.toLowerCase();
const words = (data) => (data || "0x").slice(2).match(/.{64}/g) || [];
const signed = (word) => { const value = BigInt(`0x${word}`); return value >= (1n << 255n) ? value - (1n << 256n) : value; };

function decodeText(result) {
  if (!result || result === "0x") return null;
  try {
    const body = result.slice(2);
    const offset = Number.parseInt(body.slice(0, 64), 16) * 2;
    const length = Number.parseInt(body.slice(offset, offset + 64), 16) * 2;
    const hex = body.slice(offset + 64, offset + 64 + length);
    let encoded = "";
    for (let i = 0; i < hex.length; i += 2) encoded += `%${hex.slice(i, i + 2)}`;
    return decodeURIComponent(encoded);
  } catch { return null; }
}

async function tokenText(token, selector) {
  try { return decodeText(await rpc("eth_call", [{ to: token, data: selector }, "latest"])); }
  catch { return null; }
}

async function ensureState(db) {
  const found = await db.prepare("SELECT next_block FROM indexer_state WHERE chain_id = ?").bind(CHAIN_ID).first();
  if (found) return Number(found.next_block);
  const receipt = await rpc("eth_getTransactionReceipt", [FACTORY_DEPLOY_TX]);
  const start = hexNumber(receipt?.blockNumber);
  await db.prepare("INSERT INTO indexer_state(chain_id, next_block) VALUES (?, ?)").bind(CHAIN_ID, start).run();
  return start;
}

async function ingestLaunch(db, log) {
  const data = words(log.data);
  const token = topicAddress(log.topics[1]);
  const poolId = log.topics[2].toLowerCase();
  const deployer = topicAddress(log.topics[3]);
  const pair = addressWord(data[0]);
  const [name, symbol] = await Promise.all([tokenText(token, "0x06fdde03"), tokenText(token, "0x95d89b41")]);
  await db.prepare(`INSERT INTO launches
    (token_address,pool_id,deployer,pair_address,pair_symbol,token_name,token_symbol,launch_config_id,pool_fee,block_number,transaction_hash,log_index)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(token_address) DO UPDATE SET
      pool_id=excluded.pool_id, deployer=excluded.deployer, pair_address=excluded.pair_address,
      pair_symbol=excluded.pair_symbol, token_name=excluded.token_name, token_symbol=excluded.token_symbol,
      launch_config_id=excluded.launch_config_id, pool_fee=excluded.pool_fee,
      block_number=excluded.block_number, transaction_hash=excluded.transaction_hash,
      log_index=excluded.log_index`).bind(
      token, poolId, deployer, pair, PAIRS[pair] || null, name, symbol,
      BigInt(`0x${data[1]}`).toString(), Number(BigInt(`0x${data[2]}`)), hexNumber(log.blockNumber), log.transactionHash.toLowerCase(), hexNumber(log.logIndex),
    ).run();
}

async function ingestSwap(db, log) {
  const data = words(log.data);
  await db.prepare(`INSERT OR IGNORE INTO trades
    (transaction_hash,log_index,pool_id,sender,amount0,amount1,sqrt_price_x96,liquidity,tick,fee,block_number)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(
      log.transactionHash.toLowerCase(), hexNumber(log.logIndex), log.topics[1].toLowerCase(), topicAddress(log.topics[2]),
      signed(data[0]).toString(), signed(data[1]).toString(), BigInt(`0x${data[2]}`).toString(), BigInt(`0x${data[3]}`).toString(),
      Number(signed(data[4])), Number(BigInt(`0x${data[5]}`)), hexNumber(log.blockNumber),
    ).run();
}

async function sync(db, requestedBatches = 4) {
  let from = await ensureState(db);
  const head = Math.max(0, hexNumber(await rpc("eth_blockNumber")) - 3);
  let batches = 0;
  let events = 0;
  while (from <= head && batches < Math.min(20, requestedBatches)) {
    const to = Math.min(head, from + 249);
    const filter = { fromBlock: `0x${from.toString(16)}`, toBlock: `0x${to.toString(16)}` };
    const launches = await rpc("eth_getLogs", [{ ...filter, address: FACTORY, topics: [TOPICS.launch] }]);
    for (const log of launches) await ingestLaunch(db, log);
    const pools = await db.prepare("SELECT pool_id FROM launches").all();
    const poolIds = (pools.results || []).map((item) => item.pool_id);
    const swaps = poolIds.length
      ? await rpc("eth_getLogs", [{ ...filter, address: POOL_MANAGER, topics: [TOPICS.swap, poolIds] }])
      : [];
    for (const log of swaps) await ingestSwap(db, log);
    const block = await rpc("eth_getBlockByNumber", [`0x${to.toString(16)}`, false]);
    await db.prepare("UPDATE indexer_state SET next_block=?, last_block_hash=?, updated_at=CURRENT_TIMESTAMP WHERE chain_id=?").bind(to + 1, block.hash, CHAIN_ID).run();
    from = to + 1;
    batches += 1;
    events += launches.length + swaps.length;
  }
  return { chainId: CHAIN_ID, head, nextBlock: from, caughtUp: from > head, batches, events };
}

async function ingestTransaction(db, transactionHash) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash || "")) throw new Error("A valid transaction hash is required");
  const receipt = await rpc("eth_getTransactionReceipt", [transactionHash]);
  if (!receipt?.blockNumber) throw new Error("Transaction receipt is not available yet");
  let launches = 0;
  let swaps = 0;
  for (const log of receipt.logs || []) {
    if (log.address?.toLowerCase() === FACTORY.toLowerCase() && log.topics?.[0]?.toLowerCase() === TOPICS.launch) {
      await ingestLaunch(db, log);
      launches += 1;
    }
  }
  for (const log of receipt.logs || []) {
    if (log.address?.toLowerCase() !== POOL_MANAGER.toLowerCase() || log.topics?.[0]?.toLowerCase() !== TOPICS.swap) continue;
    const pool = await db.prepare("SELECT 1 FROM launches WHERE pool_id=?").bind(log.topics[1].toLowerCase()).first();
    if (!pool) continue;
    await ingestSwap(db, log);
    swaps += 1;
  }
  return { transactionHash: transactionHash.toLowerCase(), blockNumber: hexNumber(receipt.blockNumber), launches, swaps };
}

async function handle(request, env, ctx) {
  if (!env.DB) return json({ error: "Database binding unavailable" }, 503);
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type" } });
  if (url.pathname === "/") return json({ service: "ViralTerminal Testnet Indexer", chainId: CHAIN_ID, endpoints: ["/health", "/sync", "/v1/ingest", "/v1/markets", "/v1/markets/:token", "/v1/markets/:token/trades"] });
  if (url.pathname === "/health") {
    const state = await env.DB.prepare("SELECT * FROM indexer_state WHERE chain_id=?").bind(CHAIN_ID).first();
    return json({ ok: true, chainId: CHAIN_ID, state });
  }
  if (url.pathname === "/sync") return json(await sync(env.DB, Number(url.searchParams.get("batches") || 8)));
  if (url.pathname === "/v1/ingest" && request.method === "POST") {
    const body = await request.json();
    return json(await ingestTransaction(env.DB, body.transactionHash));
  }
  if (url.pathname === "/v1/markets") {
    const result = await env.DB.prepare(`SELECT l.*,
      (SELECT COUNT(*) FROM trades t WHERE t.pool_id=l.pool_id) AS trade_count,
      (SELECT MAX(block_number) FROM trades t WHERE t.pool_id=l.pool_id) AS last_trade_block
      FROM launches l ORDER BY block_number DESC, log_index DESC LIMIT ?`).bind(Math.min(100, Number(url.searchParams.get("limit") || 50))).all();
    return json({ data: result.results || [] });
  }
  const tradeMatch = url.pathname.match(/^\/v1\/markets\/(0x[a-fA-F0-9]{40})\/trades$/);
  if (tradeMatch) {
    const market = await env.DB.prepare("SELECT pool_id FROM launches WHERE token_address=?").bind(tradeMatch[1].toLowerCase()).first();
    if (!market) return json({ error: "Market not found" }, 404);
    const result = await env.DB.prepare("SELECT * FROM trades WHERE pool_id=? ORDER BY block_number DESC, log_index DESC LIMIT 100").bind(market.pool_id).all();
    return json({ data: result.results || [] });
  }
  const marketMatch = url.pathname.match(/^\/v1\/markets\/(0x[a-fA-F0-9]{40})$/);
  if (marketMatch) {
    const market = await env.DB.prepare("SELECT * FROM launches WHERE token_address=?").bind(marketMatch[1].toLowerCase()).first();
    return market ? json({ data: market }) : json({ error: "Market not found" }, 404);
  }
  return json({ error: "Not found" }, 404);
}

export default {
  fetch(request, env, ctx) { return handle(request, env, ctx).catch((error) => json({ error: "Indexer unavailable", detail: error.message }, 500)); },
};
