import { parseAbi, parseAbiItem } from "viem";

export const protocolAbi = parseAbi([
  "event TokenLaunched(address indexed token, bytes32 indexed poolId, address indexed deployer, address pairToken, uint256 launchConfigId, uint24 poolFee)",
  "event LaunchPositionMinted(address indexed token, uint256 positionId, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 tokenAmount, uint256 phantomQuote)",
  "event CreatorFeeRecipientUpdated(address indexed token, address indexed previousRecipient, address indexed newRecipient)",
  "event FeesCollected(address indexed token, address currency0, address currency1, uint256 protocolAmount0, uint256 protocolAmount1, uint256 creatorAmount0, uint256 creatorAmount1)",
  "event Claimed(address indexed recipient, uint256 amount)",
  "event ClaimedToken(address indexed recipient, address indexed token, uint256 amount)",
  "event FeesSplit(address indexed creator, address indexed currency, uint256 totalAmount, uint256 creatorAmount, uint256 rewardsAmount, uint256 operationsAmount, uint256 buybackAmount, uint16 baseFeeBps, uint16 creatorFeeBps)",
  "event EpochFunded(uint256 indexed epochId, address indexed currency, uint256 amount)",
  "event EpochFinalized(uint256 indexed epochId, address indexed currency, uint256 totalAmount, address[5] recipients, uint256[5] amounts)",
  "event RewardClaimed(address indexed recipient, address indexed currency, uint256 amount)",
  "event ZapBuy(bytes32 indexed poolId, address indexed buyer, uint256 ethIn, uint256 tokensOut)",
  "event ZapSell(bytes32 indexed poolId, address indexed seller, uint256 tokensIn, uint256 ethOut)",
]);

export const swapEvent = parseAbiItem("event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)");
export const transferEvent = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

export const tokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

export const factoryViewAbi = parseAbi([
  "function getLaunchedToken(address token) view returns ((address token,address deployer,address creatorFeeRecipient,address pairToken,uint256 phantomQuote,uint24 poolFee,int24 tickSpacing,int24 tickLower,int24 tickUpper,uint128 liquidity,uint256 positionId,uint16 baseFeeBps,uint16 creatorTaxBps,uint16 protocolFeeShareBps,address protocolFeeRecipient,uint64 launchedAt,bool exists))",
]);

export const lockerKeeperAbi = parseAbi([
  "function pendingFees(address token) view returns (uint256 amount0, uint256 amount1)",
  "function collectFees(address token) returns (uint256 amount0, uint256 amount1)",
]);

export const rewardKeeperAbi = parseAbi([
  "function currentEpoch() view returns (uint256)",
  "function epochFunding(uint256 epochId, address currency) view returns (uint256)",
  "function epochFinalized(uint256 epochId, address currency) view returns (bool)",
  "function finalizeEpoch(uint256 epochId, address currency, address[5] recipients) returns (uint256[5] amounts)",
]);
