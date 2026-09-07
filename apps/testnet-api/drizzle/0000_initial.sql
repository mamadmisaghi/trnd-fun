CREATE TABLE indexer_state (
  chain_id INTEGER PRIMARY KEY,
  next_block INTEGER NOT NULL,
  last_block_hash TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE launches (
  token_address TEXT PRIMARY KEY,
  pool_id TEXT NOT NULL UNIQUE,
  deployer TEXT NOT NULL,
  pair_address TEXT NOT NULL,
  pair_symbol TEXT,
  token_name TEXT,
  token_symbol TEXT,
  launch_config_id TEXT NOT NULL,
  pool_fee INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trades (
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  pool_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  amount0 TEXT NOT NULL,
  amount1 TEXT NOT NULL,
  sqrt_price_x96 TEXT NOT NULL,
  liquidity TEXT NOT NULL,
  tick INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transaction_hash, log_index)
);

CREATE TABLE raw_events (
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  address TEXT NOT NULL,
  topic0 TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (transaction_hash, log_index)
);

CREATE INDEX idx_launches_block_log ON launches(block_number DESC, log_index DESC);
CREATE INDEX idx_trades_pool_block_log ON trades(pool_id, block_number DESC, log_index DESC);
CREATE INDEX idx_raw_events_block ON raw_events(block_number);
