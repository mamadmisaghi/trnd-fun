CREATE TABLE IF NOT EXISTS pair_assets (
  chain_id BIGINT NOT NULL,
  asset_address TEXT NOT NULL,
  registered BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL,
  pair_type INTEGER NOT NULL CHECK (pair_type BETWEEN 0 AND 2),
  decimals INTEGER NOT NULL CHECK (decimals BETWEEN 0 AND 255),
  config_version NUMERIC(20,0) NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  metadata_valid BOOLEAN NOT NULL DEFAULT false,
  metadata_error TEXT,
  block_number BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, asset_address),
  UNIQUE (chain_id, config_version)
);

CREATE INDEX IF NOT EXISTS pair_assets_enabled_idx
  ON pair_assets(chain_id, enabled, config_version DESC);
