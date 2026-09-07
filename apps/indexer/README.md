# ViralTerminal chain indexer

Resumable PostgreSQL indexer for the deployed Robinhood Chain contracts. It
indexes launches, Uniswap v4 swaps, LP-fee collections and creator claims, and
exposes a small read-only HTTP API for the frontend.

## Local run

```bash
cp .env.example .env
docker compose up -d
npm install
npm run migrate
npm start
```

The service waits for `CONFIRMATIONS`, checkpoints every completed range and
rewinds on a block-hash mismatch. Event inserts are idempotent by
`(chain_id, transaction_hash, log_index)`.

## API

- `GET /health`
- `GET /v1/markets?limit=50&cursor=<block:log>`
- `GET /v1/markets/:token`
- `GET /v1/markets/:token/trades?limit=100`
- `GET /v1/creators/:address/fees`

Amounts are returned as base-unit decimal strings. Formatting and fiat prices
belong in the API/UI layer, not in the accounting indexer.
