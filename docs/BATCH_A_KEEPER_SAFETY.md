# Batch A keeper safety and ranking limits

## Operating mode

The keeper remains disabled by default (`KEEPER_ENABLED=false`) and defaults to dry-run (`KEEPER_DRY_RUN=true`). Dry-run performs the same `eth_call` contract simulation as live mode, journals the result in PostgreSQL, and never creates a wallet client or broadcasts a transaction.

Each run holds a chain-specific PostgreSQL advisory lock. Every action has a deterministic unique key, an attempt counter, a bounded maximum attempt count, and a delayed `next_attempt_at`. Failed and blocked actions can only be retried after that time. Confirmed or successfully simulated actions are not repeated.

An epoch finalization is blocked unless there are exactly five distinct valid creator recipients. A run containing a blocked or failed action is recorded as `partial`, not successful. Errors written to the journal have URLs redacted to reduce the chance of logging an RPC credential.

## `testnet_trade_count_v1`

This ranking is testnet-only acceptance logic, not a production reward model. It counts confirmed indexed trades in an exact UTC epoch, excludes a direct trade whose indexed sender is the creator fee recipient, sorts by count descending and address ascending, and persists the five inputs used for simulation.

The model still has material wash-trading and Sybil risk:

- a creator can trade through a second wallet;
- one operator can control many funded wallets;
- raw trade count ignores economic size, fees paid, holding duration, and round trips;
- routed or aggregator activity can hide common control;
- address-level filtering cannot establish human uniqueness.

Production rewards must not use this score. Before live rewards, replace it with a versioned model that includes economic-cost thresholds, self-funding and circular-flow detection, related-wallet clustering, minimum holding time, minimum unique counterparties, rate limits, anomaly review, and an appeal/override audit trail.

## Acceptance evidence

PostgreSQL integration tests verify real simulation without writes, advisory locking, retry journaling, idempotency, deterministic five-recipient ranking, direct self-trade exclusion, and safe blocking below five eligible creators. The full-history workflow separately runs migrations, the confirmed backfill, canonical reconciliation, and uploads both JSON reports.

