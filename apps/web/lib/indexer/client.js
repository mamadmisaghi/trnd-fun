export const TESTNET_INDEXER_URL = "https://viral-terminal-testnet-api.gofivahootan.chatgpt.site";

async function indexerFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`${TESTNET_INDEXER_URL}${path}`, {
      cache: "no-store",
      signal: controller.signal,
      ...options,
    });
    if (!response.ok) throw new Error(`Indexer returned ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getIndexedMarkets(limit = 50) {
  const payload = await indexerFetch(`/v1/markets?limit=${limit}`);
  return payload.data || [];
}

export async function getIndexedMarket(tokenAddress) {
  const payload = await indexerFetch(`/v1/markets/${tokenAddress}`);
  return payload.data || null;
}

export async function getIndexedTrades(tokenAddress) {
  const payload = await indexerFetch(`/v1/markets/${tokenAddress}/trades`);
  return payload.data || [];
}

export async function getIndexedCandles(tokenAddress, interval = "5m") {
  const payload = await indexerFetch(`/v1/markets/${tokenAddress}/candles?interval=${interval}&limit=120`);
  return payload.data || [];
}

export async function getIndexedHolders(tokenAddress) {
  const payload = await indexerFetch(`/v1/markets/${tokenAddress}/holders?limit=100`);
  return payload.data || [];
}

export function subscribeToIndexedMarket(tokenAddress, onUpdate, onStatus = () => {}) {
  const source = new EventSource(`${TESTNET_INDEXER_URL}/v1/stream?token=${tokenAddress}`);
  source.addEventListener("ready", () => onStatus("connected"));
  source.addEventListener("market.updated", (event) => {
    onStatus("connected");
    onUpdate(JSON.parse(event.data));
  });
  source.onerror = () => onStatus("reconnecting");
  return () => source.close();
}

export async function indexTransaction(transactionHash) {
  return indexerFetch("/v1/ingest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transactionHash }),
  });
}

export function indexedMarketToToken(market) {
  const address = market.token_address;
  return {
    id: `onchain-${address.slice(2, 10)}`,
    href: `/token/live?address=${address}`,
    name: market.token_name || "ViralTerminal Market",
    ticker: market.token_symbol || "TOKEN",
    image: "/viral-terminal-mark.svg",
    pairAsset: market.pair_symbol || "RWA",
    tokenAddress: address,
    fromSignal: false,
    category: "Testnet",
    marketCap: "TESTNET",
    marketCapNum: 0,
    price: "ONCHAIN",
    change24h: Number(market.trade_count || 0) > 0 ? 0.1 : 0,
    volume24h: `${Number(market.trade_count || 0)} trades`,
    liquidity: "LOCKED",
    holders: 0,
    age: "testnet",
    launchProgress: 100,
    graduated: true,
    sparkline: [10, 10.4, 10.2, 10.8, 11, 10.9, 11.4, 11.7, 11.6, 12.1, 12.4, 12.8],
  };
}
