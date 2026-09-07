const address = (name, fallback) => (process.env[name] || fallback).toLowerCase();
const integer = (name, fallback) => Number.parseInt(process.env[name] || String(fallback), 10);

export function loadConfig() {
  if (!process.env.RPC_URL) throw new Error("RPC_URL is required");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return {
    rpcUrl: process.env.RPC_URL,
    databaseUrl: process.env.DATABASE_URL,
    chainId: integer("CHAIN_ID", 46630),
    startBlock: BigInt(process.env.START_BLOCK || "0"),
    confirmations: BigInt(integer("CONFIRMATIONS", 4)),
    batchSize: BigInt(integer("BLOCK_BATCH_SIZE", 1200)),
    pollMs: integer("POLL_INTERVAL_MS", 5000),
    reorgRewind: BigInt(integer("REORG_REWIND_BLOCKS", 32)),
    apiPort: integer("API_PORT", 8787),
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    contracts: {
      factory: address("FACTORY_ADDRESS", "0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C"),
      router: address("ROUTER_ADDRESS", "0x55Bea0D582C48815585164AC476C2C0c71506B5d"),
      locker: address("LOCKER_ADDRESS", "0x0CB8026DB8122b2454cd29aF31E1172b3cA39739"),
      feeEscrow: address("FEE_ESCROW_ADDRESS", "0xCA093138A86Ab9aA4f4aB7bE112F6B0a106c8722"),
      poolManager: address("POOL_MANAGER_ADDRESS", "0x8366a39CC670B4001A1121B8F6A443A643e40951"),
    },
  };
}
