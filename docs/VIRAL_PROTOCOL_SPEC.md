# ViralTerminal Protocol Specification

Status: draft implementation specification  
Network target: Robinhood Chain  
Architecture target: independent launchpad using Uniswap v4 pools  
Hook policy for V1: no custom hook

## 1. Scope

V1 is the onchain launch and trading layer of ViralTerminal. The Viral Engine,
signal scoring, RWA recommendations, signal provenance, creator leaderboard,
and UI data are offchain systems and are not security-critical launch
restrictions.

The same signal may produce multiple launches. No viral-event registry or
one-signal-one-launch rule exists in the contracts.

## 2. Launch invariant

Each launch creates:

1. One immutable ERC-20 with a fixed supply of 1,000,000,000 tokens.
2. One Uniswap v4 pool against one selected quote asset.
3. One permanent, single-sided liquidity position beginning at the configured
   opening tick.
4. One locked position NFT with no liquidity withdrawal path.
5. Optional atomic creator/dev buy.

V1 supports one quote asset per launched token. Multi-pair launch is outside V1.

## 3. Pair policy

V1 uses a curated onchain registry. Initially eligible classes are:

- native ETH;
- USDG;
- explicitly enabled Robinhood Stock Tokens.

An asset being a valid ERC-20 is not enough. The registry must explicitly mark
it enabled and store the configuration version used by the backend/indexer.
Arbitrary ERC-20 quotes and spot-price route discovery are deferred until a
separate risk review.

## 4. Trading fee

The pool uses one static fee in both directions because V1 has no hook:

`totalPoolFeeBps = baseTradingFeeBps + creatorFeeBps`

Initial policy:

- `baseTradingFeeBps = 100` (1.00%);
- `creatorFeeBps` is selected at launch from 0 to 1,000 bps (0% to 10%);
- the selected fee and split are frozen in the launch record;
- the creator fee is identical on buys and sells;
- the entire creator fee belongs to the launch creator.

The 1% base trading fee is allocated as follows:

| Recipient | Bps of input amount | Share of base fee |
| --- | ---: | ---: |
| Creator escrow | 50 | 50% |
| Daily creator rewards vault | 20 | 20% |
| Operations/API vault | 10 | 10% |
| VIRAL buyback vault | 20 | 20% |

No collected trading asset is burned automatically.

Example with a 2% creator fee: the pool charges 3%; 2.5% is credited to the
creator, while 0.2%, 0.1%, and 0.2% go to rewards, operations, and buyback.

## 5. Fee currency

Uniswap v4 LP fees accrue in the swap input currency:

- a buy from quote asset to launch token accrues fees in the quote asset;
- a sell from launch token to quote asset accrues fees in the launch token.

The locker collects both currencies and sends them to the splitter. The splitter
accounts for each beneficiary in kind. It does not swap during collection.

Protocol conversions are separate treasury operations. They require approved
routes, minimum output, deadlines, slippage limits, per-transaction caps, and a
multisig-authorized executor. This avoids embedding price execution risk in the
permanent locker.

## 6. ETH-funded creator/dev buy

For an ETH-quoted launch, the launch fee is separated and remaining ETH buys the
new token atomically.

For a non-ETH quote such as NVDA, an approved route performs:

`ETH -> NVDA -> launched token`

The route conversion fee on `ETH -> NVDA` belongs to the external route/pool.
The ViralTerminal pool fee applies to `NVDA -> launched token`. The entire
operation must revert if route validation or `minAmountOut` fails.

## 7. Treasury policy

Collected protocol allocations remain in dedicated vaults. They are not burned
by the locker or splitter.

- Rewards vault funds the daily top-five creator distribution after an offchain
  calculation is committed through an authorized distributor.
- Operations vault funds API, infrastructure, audit, and team expenses.
- Buyback vault funds later purchases of the VIRAL token.

A VIRAL buyback and a VIRAL burn are separate governed actions. V1 starts with
manual multisig approval. Automation is allowed only after operational review.

### Daily creator rewards

The rewards vault operates in non-overlapping 24-hour epochs. For each epoch,
the five eligible creators are ranked using finalized offchain analytics. The
initial distribution of that epoch's allocated rewards is:

| Rank | Share of epoch rewards |
| --- | ---: |
| 1 | 40% |
| 2 | 25% |
| 3 | 15% |
| 4 | 12% |
| 5 | 8% |

The five shares total 100%. The reward vault credits claims; it does not push
funds to recipient wallets during finalization. Ranking logic is not embedded
in the launch contracts. The backend/indexer calculates eligible activity and
an authorized, multisig-controlled distributor finalizes the recipients for
each epoch. An epoch cannot be finalized twice.

Raw volume alone must not be treated as final eligibility because it directly
incentivizes wash trading. The offchain policy must support disqualification,
self-trade filtering, related-wallet filtering, reverted/finalized-chain checks,
and a minimum genuine-user threshold before production rewards are enabled.

## 8. Contract boundaries

Planned components:

- `ViralLaunchFactory`
- `ViralLauncherToken`
- `ViralTokenDeployer`
- `ViralPositionMinter`
- `ViralLaunchLocker`
- `ViralRouter`
- `ViralPairRegistry`
- `ViralFeeSplitter`
- `ViralCreatorEscrow`
- `ViralRewardVault`
- `ViralOperationsVault`
- `ViralBuybackVault`
- `ViralTreasuryExecutor`

The permanent locker must have no arbitrary call, liquidity withdrawal, fee
conversion, buyback, or burn capability.

## 9. Configuration

The following values are deploy-time or future-launch configuration, not eternal
constants:

- launch fee;
- opening FDV / phantom reserve;
- base trading fee;
- maximum creator fee;
- enabled quote assets;
- treasury recipients;
- launch configuration versions.

Changes affect future launches only. Existing pool keys, fee terms, and launch
records remain unchanged.

## 10. Confirmed initial launch policy

- Launch fee: 0.001 ETH.
- Opening FDV target: approximately USD 4,000.
- Fixed token supply: 1,000,000,000 tokens with 18 decimals.
- Base trading fee: 1% in both directions.
- Maximum creator fee: 10%, shared equally by buy and sell direction.
- Reward epoch duration: 24 hours.
- Top-five reward weights: 40% / 25% / 15% / 12% / 8%.

## 11. Pending implementation inputs before testnet

These do not block local implementation:

1. Exact opening phantom reserve derived from the approximately USD 4,000 FDV
   target and the approved ETH/quote reference method.
2. Exact official Robinhood Stock Token addresses enabled at testnet/mainnet.
3. Whether creator claims remain in-kind or a separate opt-in conversion service
   is offered by the application.
4. Production anti-wash-trading eligibility thresholds for daily rewards.
