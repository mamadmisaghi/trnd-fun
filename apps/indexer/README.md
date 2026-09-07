# TRND.fun chain indexer

Resumable PostgreSQL indexer and read API for the deployed Robinhood Chain
testnet contracts. It derives launches, swaps, OHLCV candles, holder balances,
LP-fee accounting and creator rewards from chain logs.

## Local run

```bash
cp .env.example .env
docker compose up -d
npm ci
npm run migrate
npm start
```

`START_BLOCK` must be at or before the first factory deployment block. Holder
balances are reconstructed from ERC-20 `Transfer` events, so starting later
would produce incomplete balances. The service waits for `CONFIRMATIONS`,
checkpoints each range and rewinds/rebuilds derived tables after a block-hash
mismatch. Inserts are idempotent by `(chain_id, transaction_hash, log_index)`.

## Read API

- `GET /health`
- `GET /v1/markets?limit=50`
- `GET /v1/markets/:token`
- `GET /v1/markets/:token/trades?limit=100`
- `GET /v1/markets/:token/candles?interval=5m&limit=120`
- `GET /v1/markets/:token/holders?limit=100`
- `GET /v1/creators/:address/fees`
- `GET /v1/stream?token=:token` (Server-Sent Events)

Supported candle intervals are `1m`, `5m`, `15m`, `1h` and `1d`. Raw amounts
remain base-unit decimal strings; prices are quote tokens per launch token.

## Keeper safety

The keeper is disabled by default. Setting `KEEPER_ENABLED=true` still runs in
dry-run mode unless `KEEPER_DRY_RUN=false`. Live mode additionally requires a
valid `KEEPER_PRIVATE_KEY`; the key is never logged and must not be committed.

The keeper uses a PostgreSQL advisory lock and idempotent action keys. It calls
the public fee collector only when fees are pending. Reward finalization is
blocked unless exactly five distinct, non-zero creator recipients exist.
`testnet_trade_count_v1` is intentionally a testnet-only ranking rule; a
production launch must replace it with the approved normalized scoring model.

## Container image

Build with `docker build -t trnd-indexer .`. Run migrations as a one-off command
before starting the service:

```bash
docker run --rm --env-file .env trnd-indexer npm run migrate
docker run --env-file .env -p 8787:8787 trnd-indexer
```
