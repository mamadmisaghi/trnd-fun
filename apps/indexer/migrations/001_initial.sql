CREATE TABLE IF NOT EXISTS indexer_state (
  chain_id BIGINT PRIMARY KEY,
  cursor_block BIGINT NOT NULL,
  cursor_block_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_events (
  chain_id BIGINT NOT NULL,
  block_number BIGINT NOT NULL,
  block_hash TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  transaction_index INTEGER NOT NULL,
  log_index INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_args JSONB NOT NULL,
  PRIMARY KEY (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS raw_events_block_idx ON raw_events(chain_id, block_number);

CREATE TABLE IF NOT EXISTS launches (
  chain_id BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  pool_id TEXT NOT NULL,
  deployer TEXT NOT NULL,
  creator_fee_recipient TEXT,
  pair_token TEXT NOT NULL,
  launch_config_id NUMERIC(78,0) NOT NULL,
  pool_fee INTEGER NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  token_decimals INTEGER,
  position_id NUMERIC(78,0),
  tick_lower INTEGER,
  tick_upper INTEGER,
  liquidity NUMERIC(78,0),
  token_amount NUMERIC(78,0),
  phantom_quote NUMERIC(78,0),
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, token_address),
  UNIQUE (chain_id, pool_id)
);
CREATE INDEX IF NOT EXISTS launches_order_idx ON launches(chain_id, block_number DESC, log_index DESC);
CREATE INDEX IF NOT EXISTS launches_creator_idx ON launches(chain_id, creator_fee_recipient);

CREATE TABLE IF NOT EXISTS trades (
  chain_id BIGINT NOT NULL,
  pool_id TEXT NOT NULL,
  token_address TEXT NOT NULL,
  sender TEXT NOT NULL,
  amount0 NUMERIC(78,0) NOT NULL,
  amount1 NUMERIC(78,0) NOT NULL,
  sqrt_price_x96 NUMERIC(78,0) NOT NULL,
  liquidity NUMERIC(78,0) NOT NULL,
  tick INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS trades_market_idx ON trades(chain_id, token_address, block_number DESC, log_index DESC);

CREATE TABLE IF NOT EXISTS fee_collections (
  chain_id BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  currency0 TEXT NOT NULL,
  currency1 TEXT NOT NULL,
  protocol_amount0 NUMERIC(78,0) NOT NULL,
  protocol_amount1 NUMERIC(78,0) NOT NULL,
  creator_amount0 NUMERIC(78,0) NOT NULL,
  creator_amount1 NUMERIC(78,0) NOT NULL,
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS fee_collections_market_idx ON fee_collections(chain_id, token_address, block_number DESC);

CREATE TABLE IF NOT EXISTS fee_claims (
  chain_id BIGINT NOT NULL,
  recipient TEXT NOT NULL,
  token_address TEXT,
  amount NUMERIC(78,0) NOT NULL,
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS fee_claims_recipient_idx ON fee_claims(chain_id, recipient, block_number DESC);
