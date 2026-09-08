# TRND.fun — Developer and Codex Master Handoff v4

Prepared: 2026-09-08 UTC

Canonical repository: `https://github.com/mamadmisaghi/trnd-fun`

Canonical branch: `main`

Verified main commit: `a2e16ddcc9a9b275ef985818200e7bf218d9100d`

Merged milestone: PR #16, Batch B dynamic pair catalog and guarded testnet routes
Product state: functional Robinhood Chain Testnet prototype; not production-safe and not approved for mainnet or real funds.

This is the authoritative continuation handoff. Repository code, confirmed deployment manifests, onchain state, and green CI override stale prose.

## 1. Copy/paste prompt for the next developer's Codex

```text
Continue TRND.fun from https://github.com/mamadmisaghi/trnd-fun.

Before editing:
1. Fetch origin/main and verify the starting commit is at least a2e16ddcc9a9b275ef985818200e7bf218d9100d.
2. Read AGENTS.md and CODEX_HANDOFF.md completely.
3. Inspect docs/IMPLEMENTATION_STATUS.md, docs/BATCH_A_KEEPER_SAFETY.md, docs/BATCH_B_ROUTE_POLICY.md, contracts/deployments/46630/*.json, apps/indexer/README.md, apps/testnet-api/README.md, and apps/web/README.md.
4. Report any mismatch. Code, manifests, chain state, and reproducible tests win.
5. Work from current main on a feature branch and use a PR. Do not develop from or merge backup branches.

Immediate objective before the Viral/AI Engine:
- finish the temporary pre-VPS data path so the public preview truthfully shows confirmed testnet data;
- add D1/API parity for candles, holders, and SSE, or host the PostgreSQL indexer;
- persist and reconcile the full-history backfill;
- make Token Market tolerate partial endpoint failure;
- verify truthful loading, stale, empty, reconnecting, and error states with no silent mock fallback.

Preserve the exact approved TRND.fun UI. The visual source of truth is backup/trnd-brand-preview-exact-20260907 at c2187ff92319caea5a52156885babe020f6abedf. Use it only as a visual oracle. Do not redesign, merge the backup wholesale, or copy its Sites manifest.

Safety rules:
- Testnet only. No mainnet, production-safety claims, or real funds.
- Never expose or commit keys, seeds, RPC secrets, provider tokens, or deployment credentials.
- Previously shared Bright Data and 6551 credentials must be rotated before use.
- Keep keeper disabled and dry-run by default.
- Never use TestnetEthQuoteAdapter outside chain 46630.
- Keep buyback/burn manual and multisig-controlled.
- Use bigint/integer accounting for canonical monetary values.
- A Signal may produce multiple launches; do not add event attestation or one-event-one-launch enforcement.
- V1 has exactly one quote pair per launched token; multi-pair is V2.

Do not rebuild completed Batch A/B foundations. Start with the temporary data/UI gap in sections 8 and 13, validate it, then proceed to the Viral Engine roadmap.
```

## 2. Identity and locked UI

- Product: **TRND.fun**; platform token: **TRND**.
- **ViralTerminal** is historical. It remains in internal filenames, package names, components, contracts, and history. Do not restore it in product-facing copy.
- Public preview: `https://trnd-fun-brand-preview.gofivahootan.chatgpt.site`
- Frontend Sites project: `appgprj_6a9eb0fc3f888191b083dc5731f0a862`
- Published frontend version: 3.
- Published Sites source SHA: `006bafc0183a814b7338c630975703a442b7ec52` (Sites repository, not monorepo SHA).
- Visual backup: `backup/trnd-brand-preview-exact-20260907` at `c2187ff92319caea5a52156885babe020f6abedf`.
- Historical UI backup: `backup/viral-terminal-before-trnd-20260907`.

The UI is locked. Preserve routes, hierarchy, responsive behavior, typography, spacing, colors, cards, charts, and interaction model. Only real-data wiring, truthful states, accessibility, and confirmed defects justify changes without explicit redesign approval.

Never merge the visual backup wholesale or copy its `.openai/hosting.json`; it is an older functional snapshot with a different deployment identity.

## 3. Product definition

TRND.fun is intended to:

1. ingest public social/news signals;
2. detect accelerating attention and authoritative events;
3. calculate a measurable Viral Score from 0–100;
4. explain why an event is moving;
5. recommend exactly four enabled RWA quote assets with independent 0–100 scores;
6. launch a token against one selected asset;
7. route ETH into/out of the market through validated paths;
8. index canonical launches, trades, candles, holders, fees, rewards, and claims.

The Viral/AI Engine in steps 1–5 is not implemented. Most signal, creator, portfolio, and discovery content remains mock-backed.

Routes: `/`, `/live`, `/signals`, `/signal/[id]`, `/launch/[id]`, `/create`, `/explore`, `/token/[id]`, `/token/live?address=...`, `/creators`, `/creator/[id]`, `/portfolio`, `/docs`.

## 4. Locked protocol and economics

- Independent TRND.fun contracts; production must not depend on the historical o1 API.
- Target: Robinhood Chain; current work is chain `46630` testnet only.
- One quote pair per launched token in V1; a Signal may launch multiple times.
- No event attestation or contract-level one-signal-one-launch gate.
- Atomic creator opening buy; plain Uniswap v4 pools; no custom hook; permanently locked launch liquidity.
- Launch fee `0.001 ETH`; opening FDV target about `$4,000`; fixed supply `1,000,000,000`.
- Base fee `1%`; optional creator fee `0–10%` on buys and sells.
- Creator gets all optional creator fee plus 50% of base-fee share.
- Base-fee policy: 50% creator escrow, 20% daily creator rewards, 10% operations, 20% TRND buyback treasury.
- Top-five epoch weights: `40 / 25 / 15 / 12 / 8`; epoch is 24-hour UTC.
- No automatic burn; buyback/burn stays manual and multisig-controlled.
- Recommend exactly four enabled pair assets. Scores are independent and need not sum to 100.
- Persist selected pair, match score, rationale, and model/version once AI exists.

## 5. Repository map and truth order

The monorepo has 303 tracked files and about 1.6 MiB packed Git data. It is not too large.

- `apps/web`: Next.js 15 static UI, wallet/testnet calls, partial indexer integration.
- `apps/indexer`: full PostgreSQL indexer, read API, SSE, and keeper foundation.
- `apps/testnet-api`: temporary Cloudflare Sites Worker + D1 pre-VPS API; intentionally smaller and currently incomplete.
- `contracts`: Solidity, tests, scripts, vendored libraries/submodule, deployment manifests.
- `deployment-packages/robinhood-testnet-genesis`: immutable integration/deployment handoff.
- `docs`: protocol, status, security, Batch A/B and release material.
- `.github/workflows`: CI and guarded testnet operations.

Truth priority: (1) chain state and deployment manifests, (2) current `origin/main`, (3) green reproducible CI, (4) this handoff, (5) old prose/conversations.

Historical `PairPad`, `PAR`, `PONS`, `Viral*`, and `viral-terminal` identifiers come from the licensed baseline. They are not a second active product. Rename only in a dedicated tested migration, not during feature work.

## 6. Git/GitHub audit

- Canonical main: `a2e16ddcc9a9b275ef985818200e7bf218d9100d`.
- PR #16 is squash-merged.
- Stale draft PR #15 (`docs: verified Codex continuation handoff — September 8`) targets pre-Batch-B main. Close it; do not merge it after this v4 is accepted.

Keep:

- `main`
- `backup/trnd-brand-preview-exact-20260907`
- `backup/viral-terminal-before-trnd-20260907`

Cleanup candidates after owner/developer confirmation:

- `docs/trnd-fun-handoff-v3`, `docs/trnd-handoff-20260908`
- `feat/batch-a-backfill-recovery`, `feat/batch-a-live-market-truth`, `feat/batch-a-postgres-acceptance`, `feat/batch-a-reconciliation`
- `feat/dynamic-pair-routing`, `feat/indexer-market-keeper`, `feat/pre-ai-readiness`, `feat/trnd-ui-eth-routes`
- `ops/testnet-core-deploy`, `ops/testnet-core-dry-run`, `ops/testnet-eth-route-smoke`, `ops/testnet-eth-routes-deploy`, `ops/testnet-smoke-launch`, `ops/testnet-support-deploy`

Most PRs were squash-merged, so `git branch --merged` cannot safely identify them. Compare PRs/manifests before deletion. No branches were deleted during this handoff audit.

## 7. Completed work

### Contracts/testnet

- Pinned the baseline and retained licenses/notices.
- Added TRND fee splitter, pair registry, reward vault, and operations/buyback treasuries.
- Wired 50/20/10/20 fee distribution into locked-liquidity collection.
- Added curated/versioned quote-asset registry and launch gate.
- Added atomic launch + creator buy, later buys, sell-to-ETH, collection, and claims.
- Deployed and explorer-verified support, core, and ETH-route testnet stacks.
- Completed onchain USDG smoke: launch/creator buy, second buy, sell approval, sell, collect, USDG claim, and launch-token claim.

### Web

- Preserved and published approved TRND.fun UI.
- Injected-wallet connection and Robinhood testnet switching.
- Manual Create and Signal Launch paths; atomic creator buy.
- Market buy/sell/fee collection/claim paths.
- Dynamic pair catalog in Create and Launch Studio.
- Fail-closed route lookup; expiry recheck; slippage ceiling; minimum output; fresh simulation; testnet price-impact guard.
- Partial Token Market indexed-data integration.
- Mock content intentionally remains where Viral Engine/backend does not exist.

### Batch A — complete PostgreSQL foundation

Do not rebuild it. Completed:

- clean and pre-ledger upgrade migrations;
- confirmed cursor, bounded ranges, restart idempotency, unique event identity;
- simulated reorg rewind/rebuild;
- launches, swaps, routed end-user attribution, transfers, holders, OHLCV, fees, rewards, claims;
- candles `1m`, `5m`, `15m`, `1h`, `1d`;
- market/trade/candle/holder/creator-fee APIs;
- confirmed-only process-local SSE;
- health/readiness/lag/error state;
- full Robinhood testnet backfill and reconciliation;
- dry-run-first keeper with advisory lock, action journal, simulation, idempotency, retries, and safe reward blocking;
- Docker/compose validation.

Full-history evidence: 5 pair-asset records, 17 launches, 33 swap/trade records, 88 holder-balance records. These are rows read from existing chain history, not token quantities purchased during CI. GitHub Actions PostgreSQL was ephemeral and was destroyed afterward.

### Batch B — completed testnet foundation

- Confirmed `PairAssetUpdated` ingestion and reorg reconciliation.
- `/v1/pairs` returns registered/enabled/metadata-valid/allowlisted assets.
- `/v1/routes/eth/:asset?direction=buy|sell` returns short-lived descriptors.
- Symbol, decimals, logo key, transfer behavior, testnet restriction, TTL, slippage, impact, and simulation policy.
- Current public catalog: ETH, faucet USDG, faucet TSLA.
- Fixed-price adapter is testnet-only.
- Current router has no onchain deadline; application TTL is not production-grade.

## 8. PostgreSQL versus temporary D1 — critical

### Full PostgreSQL (`apps/indexer`)

Production-oriented implementation. Full tests/backfill/reconciliation/candles/holders/SSE/keeper passed. It is not hosted persistently on a VPS yet.

### Temporary Sites/D1 (`apps/testnet-api`)

- URL: `https://viral-terminal-testnet-api.gofivahootan.chatgpt.site`
- Sites project: `appgprj_6a9e8085fea88191aa25bf54666faeb1`
- Published version: 4
- Sites source SHA: `7b8b00ac99e0ad4b07eb9c220271430c6335ac4d`

Verified live on 2026-09-08:

- `/health`: 200, but cursor/time is stale; no reliable continuous catch-up.
- `/v1/pairs`: 200; ETH/USDG/TSLA.
- allowed buy/sell `/v1/routes/eth/:address`: 200.
- `/v1/markets`: 200; only 2 markets stored.
- 5 stored trades: 3 `VIRALTEST`, 2 `666/TSLA`.
- market and trades endpoints: 200.
- candles: 404; holders: 404; stream: 404.

D1 does not contain the full 17/33/88 PostgreSQL evidence. The chain is canonical; databases are rebuildable derived indexes.

Current UI defect: `TokenMarket.jsx` requests market, trades, candles, and holders in one `Promise.all`. A 404 for candles/holders rejects everything and clears valid market/trade data. Use independent settled requests and per-section states, then add D1 parity or deploy PostgreSQL.

## 9. Test/deployment evidence

PR #16 head: `d899ead3b3c6f1c96fbd0a88ed0e37a0a076e935`.

- Contracts: 7 suites, 61 passed, 0 failed/skipped.
- Indexer unit: 20 passed, 0 failed.
- PostgreSQL integration: 7 passed, 0 failed.
- Migrate, live-chain smoke, JS syntax, Docker build, compose config: passed.
- Web build: 65 static pages.
- Testnet API build/artifact/ESM validation: passed.
- Full backfill and reconcile: passed, artifacts uploaded.
- Broadcast workflows correctly skipped on PR.

Post-merge:

- UI Sites v3 and API Sites v4 published successfully.
- `/`, `/create`, `/explore`, `/creators`, and API `/health`: HTTP 200.
- Published bundle contains `/v1/pairs` and `/v1/routes/eth/` integration.
- Live pair catalog and TSLA buy/sell route descriptors verified.

Do not rerun full public-RPC backfill on every change. It can take 15+ minutes and is rate-limited. Use focused tests and rerun full evidence only when indexer/reconciliation scope changes; use a dedicated archival provider for continuous operation.

## 10. Robinhood Testnet addresses

- Chain `46630`; RPC `https://rpc.testnet.chain.robinhood.com`; explorer `https://explorer.testnet.chain.robinhood.com`.
- Start block `114104980`; default confirmations `4`.

| Component | Address |
| --- | --- |
| Launch Factory | `0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C` |
| Original Router | `0x55Bea0D582C48815585164AC476C2C0c71506B5d` |
| Active ETH-route Router | `0xc3e36d0c7374dee38a092356a59e0829404729e9` |
| Launch Locker | `0x0CB8026DB8122b2454cd29aF31E1172b3cA39739` |
| Fee Escrow | `0xCA093138A86Ab9aA4f4aB7bE112F6B0a106c8722` |
| Reward Vault | `0x426d472CdC78f7741aCbE4864aaf92A015883c9C` |
| Fee Splitter | `0x43543d18D40Ad68bE00eA3c23322A3c0EDe7d080` |
| Operations Vault | `0x19Ec2b0B14f3a057F9fDBa6aabE30601D5bc4Cca` |
| Buyback Vault | `0xfA3B7d885b76BF87B76875529A14613Ce3BF893E` |
| Pair Registry | `0x8e84B45d98A2b8233Aa1bA8BB16b6678E1C947aa` |
| Quote Pricer | `0x6632cBf9012B2c214b70ccF7121708c3EB5e3f3e` |
| Position Minter | `0xc2F71201De7b0d440eb75bBEDd278f88E3fADD7e` |
| Launch Deployer | `0x62Bf40701f7B8A56deB74224D39A7137eD988Cf3` |
| Reference Registry | `0x54cFF4Aaf45fB14d40D55BDbD1A341196Ec3C1e8` |
| Testnet ETH Adapter | `0xcc4375d3ff3a8048bdd50c1500593cf395f7ac68` |
| Test Wrapped ETH | `0x78a01a9b91ad157867ffcaf9b93c38dd83221976` |
| Faucet USDG | `0x20A887523fbbF0024eB46ee672DF15A95521E680` |
| Faucet TSLA | `0xc9f9c86933092bbbfff3ccb4b105a4a94bf3bd4e` |

Canonical manifests: `contracts/deployments/46630/core.json`, `support.json`, `smoke.json`, `eth-routes.json`, `eth-route-smoke.json`.

Confirmed routed smoke: token `0x018129F6970cB20877C987d22E4ad7Ef9Ddba791`, pair USDG, pool `0x86ed7d66e7a22caaf660e67a6b21bba19f4ee5b03882717569dde2b6022e2686`. Exact transactions/amounts are in `eth-route-smoke.json`.

## 11. Local commands

```bash
git clone --recurse-submodules https://github.com/mamadmisaghi/trnd-fun.git
cd trnd-fun
```

```bash
cd apps/web
npm ci
npm run build
npm run dev
```

```bash
cd apps/indexer
cp .env.example .env
docker compose up -d postgres
npm ci
npm run migrate
npm test
TEST_DATABASE_URL=postgres://viral:viral@localhost:5432/viral_terminal npm run test:postgres
npm run test:chain
npm start
```

Evidence-only full scan when justified: `npm run backfill`, then `npm run reconcile`.

```bash
cd contracts
forge build
forge test --no-match-path "test/fork/*"
```

```bash
cd apps/testnet-api
npm run build
npm run validate
```

The API build script needs Bash. On Windows use Git Bash/WSL or reproduce its deterministic `dist` copy before validation.

## 12. Security/operational facts

- Internal review is not an independent audit.
- Testnet owner/treasury roles are not production multisigs.
- Public RPC is unsuitable for reliable continuous indexing.
- Fixed-price adapter is centralized, owner-priced, reserve-limited, and testnet-only.
- Current route deadline is app-side only; price-impact comparison is a testnet guard.
- Process-local SSE is single-replica only; production needs a shared event bus.
- `testnet_trade_count_v1` is not Sybil/wash-trading resistant.
- Keep `KEEPER_ENABLED=false` and `KEEPER_DRY_RUN=true` until deliberately rehearsed.
- Rotate Bright Data/6551 credentials; never reuse previously shared values.
- No secrets in Git, logs, chat, browser bundles, or `NEXT_PUBLIC_*`.
- Buyback/burn stays manual and multisig-controlled.

## 13. Prioritized remaining work

### P0 — truthful temporary data layer before AI

1. Choose completed D1 parity for short preview, or deploy PostgreSQL now for ongoing development.
2. Backfill the persistent database from block `114104980` and reconcile it.
3. Implement/host candles, holders, SSE, and continuous confirmed sync.
4. Keep D1 schema/migrations aligned if retained.
5. Split Token Market requests and add per-section loading/error/stale states.
6. Remove live-market placeholders or label unavailable values explicitly.
7. Verify the 17 launches, 33 trades, and holder data are visible or explain reconciliation differences.
8. Add browser tests for missing wallet, wrong chain, rejected signature, expiry, failed simulation, and successful launch/trade/index refresh.

### P1 — repository hygiene

1. Close stale PR #15; do not merge it.
2. Confirm and delete superseded branches in section 6; retain both backups.
3. Tag deployed milestones before cleanup.
4. Move long imported PAR baseline from root README to `docs/UPSTREAM_PAR_BASELINE.md`; keep a concise TRND-first README.
5. Rewrite generic `apps/testnet-api/README.md` to document the actual API and limitations.
6. Fix stale docs that list completed pre-broadcast/Batch A work as outstanding.
7. Defer broad internal renaming until backend/data stability.

### P2 — Viral Engine ingestion

1. Rotate credentials.
2. Build licensed server-side X/news/TikTok/Instagram/YouTube adapters.
3. Store raw references, normalized IDs, URLs, accounts, timestamps, metric snapshots.
4. Exact-post dedupe plus narrative/entity clustering.
5. Idempotent queues, retry/backoff, dead-letter handling, provider health/rate/cost metrics.

### P3 — scoring and AI

1. Cheap-to-expensive deterministic screening.
2. Velocity, acceleration, anomaly, reach, authority, cross-platform, novelty, persistence.
3. Versioned measurable 0–100 Viral Score.
4. Evidence-linked explanations for shortlisted events.
5. Evaluation dataset, reviewer UI, reason codes, false-positive labels, version tracking.
6. Targets: duplicate rate <1%, Precision@20 >=70%, p95 delivery <60s, seven-day shadow test.

### P4 — RWA/product integration

1. Dynamic enabled assets; never hardcode catalog count.
2. Exactly four independent match scores plus rationale/version.
3. Persist Signal-to-Launch provenance and selected pair decision.
4. Replace mock Analyzer/creator/portfolio/discovery data with typed APIs.
5. Reviewer/admin suppression, override, and audit trail.

### P5 — production/release hardening

1. Replace fixed adapter with audited production liquidity/quotes.
2. Audited router with onchain deadline/route constraints.
3. Separate deployer, keeper, treasury, operations, and admin roles.
4. Multisigs/timelocks; secrets manager; redundancy; monitoring; alerts; backups; recovery/incident runbooks.
5. Multi-wallet, concurrency, failure, reorg, load, and economic-abuse tests.
6. Seven-day testnet soak and independent audit/remediation.
7. Mainnet canary only with explicit owner approval.

## 14. Repository recommendation

**Do not create a new repository.** Current main is coherent and compact, and the repository preserves valuable PR, CI, deployment, license, and security history. A new repository risks missing manifests/submodules and creates competing sources of truth.

The perceived disorder is mainly old branches, stale prose, and historical internal names. Clean these in place. Keep main and both backups; close PR #15; prune superseded branches after confirmation; modernize README/testnet API docs via PRs. Do not delete deployment packages, manifests, security records, license notices, or visual backups.

## 15. Definition of done

TRND.fun is complete only when real permitted sources produce traceable Signals; scores/matches are evaluated and versioned; launch/trading uses audited production routes; all live data is canonical/recoverable; indexer/keeper survive restarts/reorgs/provider failures; roles are separated/multisig-controlled; monitoring/backups/incidents are rehearsed; audit findings are fixed; testnet soaks successfully; and a mainnet canary is explicitly approved.

Until then, call it a testnet/beta prototype.
