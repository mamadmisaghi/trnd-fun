# Baseline Reproduction Report

Date: 2026-09-06 UTC  
Upstream commit: `e80a217`  
ViralTerminal baseline commit: `1ee2edc`  
Foundry: `1.8.1`  
Solidity: `0.8.26`

## Results

- Dependency submodule initialized at pinned commit.
- Full contract compilation succeeded.
- Unit suites succeeded: 39 passed, 0 failed, 0 skipped.
  - Fee escrow: 4 passed.
  - Quote pricer: 20 passed.
  - Launchpad: 15 passed.
- Compiler/linter warnings are present in the upstream baseline and require
  classification before release.
- Robinhood mainnet fork tests were attempted against the public RPC endpoint.
  The endpoint timed out while returning the chain ID, so fork behavior is not
  yet marked as reproduced.

## Baseline gate

Local baseline: PASS.  
Robinhood fork baseline: BLOCKED BY RPC AVAILABILITY.  
Mainnet readiness: NOT ASSESSED / NOT AUTHORIZED.

## Next action

Pin a responsive Robinhood archival RPC and rerun every `test/fork/*` suite at
a fixed block before behavior-changing contract work is considered releasable.
