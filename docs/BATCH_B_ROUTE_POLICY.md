# Batch B pair catalog and route policy

## Scope

This batch replaces execution-time pair and route constants in the web app with
a server-controlled catalog derived from the onchain `ViralPairRegistry`.
Visual layouts and the approved TRND.fun redesign are unchanged.

The PostgreSQL indexer records confirmed `PairAssetUpdated` events in
`pair_assets`, validates ERC-20 metadata, and intersects the onchain registry
with an explicit server allowlist. The temporary Sites testnet API exposes the
same contract-backed response directly while the PostgreSQL service is not yet
publicly hosted.

## API contract

- `GET /v1/pairs` returns only registered, enabled, metadata-valid and
  server-allowlisted assets whose symbol, decimals and curated logo key match
  the policy.
- `GET /v1/routes/eth/:asset?direction=buy|sell` returns a short-lived route
  descriptor for an enabled catalog entry.
- Route descriptors include canonical endpoints, transfer-behavior attestation,
  expiry, maximum slippage, maximum price impact and a fresh-simulation flag.

The web app fails closed when either endpoint is unavailable. It performs a
fresh contract simulation, enforces the server slippage ceiling, estimates
price impact against a 1% reference simulation, and rechecks route expiry
immediately before asking the wallet to sign.

## Testnet-only adapter

`TestnetEthQuoteAdapter` and the current USDG/TSLA routes are restricted to
Robinhood Chain Testnet (`46630`). They are development infrastructure, not a
production price source. ERC-20 routes also require an explicit
`transferBehavior: "standard"` attestation; fee-on-transfer and rebasing assets
are not accepted by this policy.

## Production gates

The currently deployed router has no onchain deadline field. Route expiry is
therefore an application-side safety check; a future router deployment must add
an onchain deadline before production. The client price-impact check is also a
testnet guard rather than a substitute for a production quote service.

Before mainnet, choose and audit the production liquidity/quote provider,
approve the canonical asset list, remove the fixed-price adapter, enforce
deadline and route constraints onchain, and complete independent security
review. No mainnet or real-funds use is approved by this batch.
