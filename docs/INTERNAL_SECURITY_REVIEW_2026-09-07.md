# TRND.fun protocol — internal security review

Date: 2026-09-07  
Scope: current V2 launchpad contracts, fee collection and claims, launch
forwarding, ETH route composition, and the Robinhood Chain testnet adapter.

Deployment tracking: testnet ETH-route deployment requested after green contract and web CI.

## Result

No critical or high-severity issue was found in the reviewed scope. The unit
suite covers launch configuration, pair allowlisting, fee conservation,
collection and claims, reward accounting, launch-and-buy, route validation,
slippage failures, and reentrancy-sensitive external entry points.

This is an internal engineering review, **not an independent audit** and not a
mainnet-readiness certificate. A professional audit, deployment rehearsal,
monitoring, multisig ownership, and incident controls remain release gates for
real-value operation.

## Security properties checked

- The factory validates launch configuration, quote-token enablement, token
  decimals, opening economics, and the trusted launch forwarder.
- Launch parameters are snapshotted; later protocol configuration changes do
  not rewrite existing pool economics.
- Creator fee-recipient changes use a proposal delay and execution window.
- Liquidity positions are held by the locker and are not exposed as creator
  withdrawals.
- Collected fees are accounted through escrow and claimed by recipients; the
  fee-conservation fuzz test asserts that the full amount is allocated.
- Router swap and launch entry points are non-reentrant and impose caller-set
  minimum output bounds.
- ETH route endpoints are checked: buy paths must begin at configured WETH and
  sell paths must end at it. V4 hop continuity is checked onchain.
- Pair assets are not accepted solely from client metadata; the factory checks
  the onchain pair registry.

## Testnet adapter review

`TestnetEthQuoteAdapter` exists only because Robinhood Chain testnet currently
lacks the canonical Uniswap V3 liquidity required by the production ETH route.
It is intentionally simple and deterministic:

- native input is wrapped 1:1 into a dedicated test WETH;
- ERC-20 input is pulled with `SafeERC20`;
- output comes only from pre-funded reserves;
- owner-set rates cannot mint or fabricate an RWA balance;
- slippage is enforced on the adapter leg and again on the final launch-token
  output;
- pause and reserve-recovery controls are owner-only.

The adapter is centralized, owner-priced, reserve-limited, and unsuitable for
mainnet. Production configuration must use canonical WETH, canonical Uniswap
contracts, approved liquidity routes, and independent price/route monitoring.

## Findings and required follow-ups

| ID | Severity | Finding | Resolution / gate |
| --- | --- | --- | --- |
| R-01 | Medium | A client can submit arbitrary intermediate route hops even though endpoints and final slippage are checked. | Backend must derive routes from an allowlisted route catalog. Do not accept arbitrary browser-provided routes in production. |
| R-02 | Medium | Protocol owner can change future-launch fees, pairs, economics, and launch forwarder. | Move ownership to a multisig and add timelocks for production administrative changes. |
| R-03 | Medium | Testnet adapter uses owner-set prices and finite reserves. | Keep chain-id/deployment guards and never deploy or reference it in production. |
| R-04 | Low | SwapRouter02 exact-input calls have no explicit deadline field. | Use short-lived backend quotes, fresh simulation, and wallet-side expiry before production submission. |
| R-05 | Low | Fee collection requires an explicit keeper/user transaction. | Add monitored keeper automation and retry-safe indexing before launch. |

## Release gates

1. All unit, fuzz, frontend, and indexer tests green in CI.
2. Full Robinhood testnet launch → buy with ETH → sell to ETH → collect → claim
   rehearsal for ETH, USDG, and one RWA pair.
3. Verified source for every active contract and a versioned deployment
   manifest checked into the repository.
4. Backend-owned route allowlist and fresh quote/slippage policy.
5. Multisig/timelock operational plan and emergency pause runbook.
6. Independent audit before mainnet funds are enabled.
