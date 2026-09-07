ALTER TABLE launches ADD COLUMN IF NOT EXISTS pair_symbol TEXT;
ALTER TABLE launches ADD COLUMN IF NOT EXISTS pair_decimals INTEGER;
ALTER TABLE launches ADD COLUMN IF NOT EXISTS block_time TIMESTAMPTZ;

ALTER TABLE trades ADD COLUMN IF NOT EXISTS pair_address TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS token_is_currency0 BOOLEAN;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS price_quote_per_token NUMERIC(100,40);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS token_volume NUMERIC(78,0);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS quote_volume NUMERIC(78,0);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS block_time TIMESTAMPTZ;

ALTER TABLE fee_collections ADD COLUMN IF NOT EXISTS block_time TIMESTAMPTZ;
ALTER TABLE fee_claims ADD COLUMN IF NOT EXISTS block_time TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS trades_recent_market_idx
  ON trades(chain_id, token_address, block_time DESC);

CREATE TABLE IF NOT EXISTS indexed_blocks (
  chain_id BIGINT NOT NULL,
  block_number BIGINT NOT NULL,
  block_hash TEXT NOT NULL,
  parent_hash TEXT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (chain_id, block_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS indexed_blocks_hash_idx ON indexed_blocks(chain_id, block_hash);

CREATE TABLE IF NOT EXISTS candles (
  chain_id BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  interval_seconds INTEGER NOT NULL,
  bucket_start TIMESTAMPTZ NOT NULL,
  open NUMERIC(100,40) NOT NULL,
  high NUMERIC(100,40) NOT NULL,
  low NUMERIC(100,40) NOT NULL,
  close NUMERIC(100,40) NOT NULL,
  token_volume NUMERIC(78,0) NOT NULL DEFAULT 0,
  quote_volume NUMERIC(78,0) NOT NULL DEFAULT 0,
  trade_count INTEGER NOT NULL DEFAULT 0,
  first_block BIGINT NOT NULL,
  first_log_index INTEGER NOT NULL,
  last_block BIGINT NOT NULL,
  last_log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, token_address, interval_seconds, bucket_start)
);
CREATE INDEX IF NOT EXISTS candles_market_idx
  ON candles(chain_id, token_address, interval_seconds, bucket_start DESC);

CREATE TABLE IF NOT EXISTS token_transfers (
  chain_id BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC(78,0) NOT NULL,
  block_number BIGINT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS token_transfers_market_idx
  ON token_transfers(chain_id, token_address, block_number, log_index);

CREATE TABLE IF NOT EXISTS holder_balances (
  chain_id BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  holder_address TEXT NOT NULL,
  balance NUMERIC(78,0) NOT NULL,
  updated_block BIGINT NOT NULL,
  PRIMARY KEY (chain_id, token_address, holder_address),
  CHECK (balance >= 0)
);
CREATE INDEX IF NOT EXISTS positive_holders_idx
  ON holder_balances(chain_id, token_address) WHERE balance > 0;

CREATE TABLE IF NOT EXISTS reward_funding (
  chain_id BIGINT NOT NULL,
  epoch_id NUMERIC(78,0) NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC(78,0) NOT NULL,
  block_number BIGINT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, transaction_hash, log_index)
);
CREATE INDEX IF NOT EXISTS reward_funding_epoch_idx
  ON reward_funding(chain_id, epoch_id, currency);

CREATE TABLE IF NOT EXISTS reward_finalizations (
  chain_id BIGINT NOT NULL,
  epoch_id NUMERIC(78,0) NOT NULL,
  currency TEXT NOT NULL,
  total_amount NUMERIC(78,0) NOT NULL,
  recipients JSONB NOT NULL,
  amounts JSONB NOT NULL,
  block_number BIGINT NOT NULL,
  block_time TIMESTAMPTZ NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  PRIMARY KEY (chain_id, epoch_id, currency),
  UNIQUE (chain_id, transaction_hash, log_index)
);

CREATE TABLE IF NOT EXISTS keeper_runs (
  id BIGSERIAL PRIMARY KEY,
  chain_id BIGINT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('dry-run','live')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','partial','failed')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS keeper_actions (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES keeper_runs(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL UNIQUE,
  action_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned','simulated','submitted','confirmed','blocked','failed','skipped')),
  transaction_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  error TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS keeper_actions_retry_idx
  ON keeper_actions(status, next_attempt_at) WHERE status IN ('failed','submitted');

CREATE TABLE IF NOT EXISTS creator_epoch_rankings (
  chain_id BIGINT NOT NULL,
  epoch_id NUMERIC(78,0) NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 5),
  creator_address TEXT NOT NULL,
  score NUMERIC(100,20) NOT NULL,
  score_version TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, epoch_id, rank),
  UNIQUE (chain_id, epoch_id, creator_address)
);
