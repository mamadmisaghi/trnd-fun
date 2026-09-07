import { parseAbi, parseAbiItem } from "viem";

export const protocolAbi = parseAbi([
  "event TokenLaunched(address indexed token, bytes32 indexed poolId, address indexed deployer, address pairToken, uint256 launchConfigId, uint24 poolFee)",
  "event LaunchPositionMinted(address indexed token, uint256 positionId, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 tokenAmount, uint256 phantomQuote)",
  "event CreatorFeeRecipientUpdated(address indexed token, address indexed previousRecipient, address indexed newRecipient)",
  "event FeesCollected(address indexed token, address currency0, address currency1, uint256 protocolAmount0, uint256 protocolAmount1, uint256 creatorAmount0, uint256 creatorAmount1)",
  "event Claimed(address indexed recipient, uint256 amount)",
  "event ClaimedToken(address indexed recipient, address indexed token, uint256 amount)",
]);

export const swapEvent = parseAbiItem("event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)");

export const tokenAbi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

export const factoryViewAbi = parseAbi([
  "function getLaunchedToken(address token) view returns ((address token,address deployer,address creatorFeeRecipient,address pairToken,uint256 phantomQuote,uint24 poolFee,int24 tickSpacing,int24 tickLower,int24 tickUpper,uint128 liquidity,uint256 positionId,uint16 baseFeeBps,uint16 creatorTaxBps,uint16 protocolFeeShareBps,address protocolFeeRecipient,uint64 launchedAt,bool exists))",
]);
