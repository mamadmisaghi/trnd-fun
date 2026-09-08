# TRND.fun — Codex Verified Handoff v4 — 2026-09-08

Updated and reverified: 2026-09-08 UTC  
Repository: `https://github.com/mamadmisaghi/trnd-fun`  
Canonical development branch: `main`  
Verified `main` head at this handoff: `d5a076ad85da13bcdfe3f74a2cb47269bad6e282`  
Product stage: working Robinhood Chain testnet launchpad with a production-oriented indexer/market/keeper foundation; full validation, Viral Engine, production routing, security hardening, and mainnet release remain.


## 0. Current checkpoint — read this before older roadmap sections

### راهنمای شروع برای مالک پروژه

ریپازیتوری فعلی **mamadmisaghi/trnd-fun** است. این فایل هندآف کامل پروژه است؛ نیازی نیست تاریخچهٔ چت را دوباره توضیح بدهید. طراحی تأییدشدهٔ TRND.fun قفل است و دو شاخهٔ بکاپ محفوظ‌اند. کدهای Indexer، چارت زنده و Keeper و چند مرحلهٔ تست تکمیلی وارد main شده‌اند؛ کودکس نباید آن‌ها را از نو بسازد.

اول بخش‌های باقی‌مانده را با کد فعلی تطبیق بدهد، نقص‌های تأییدشده را رفع کند و سپس وارد Routing واقعی و Viral Engine / AI شود. این هندآف فقط مستندات را به‌روز می‌کند؛ Mainnet، پول واقعی یا تغییر UI را مجاز نمی‌کند.

### Freshly verified state

- Current repository: [mamadmisaghi/trnd-fun](https://github.com/mamadmisaghi/trnd-fun).
- Same repository ID as the former viral-terminal-protocol: 1359007851. This is a rename, not a different project.
- Verified main: [d5a076ad85da13bcdfe3f74a2cb47269bad6e282](https://github.com/mamadmisaghi/trnd-fun/commit/d5a076ad85da13bcdfe3f74a2cb47269bad6e282).
- Existing root AGENTS.md and CODEX_HANDOFF.md were merged by PR #9. This update corrects their stale continuation snapshot.
- No open PRs were found before preparing this documentation update.
- Both backup branches remain present: exact TRND preview at c2187ff92319caea5a52156885babe020f6abedf; historical Viral UI at 40af48fccbe10837049e88d44020cf05eae216c6.
- Earlier local WIP/rebuild instructions are obsolete. Continue from fresh origin/main; never overwrite it with an old export.
- Current source files, PR records and workflow conclusions were read through the connected repository. No local test suites, browser QA, deployments or blockchain transactions were executed during this resumed handoff.

| Landed work | Evidence |
| --- | --- |
| Initial indexer/OHLCV/holders/SSE/keeper foundation | [PR #8](https://github.com/mamadmisaghi/trnd-fun/pull/8) |
| TRND identity, root guardrails and master handoff | [PR #9](https://github.com/mamadmisaghi/trnd-fun/pull/9) |
| PostgreSQL first-install and pre-ledger migration tests | [PR #10](https://github.com/mamadmisaghi/trnd-fun/pull/10) |
| Backfill/restart/reorg recovery integration coverage | [PR #11](https://github.com/mamadmisaghi/trnd-fun/pull/11) |
| Canonical reconciliation and routed end-user attribution | [PR #12](https://github.com/mamadmisaghi/trnd-fun/pull/12) |
| Confirmed live market state, OHLC/holder wiring, SSE and truthful Token Market states | [PR #13](https://github.com/mamadmisaghi/trnd-fun/pull/13) |
| Real keeper dry-run simulations, bounded retries, ranking tests, container gates | [PR #14](https://github.com/mamadmisaghi/trnd-fun/pull/14) |

Current-head CI:
- [Indexer checks — success](https://github.com/mamadmisaghi/trnd-fun/actions/runs/34165550652)
- [Protocol checks — success](https://github.com/mamadmisaghi/trnd-fun/actions/runs/34165550583)
- [Web — success](https://github.com/mamadmisaghi/trnd-fun/actions/runs/34165550638)

Indexer workflow includes npm test, dedicated PostgreSQL integration tests, migrations, one-block chain smoke, syntax checks, Docker image build and Compose validation. PR #14 reports 16/16 local unit tests. Earlier contract evidence reports 61 tests. Exact test totals were not independently recounted from CI logs during this handoff.

Important distinction: the workflow definition and merged backfill/reconciliation tooling do not alone prove the separate full-history evidence run completed successfully. Inspect and retain its actual JSON artifacts and run conclusion before marking that gate accepted. A synthetic recovery integration test is not a live soak.

### Remaining source-review findings — do these first

These observations are pinned to d5a076a. They are specific review findings, not an independent contract/security audit. Recheck fresh main before implementing because another session may have advanced it.

1. **Keeper receipt correctness.** In apps/indexer/src/keeper.js, submit records receipt.status in details but unconditionally sets action status to confirmed after waitForTransactionReceipt. Require receipt.status === success; reverted receipts must fail. Reconcile pending/submitted/unknown actions after crash or RPC timeout before retrying. Preserve transaction hashes and distinguish unknown receipt from confirmed failure.
2. **Zero recipient guard.** validateTopFive validates format and uniqueness but still accepts the all-zero address. Explicitly reject zero and add regression tests; fewer than five eligible creators must remain blocked, never padded with fake recipients.
3. **Deployment/API boundary.** apps/web/lib/indexer/client.js still hardcodes the legacy testnet API URL. Parameterize the public endpoint and confirm the deployed endpoint actually serves the new PostgreSQL API/candles/holders/SSE. It still posts /v1/ingest: verify actual server compatibility before switching endpoints; use confirmed receipt validation or documented polling, never client-trusted event ingestion.
4. **Truthfulness outside Token Market.** The same client's indexedMarketToToken still returns a fabricated sparkline, 0.1 change placeholder, holders: 0, and old ViralTerminal fallback name. Inspect Markets/Explore consumers and replace live placeholders with real metrics or unavailable states. Do not undo the real Token Market work in PR #13.
5. **Keeper production safety.** Raw trade-count ranking now excludes direct creator self-trades and has bounded retries, but remains explicitly testnet-only. Verify a runtime chain/mode guard, crash recovery and economically meaningful collection thresholds before live use. Multisig and production ranking policy are not established by this testnet ranking.
6. **Full-history evidence and persistent operations.** Retrieve the backfill/reconciliation workflow reports; confirm range, canonical cursor, receipt/holder/fee reconciliation and actual passing output. Establish persistent staging service/DB, backups, monitoring and a soak before claiming always-on operation.
7. **Live pricing and delivery review.** Confirm quote units, decimals, USD conversion provenance, market cap/FDV/liquidity semantics, stale states, reconnect refetch and reorg invalidation across all consumers. Process-local SSE is single-replica only.
8. **Documentation drift.** docs/IMPLEMENTATION_STATUS.md still includes earlier 57-test/pre-broadcast statements; treat these as historical until reconciled. README's imported PAR mainnet deployment section describes upstream infrastructure, NOT an approved TRND mainnet deployment.

Read docs/BATCH_A_KEEPER_SAFETY.md for existing real-simulation, advisory-lock, retry, blocked-epoch and ranking work. Do not repeat the obsolete claim that current dry-run never simulates. Do not call the ranking wash-trade/Sybil-proof.

### Correct immediate sequence

- Fetch/inspect current main and map already-completed acceptance items to tests.
- Fix the receipt and zero-recipient cases, then prove interrupted-action recovery.
- Verify deployed API/Frontend compatibility, environment separation and truthful live metrics outside Token Market.
- Retain full-history/reconciliation evidence and demonstrate persistent test deployment.
- Continue Batch B routing, then C/D/E Viral ingestion, scoring and RWA matching.
- Keep final security/audit/multisig/mainnet gates mandatory.

### Setup reference, based on current scripts

Use Node.js 22+, PostgreSQL 16, lockfiles, and Foundry matching CI. Current app is Next.js, not the historical Base44 export.

```bash
git clone --recurse-submodules https://github.com/mamadmisaghi/trnd-fun.git
cd trnd-fun
git fetch origin
git status --short --branch
git log -5 --oneline origin/main
git switch -c feat/trnd-continuation origin/main
git submodule update --init --recursive
```

With an existing dirty checkout, preserve changes and use an isolated worktree instead of reset/clean. Read AGENTS.md and this handoff first.

From apps/indexer, use a disposable local DB:
```bash
npm ci --no-audit --no-fund
cp .env.example .env
docker compose up -d postgres
node --env-file=.env src/migrate.js
npm test
```

Set TEST_DATABASE_URL to a disposable PostgreSQL database through your configured environment. Then:
```bash
npm run test:postgres
node --env-file=.env scripts/smoke-chain.js
node --env-file=.env src/main.js
```

The scripts do not automatically load .env; use --env-file or explicit service environment injection. Do not print real environment values. Run one-block smoke on a separate disposable DB, because it invokes a selected block ingest; don't use it to move a production cursor. For full replay use npm run backfill, then npm run reconcile with properly injected environment and retain BACKFILL_REPORT_PATH / RECONCILIATION_REPORT_PATH outputs.

Keeper stays KEEPER_ENABLED=false and KEEPER_DRY_RUN=true. No key is required for read-only verification. Example local DB credentials are not production credentials.

From apps/web: npm ci, npm run build; use npm run dev for local viewing. From contracts:
```bash
forge build --sizes
forge test --no-match-path 'test/fork/*'
```

No broadcast is needed for the first continuation task.

### Access and decision gates

Already settled: TRND.fun brand/TRND token, locked preview, fee splits, top-five payout weights, repeat Signal launches, one pair per launch in V1.

Do not invent or include provider credentials. Bright Data/6551 credentials previously pasted into chat require rotation. Later stages may need chosen staging host, persistent DB/RPC capacity, provider subscriptions, least-privilege testnet Keeper identity, production ranking approval and independent audit/multisig setup.

Report these only when they actually block a next action; do not ask the user to restate project history.

---

## 1. Start the next Codex session with this

```text
Continue the TRND.fun project in this connected GitHub repository:
https://github.com/mamadmisaghi/trnd-fun

TRND.fun is the final product name and TRND is the platform token. The repository has now been renamed to mamadmisaghi/trnd-fun. The historical viral-terminal-protocol URL redirects; use the current URL.

Before editing:
1. Fetch a clean origin/main and report the actual HEAD, recent commits, open PRs, relevant branches, and working-tree state.
2. Read AGENTS.md and CODEX_HANDOFF.md completely, then inspect the repository documents and deployment manifests listed there.
3. Compare repository reality with the handoff. Current code and confirmed onchain manifests win over stale prose; report mismatches.
4. Preserve both backup branches:
   - backup/trnd-brand-preview-exact-20260907
   - backup/viral-terminal-before-trnd-20260907
5. Treat the approved TRND.fun design as locked. Do not redesign, restructure pages, rename routes, change the component hierarchy, or replace responsive behavior. Only make minimal changes required for real data, truthful loading/error/empty states, accessibility, or confirmed integration defects.
6. Continue from main on a new feature branch. Never develop from or merge the exact-preview backup wholesale; it contains an older functional snapshot and a different Sites identity.
7. Read the dated checkpoint in section 0, then validate only the remaining gaps. PRs #10–#14 already added PostgreSQL migration/recovery tests, reconciliation, live OHLC/SSE wiring, and real keeper dry-run simulations. Do not rebuild these.
8. Run real PostgreSQL integration tests, indexer tests, web build, contract tests, and container checks. Validate against confirmed Robinhood testnet history.
9. Keep keeper execution disabled and dry-run by default. Use only a disposable testnet operational wallet for any approved broadcast.
10. Before merge or deployment, show changed files, architecture impact, exact tests/results, security implications, remaining blockers, and the proposed PR. No production/mainnet deployment without explicit user approval.

Hard rules:
- Never expose, print, log, or commit private keys, RPC secrets, provider tokens, or API credentials.
- Never place secrets in NEXT_PUBLIC_*.
- Previously shared Bright Data and 6551 credentials must be treated as exposed and rotated before reuse.
- Never use the fixed-price TestnetEthQuoteAdapter on mainnet.
- No mainnet or real-funds enablement without independent audit, multisigs, operational runbooks, and explicit user approval.
- Keep buyback/burn manual and multisig-controlled.
- Use integer/bigint arithmetic for canonical monetary and chain values.
- A Signal may produce multiple launches. Do not add one-event-one-launch enforcement or event attestation to contracts.
- V1 uses exactly one pair per launched token; multi-pair is V2.

Begin with an evidence-based status report, then execute the next incomplete Batch A acceptance criteria. Do not stop after planning unless access, infrastructure, or required credentials truly block execution.
```

## 2. Identity and locked visual source of truth

- Final platform name: **TRND.fun**
- Platform token: **TRND**
- Old name: ViralTerminal, retained in historical filenames, paths and commits. Current GitHub slug: trnd-fun.
- Approved live visual reference: `https://trnd-fun-brand-preview.gofivahootan.chatgpt.site/live`
- Approved Sites project: `appgprj_6a9eb0fc3f888191b083dc5731f0a862`
- Exact Sites source commit: `f32e6a7706abb9c74a7ed6e839111ef78abca2b9`
- Exact GitHub preservation branch: `backup/trnd-brand-preview-exact-20260907`
- Exact GitHub preservation commit: `c2187ff92319caea5a52156885babe020f6abedf`
- Historical pre-TRND UI branch: `backup/viral-terminal-before-trnd-20260907`

Earlier recovery verified all 82 files in the backup web subtree against the approved Sites source. The 2026-09-07 comparison at main 9a5c6f6 found 75/82 matching blobs. That is historical evidence, not a claim of byte equality with the newer d5a076a frontend, which has since received data integration fixes. The seven differences were the Sites manifest, two launch/wallet integration surfaces, two protocol integration files, and two SVG assets. Current `main` contains newer functional work; therefore:

1. build from `main`;
2. use the live URL and exact-preview backup as the visual oracle;
3. port only a proven visual difference when required;
4. never replace `main` with the backup tree;
5. never copy the backup `.openai/hosting.json` into another deployment target without deliberate verification.

Locked visual direction:

- premium dark terminal surface;
- neon-green TRND.fun identity;
- approved typography, density, spacing, cards, status treatments, charts, motion, and responsive behavior;
- existing routes, page layout, component hierarchy, and interaction model;
- no restoration of the ViralTerminal wordmark or name.

Allowed UI changes are limited to real-data wiring, accurate pending/confirmed/error/empty/stale states, accessibility, and small integration fixes. Major aesthetic changes require explicit user approval.

## 3. Product definition

TRND.fun is an AI-powered real-time cultural-intelligence and token-launch platform for Robinhood Chain.

Core loop:

1. ingest public social and news signals;
2. detect emerging attention and high-authority events;
3. compute a measurable Viral Score from 0–100;
4. explain why the event is moving;
5. recommend four currently enabled Robinhood RWA pair assets with independent match scores;
6. let a user launch a token paired with one selected asset;
7. let users buy and sell through validated ETH-to-pair routing;
8. index launches, markets, trades, holders, fees, rewards, and claims from canonical chain data.

Primary surfaces:

- landing and live overview;
- Analyzer / live Signal feed;
- Signal detail and intelligence;
- Markets / Explore;
- Token Market;
- Launch Studio and manual Create;
- Creators and creator profiles;
- Portfolio;
- Docs.

Current web routes are under `apps/web/app`: `/`, `/live`, `/signals`, `/signal/[id]`, `/launch/[id]`, `/create`, `/explore`, `/token/[id]`, `/creators`, `/creator/[id]`, `/portfolio`, and `/docs`.

## 4. Locked protocol and economics

- Production uses independent TRND.fun contracts; it must not depend on the o1 API.
- Target chain: Robinhood Chain.
- V1: one quote pair per launched token; multi-pair is V2.
- A Signal may be launched more than once.
- No ViralEventRegistry, event attestation, or contract-level one-signal-one-launch restriction.
- RWA-paired markets remain buyable and sellable using ETH through validated routes.
- Atomic creator buy is supported.
- Pools are ordinary Uniswap v4 pools without a custom hook.
- Launch liquidity is permanently locked.

| Parameter | Locked value |
| --- | --- |
| Launch fee | `0.001 ETH` |
| Opening FDV target | approximately `$4,000` |
| Total supply | `1,000,000,000` tokens |
| Base trading fee | `1%` on buys and sells |
| Optional creator fee | shared buy/sell rate, `0–10%` |
| Creator share of base fee | `50%` |
| Daily top-creator reward vault | `20%` |
| Operations/API/team vault | `10%` |
| TRND buyback vault | `20%` |
| Top-five epoch weights | `40 / 25 / 15 / 12 / 8` |
| Reward epoch | 24-hour UTC |

The creator receives 100% of the optional creator fee in addition to the 50% base-fee share. Buyback assets accumulate in the buyback vault. V1 has no automatic burn; buyback/burn remains a manual multisig-controlled operation.

RWA matching rules:

- never hardcode a pair count such as 194 or 196;
- synchronize the active/enabled PairAsset catalog dynamically;
- recommend exactly four enabled assets;
- each score is independently 0–100 and the four scores need not sum to 100;
- store the selected pair, score, rationale, and model/version at launch time.

## 5. Repository map and source-of-truth order

Primary areas:

- `apps/web` — locked TRND.fun Next.js product UI and testnet wallet/protocol integration.
- `apps/indexer` — PostgreSQL indexer, read API, candles, holders, SSE, and keeper foundation.
- `apps/testnet-api` — temporary testnet-facing API surface; do not confuse it with the final production architecture.
- `contracts` — launchpad, routing, fee, reward, registry, tests, scripts, and deployment manifests.
- `deployment-packages/robinhood-testnet-genesis` — immutable integration handoff for the first confirmed testnet deployment.
- `docs` — protocol, status, security, and release material; some filenames retain the old Viral naming for history.

Source-of-truth priority:

1. confirmed onchain state and versioned deployment manifests;
2. current `origin/main` code;
3. green CI and reproducible test output;
4. this handoff;
5. older prose or conversation summaries.

Repository facts verified at this handoff:

- `main`: `d5a076ad85da13bcdfe3f74a2cb47269bad6e282`
- latest merged implementation: PR #14, Complete pre-AI Batch A readiness
- open pull requests: none detected;
- Current-head Indexer, Protocol and Web workflows all succeeded. Specific remaining integration/security/operations gates still require review; a green workflow does not prove a running production service.
- relevant branches include `feat/indexer-market-keeper`, `feat/trnd-ui-eth-routes`, operational deployment branches, and the two required backup branches above.

## 6. Confirmed completed work

Frontend and flows:

- approved TRND.fun brand/UI is present on `main`;
- wallet connection and Robinhood testnet network handling;
- manual Create and Signal Launch paths;
- atomic Creator Buy;
- Buy and Sell paths;
- fee collection and creator claim UI paths;
- exact approved visual snapshot preserved in GitHub.

Contracts/testnet:

- 61 contract unit/fuzz tests previously passed across 7 suites with zero failures;
- fee-conservation fuzzing ran 256 cases;
- testnet contracts were explorer-verified;
- a real onchain smoke flow succeeded: ETH-funded creator launch/buy, second ETH buy, sell to ETH, collect fees, and claim pair/token fees;
- internal security review exists at `docs/INTERNAL_SECURITY_REVIEW_2026-09-07.md` and is explicitly not an independent audit.

Batch A foundation now on `main` at `9a5c6f6...`:

- PostgreSQL migration expansion for enriched market data and keeper state;
- resumable block processing and reorg-related structures;
- OHLCV candle derivation for `1m`, `5m`, `15m`, `1h`, and `1d`;
- holder tracking from ERC-20 transfers;
- read endpoints for markets, trades, candles, holders, and creator fees;
- process-local SSE at `/v1/stream`;
- keeper implementation with disabled/dry-run defaults, advisory locking, idempotent action keys, fee collection, and blocked reward finalization unless five valid creators exist;
- Dockerfile, migration workflow updates, unit tests, and a read-only live-chain smoke script;
- subsequent PR #13 adds frontend candles/holders/SSE wiring and truthful live Token Market states; see section 0 for remaining shared-client placeholders.

This foundation is implemented, but the full Batch A acceptance criteria below still require evidence. Do not describe it as production-ready.

## 7. Robinhood Chain testnet reference

- Chain ID: `46630`
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

Core deployment:

| Contract | Address |
| --- | --- |
| Launch Factory | `0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C` |
| Original Router | `0x55Bea0D582C48815585164AC476C2C0c71506B5d` |
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

ETH/RWA test route:

| Contract/asset | Address |
| --- | --- |
| Active ETH-route Router | `0xc3e36d0c7374dee38a092356a59e0829404729e9` |
| Testnet ETH Quote Adapter | `0xcc4375d3ff3a8048bdd50c1500593cf395f7ac68` |
| Test Wrapped ETH | `0x78a01a9b91ad157867ffcaf9b93c38dd83221976` |
| Faucet USDG | `0x20A887523fbbF0024eB46ee672DF15A95521E680` |
| Faucet TSLA RWA | `0xc9f9c86933092bbbfff3ccb4b105a4a94bf3bd4e` |

The adapter is centralized, owner-priced, reserve-limited, and testnet-only. Never carry it into mainnet configuration.

Confirmed smoke market:

- token: `0x018129F6970cB20877C987d22E4ad7Ef9Ddba791`
- pair: USDG
- pool ID: `0x86ed7d66e7a22caaf660e67a6b21bba19f4ee5b03882717569dde2b6022e2686`
- launch + Creator Buy tx: `0xc558c8479fc31ef1e2c76b41c4d2b6fa8a4dd172d2294a3eaaf3b9ea3f7eaaa6`
- second Buy tx: `0x0f8ac29b31fe43b60acd0b8331265605f64cbc8fff6143b1ae42a3b9eb644be2`
- Sell approval tx: `0xae8a4dc5c27154d25229b07318927446ea4aca13849355c0296dda845e8bfb99`
- Sell to ETH tx: `0x53833379d0b0d2a1ba52cd7247105394a58ba7d5d8655c6b73b6704a6c562b59`
- collect fees tx: `0xb7e78bbc77fc752a28bc900e72b7134bcc2a3a35c7007701f63f2b93acafa5fb`
- claim USDG tx: `0x0224907b970ee0e5dfed196d6f2c4bb89115070f601e9dc3133a5e7d1c7c02e5`
- claim launch token tx: `0xbd4d52896c23b4207a660d4cabd220d9ce1d6b71650cbbf0fc122b6eed8dceeb`

Canonical manifests:

- `contracts/deployments/46630/core.json`
- `contracts/deployments/46630/support.json`
- `contracts/deployments/46630/eth-routes.json`
- `contracts/deployments/46630/eth-route-smoke.json`

## 8. Immediate execution priority — validate and finish Batch A

Do not rebuild the landed indexer from scratch. Inspect current code and close only evidence-backed gaps.

Acceptance checklist (several items already implemented in PRs #10–#14; map each to current tests/evidence before deciding it is missing):

1. run first-install and upgrade migrations against disposable PostgreSQL, including the pre-ledger upgrade path;
2. run all PostgreSQL integration tests without skips;
3. backfill existing launches, transfers, swaps, fees, and claims from the correct first deployment block;
4. prove restart idempotency and uniqueness by `(chain_id, transaction_hash, log_index)`;
5. simulate a confirmed-block reorg and prove deterministic rewind/rebuild of balances, candles, and stats;
6. reconcile indexed launches, holders, fees, and claimable values against canonical contract views and manifests;
7. validate price/volume/candle math against known Swap transactions using bigint/integer arithmetic;
8. verify routed Recent Trades attributes the end-user wallet for `ZapBuy` and `ZapSell` paths;
9. verify `/v1/stream` reconnect/backoff and confirmed-only delivery;
10. ensure live/onchain markets never silently fall back to mock charts, trades, holders, or stats;
11. add/verify health, readiness, lag, structured logs, bounded retries, and RPC backoff;
12. run keeper in dry-run only and verify simulations, advisory lock, idempotency, retry journal, thresholds, reconciliation, and blocked epochs;
13. document residual wash-trading/Sybil risk; `testnet_trade_count_v1` is not a production ranking model;
14. run contract, indexer, PostgreSQL, web build, and container checks in CI;
15. deploy only to a separate test environment and soak before proposing production use.

Batch A acceptance evidence must show:

- no duplicate or lost confirmed events after restart;
- reorg-safe derived data;
- enriched historical backfill;
- real swap-driven OHLCV and chart movement;
- correct routed wallet attribution;
- restart/reorg-safe holders;
- confirmed-only SSE with reconnect behavior;
- no silent live-to-mock fallback;
- idempotent, simulated, journaled, reconciled fee collection;
- reproducible creator ranking and safe blocking with fewer than five eligible creators;
- PostgreSQL integration tests actually ran;
- all relevant CI checks are green;
- locked UI structure remains intact.

## 9. Roadmap after Batch A

### Batch B — dynamic pair catalog and production routing

- synchronize enabled PairAsset registry dynamically;
- validate token metadata, logos, decimals, and transfer behavior;
- canonical ETH ↔ RWA route discovery;
- server-controlled route allowlist;
- quote TTL, deadline, minimum output, price impact, and simulation;
- reject fee-on-transfer, rebasing, or unsupported assets;
- RPC/provider redundancy and route monitoring;
- replace the fixed-price testnet adapter for any production configuration.

### Batch C — Viral Engine ingestion

- rotate all previously shared provider credentials before use;
- server-side X, News, TikTok, Instagram, and YouTube adapters;
- raw event store and normalized source IDs;
- exact-post deduplication and metric snapshots;
- provider health/cost tracking;
- idempotent queues, retry/backoff, and dead-letter handling.

### Batch D — scoring and AI intelligence

- cheap-to-expensive deterministic screening funnel;
- velocity, acceleration, engagement anomaly, reach, authority, cross-platform, novelty, and persistence features;
- measurable Viral Score 0–100;
- concise “Why this is moving” explanation;
- narrative/entity extraction and clustering;
- AI only for shortlisted candidates;
- evaluation dataset and reviewer feedback loop.

Proposed evaluation targets, not measured current performance: duplicate rate below `1%`, Precision@20 at least `70%`, p95 live-delivery latency below `60 seconds`, top-four pair hit rate at least `80%`, and a seven-day shadow test before public signals.

### Batch E — RWA matching and product integration

- top-four independent match scores from enabled assets only;
- rationale and model/version persistence;
- real ViralEvent API and live Analyzer delivery;
- Signal → Launch provenance;
- reviewer/admin controls and false-positive handling;
- real portfolio and creator analytics from indexed data.

### Batch F — release hardening

- separate deployer, keeper, treasury, and admin roles;
- multisig ownership, timelocks, and emergency runbook;
- secrets manager, monitoring, alerts, backups, and recovery drills;
- multi-wallet, concurrency, failure, and load testing;
- seven-day testnet soak;
- independent professional audit and remediation;
- staging/production separation;
- controlled low-value mainnet canary only after explicit approval.

## 10. Security and truthfulness rules

- No secrets in Git, chat, logs, client bundles, or `NEXT_PUBLIC_*`.
- Bright Data and 6551 credentials previously shared in conversation are compromised for operational purposes and must be rotated.
- Browser input is never authoritative for routes, pair validity, fees, launch status, or confirmations.
- A launch is not confirmed until the transaction is confirmed and indexed.
- Use exact integers/bigints for accounting; formatting happens at API/UI boundaries.
- The public testnet RPC is rate-limited; repeated indexing needs controlled backoff and production-grade provider planning.
- Process-local SSE is acceptable only for a single-replica test deployment. Multi-replica production needs Redis, PostgreSQL `LISTEN/NOTIFY`, or another event bus.
- Excluding direct creator self-trades does not make rewards Sybil- or wash-trading-proof.
- Internal review is not an independent audit.
- No mainnet deployment, real funds, or production-safety claim before every release gate is met.

## 11. Read these first

1. `AGENTS.md`
2. `CODEX_HANDOFF.md`
3. `docs/VIRAL_PROTOCOL_SPEC.md` (historical filename; current product is TRND.fun)
4. `docs/IMPLEMENTATION_STATUS.md`
5. `docs/INTERNAL_SECURITY_REVIEW_2026-09-07.md`
6. `docs/SECURITY_AND_RELEASE_PLAN.md`
7. `contracts/deployments/46630/core.json`
8. `contracts/deployments/46630/support.json`
9. `contracts/deployments/46630/eth-routes.json`
10. `contracts/deployments/46630/eth-route-smoke.json`
11. `apps/indexer/README.md`
12. `apps/web/README.md`
13. `apps/web/lib/protocol/robinhood-testnet.js`

## 12. Definition of done

TRND.fun is complete only when:

- real social/news inputs produce evaluated Signals;
- scores and pair matches are measured rather than decorative;
- users can launch, buy, and sell through validated routes;
- every live market, trade, chart, holder, fee, reward, and claim comes from canonical data;
- the indexer and keeper recover safely from restarts, reorgs, and provider failure;
- contracts receive independent audit and remediation;
- production roles are multisig-controlled and operationally separated;
- monitoring, backups, incident procedures, and testnet soak are complete;
- a controlled mainnet canary receives explicit approval;
- the locked TRND.fun UI receives only necessary final functional polish.

Until these gates pass, label the system testnet/beta and never describe it as production-safe.

## Handoff delivery boundary

This update changes documentation only, on a separate review branch. It does not merge application code, alter the locked UI, change deployed contracts, provision infrastructure or authorize mainnet. The scratch environment became unavailable during preparation; the durable GitHub document is the deliverable, not an unverified local download link. Previous unsaved local handoff drafts are superseded by this dated checkpoint.
