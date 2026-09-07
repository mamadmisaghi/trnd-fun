const address = (name, fallback) => (process.env[name] || fallback).toLowerCase();
const integer = (name, fallback) => Number.parseInt(process.env[name] || String(fallback), 10);
const boolean = (name, fallback = false) => {
  const value = process.env[name];
  if (value == null) return fallback;
  if (["1", "true", "yes", "on"].includes(value.toLowerCase())) return true;
  if (["0", "false", "no", "off"].includes(value.toLowerCase())) return false;
  throw new Error(`${name} must be true or false`);
};

export function loadConfig() {
  if (!process.env.RPC_URL) throw new Error("RPC_URL is required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return {
    rpcUrl: process.env.RPC_URL,
    databaseUrl: process.env.DATABASE_URL,
    chainId: integer("CHAIN_ID", 46630),
    startBlock: BigInt(process.env.START_BLOCK || "114104980"),
    confirmations: BigInt(integer("CONFIRMATIONS", 4)),
    batchSize: BigInt(integer("BLOCK_BATCH_SIZE", 1200)),
    pollMs: integer("POLL_INTERVAL_MS", 5000),
    reorgRewind: BigInt(integer("REORG_REWIND_BLOCKS", 32)),
    rpcRetryCount: integer("RPC_RETRY_COUNT", 3),
    rpcRetryDelayMs: integer("RPC_RETRY_DELAY_MS", 500),
    rpcMaxBackoffMs: integer("RPC_MAX_BACKOFF_MS", 60_000),
    backfillMaxAttempts: integer("BACKFILL_MAX_ATTEMPTS", 20),
    backfillRetryDelayMs: integer("BACKFILL_RETRY_DELAY_MS", 10_000),
    readinessMaxLagBlocks: BigInt(integer("READINESS_MAX_LAG_BLOCKS", 2_400)),
    apiPort: integer("API_PORT", 8787),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    sseHeartbeatMs: integer("SSE_HEARTBEAT_MS", 15_000),
    sseRetryMs: integer("SSE_RETRY_MS", 2_000),
    keeper: {
      enabled: boolean("KEEPER_ENABLED", false),
      dryRun: boolean("KEEPER_DRY_RUN", true),
      privateKey: process.env.KEEPER_PRIVATE_KEY || "",
      intervalMs: integer("KEEPER_INTERVAL_MS", 60_000),
      collectMinAgeMs: integer("KEEPER_COLLECT_MIN_AGE_MS", 300_000),
      confirmations: integer("KEEPER_CONFIRMATIONS", 2),
      maxAttempts: integer("KEEPER_MAX_ATTEMPTS", 5),
      retryDelayMs: integer("KEEPER_RETRY_DELAY_MS", 60_000),
      rankingMode: process.env.REWARD_RANKING_MODE || "testnet_trade_count_v1",
    },
    contracts: {
      factory: address("FACTORY_ADDRESS", "0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C"),
      router: address("ROUTER_ADDRESS", "0xc3e36d0c7374dee38a092356a59e0829404729e9"),
      locker: address("LOCKER_ADDRESS", "0x0CB8026DB8122b2454cd29aF31E1172b3cA39739"),
      feeEscrow: address("FEE_ESCROW_ADDRESS", "0xCA093138A86Ab9aA4f4aB7bE112F6B0a106c8722"),
      feeSplitter: address("FEE_SPLITTER_ADDRESS", "0x43543d18D40Ad68bE00eA3c23322A3c0EDe7d080"),
      rewardVault: address("REWARD_VAULT_ADDRESS", "0x426d472CdC78f7741aCbE4864aaf92A015883c9C"),
      poolManager: address("POOL_MANAGER_ADDRESS", "0x8366a39CC670B4001A1121B8F6A443A643e40951"),
    },
  };
}

