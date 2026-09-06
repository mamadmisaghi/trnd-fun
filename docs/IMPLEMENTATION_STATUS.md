# ViralTerminal implementation status

Updated: 2026-09-06 UTC

## Current release gate

**Not ready for Robinhood Chain testnet deployment yet.** The repository has a
reproducible PairPad/PAR-derived launch baseline, but the ViralTerminal-specific
economics are being integrated in phases. Deploying the baseline now would
publish fee behavior that does not match the product specification.

## Completed

- Imported and pinned the launch/pool/locker/router baseline.
- Documented the ViralTerminal onchain specification.
- Implemented the 24-hour top-five `ViralRewardVault` with 40/25/15/12/8
  weights and pull-based claims.
- Implemented `ViralFeeSplitter` for the fixed 50/20/10/20 base-fee policy.
- Implemented separate multisig-owned operations and buyback treasury vaults.
- Added native ETH and ERC-20 split tests, authorization tests, and exact
  rounding-conservation coverage.
- Wired the splitter into the permanent-liquidity locker.
- Added a curated, versioned pair registry and factory launch gate.
- Added an automated GitHub testnet preflight that validates the deployer,
  chain ID, gas balance, and external Uniswap contract bytecode without
  exposing the private key.
- Confirmed the configured deployer has `0.02` test ETH and that PoolManager,
  PositionManager, and Permit2 have bytecode on chain `46630`.
- Added a staged, artifact-producing support-stack deployment workflow.
- Deployed and explorer-verified the Robinhood testnet support stack. The
  canonical addresses and transaction hashes are recorded in
  `contracts/deployments/46630/support.json`; the workflow now refuses a
  duplicate support deployment when that manifest exists.
- Unit-test status: 57 passed, 0 failed, including a 256-run fee-conservation
  fuzz test and fee-on-transfer rejection coverage.

## Required before testnet broadcast

1. Snapshot the final ViralTerminal fee terms in every launch record.
2. Load faucet RWA assets into the curated pair registry with explicit launch
   economics for testnet.
3. Replace remaining PairPad names and PAR/PONS-specific assumptions.
4. Add fuzz and invariant coverage for fee conservation and claims.
5. Confirm the live Uniswap v4 PoolManager and PositionManager addresses on
   Robinhood Chain testnet and verify deployed bytecode at those addresses.
6. Add a deterministic testnet deployment manifest and post-deploy assertions.

## Robinhood Chain testnet

- Chain ID: `46630`
- Public RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`
- Verification API: `https://explorer.testnet.chain.robinhood.com/api/`

The public RPC is suitable for initial checks but is rate-limited. A dedicated
Alchemy endpoint should be used for repeated deployment, indexing, and UI work.

## Wallet rule

Use a fresh, disposable testnet-only EOA for broadcasting. Never paste its seed
phrase or private key into chat, an issue, source code, or Git. Load the key only
as a local secret environment variable. Protocol ownership and treasury roles
must use separate test addresses during rehearsal and a multisig before any
mainnet release.
