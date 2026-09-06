# Security and Release Plan

## Rule zero

No mainnet deployment is authorized by a successful build or test suite. The
upstream baseline is unaudited and ViralTerminal changes create a new system that
must be independently reviewed.

## Phase 0 — Reproduce

- Pin the upstream commit and submodules.
- Build with a pinned Foundry/Solidity toolchain.
- Run all unit tests without modification.
- Run fork tests against an archived/fixed Robinhood Chain block.
- Record baseline bytecode sizes, warnings, and gas snapshots.

Exit: reproducible green baseline.

## Phase 1 — Separate

- Preserve MIT attribution.
- Rename contracts and events without changing behavior.
- Remove PAR/PONS-specific registry assumptions.
- Add a curated Viral pair registry.
- Prove behavioral equivalence with the baseline tests.

Exit: independently named stack with unchanged launch behavior.

## Phase 2 — Viral fee system

- Add the 50/20/10/20 base-fee splitter.
- Credit the creator's 50% base share plus 100% creator fee.
- Add dedicated vaults and immutable per-launch fee terms.
- Do not swap or burn inside fee collection.
- Add accounting conservation invariants and rounding tests.

Exit: every collected unit is attributable; no stranded or over-allocated funds.

## Phase 3 — Pair and routing controls

- Launch only against enabled pair assets.
- Validate decimals, transfer behavior, and route endpoints.
- Add ETH-funded atomic dev buy for approved quote routes.
- Enforce deadline, minimum output, and refund invariants.

Exit: launch/buy/sell works for ETH, USDG, and test RWA pairs.

## Phase 4 — Adversarial testing

- Unit, fuzz, invariant, and fork tests.
- Reentrancy and hostile-recipient tests.
- Fee-on-transfer/rebasing-token rejection tests.
- First-buy/front-run and pool-initialization race tests.
- Slippage, stale route, manipulated reference price, and rounding tests.
- Static analysis with Slither and compiler/linter review.

Exit: zero unresolved critical/high findings from internal review.

## Phase 5 — Robinhood testnet

- Deploy from a fresh testnet-only wallet.
- Transfer ownership to a test multisig.
- Verify every contract and publish addresses/constructor arguments.
- Execute launch, atomic dev buy, ordinary buy, sell, collect, creator claim,
  rewards funding, treasury collection, and failure/recovery scenarios.
- Run an indexer and reconcile every balance with onchain events.

Exit: repeatable end-to-end testnet runbook with reconciled accounting.

## Phase 6 — External security

- Freeze the release candidate.
- Obtain an independent professional audit.
- Fix findings and request remediation review.
- Run a public test period and establish responsible disclosure.
- Configure production multisig, role separation, monitoring, and incident pause
  policy for mutable entry points. Permanent liquidity custody remains unpausable
  and non-withdrawable.

Exit: audit sign-off and explicit mainnet go/no-go decision.

## Phase 7 — Capped mainnet beta

- Deploy verified contracts from the production multisig process.
- Begin with curated pairs and conservative limits.
- Monitor launch, routing, fee collection, and accounting alerts continuously.
- Expand only after live reconciliation and incident-free operation.

## Wallet handling

- Never paste a seed phrase or private key into chat, source code, logs, or Git.
- Local and fork tests use deterministic disposable test accounts.
- Testnet uses a fresh wallet containing only test assets.
- Mainnet deployment uses a hardware-backed multisig and a reviewed transaction
  bundle. No single EOA is the long-term owner or treasury.
