import { defineChain } from "viem";

export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export const protocolContracts = {
  launchFactory: "0x8D196Fc239AE5C364eF4E8b76A987Acd6065929C",
  router: "0x55Bea0D582C48815585164AC476C2C0c71506B5d",
  pairRegistry: "0x8e84B45d98A2b8233Aa1bA8BB16b6678E1C947aa",
  launchLocker: "0x0CB8026DB8122b2454cd29aF31E1172b3cA39739",
  feeEscrow: "0xCA093138A86Ab9aA4f4aB7bE112F6B0a106c8722",
};

// Populated by the versioned Robinhood-testnet ETH-route deployment. These
// addresses intentionally belong to the collateralized test adapter; mainnet
// configuration must use canonical WETH and SwapRouter02 routes instead.
export const testnetEthRouteContracts = {
  wrappedEth: process.env.NEXT_PUBLIC_TESTNET_WRAPPED_ETH || "",
  adapter: process.env.NEXT_PUBLIC_TESTNET_ETH_ADAPTER || "",
  fee: 500,
};

export const nativePairAddress = "0x0000000000000000000000000000000000000000";

export const testnetPairAssets = {
  ETH: { symbol: "ETH", name: "Ether", address: nativePairAddress, decimals: 18, type: "NATIVE" },
  USDG: { symbol: "USDG", name: "Test Global Dollar", address: "0x20A887523fbbF0024eB46ee672DF15A95521E680", decimals: 6, type: "STABLE" },
  TSLA: { symbol: "TSLA", name: "Tesla Testnet Stock Token", address: "0xc9f9c86933092bbbfff3ccb4b105a4a94bf3bd4e", decimals: 18, type: "STOCK" },
};

export function getTestnetPair(symbol) {
  return testnetPairAssets[String(symbol || "").toUpperCase()] || null;
}

function encodeOneHopPath(tokenIn, tokenOut, fee) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(tokenIn || "") || !/^0x[0-9a-fA-F]{40}$/.test(tokenOut || "")) {
    throw new Error("The Robinhood testnet ETH route has not been deployed yet.");
  }
  return `0x${tokenIn.slice(2)}${Number(fee).toString(16).padStart(6, "0")}${tokenOut.slice(2)}`;
}

export function getTestnetEthLeg(pairOrAddress, direction = "buy") {
  const pair = typeof pairOrAddress === "string" && pairOrAddress.startsWith("0x")
    ? { address: pairOrAddress, type: pairOrAddress === nativePairAddress ? "NATIVE" : "ERC20" }
    : pairOrAddress;
  if (!pair || pair.type === "NATIVE" || pair.address === nativePairAddress) return { v3Path: "0x", v4Hops: [] };
  const buy = direction === "buy";
  return {
    v3Path: encodeOneHopPath(
      buy ? testnetEthRouteContracts.wrappedEth : pair.address,
      buy ? pair.address : testnetEthRouteContracts.wrappedEth,
      testnetEthRouteContracts.fee,
    ),
    v4Hops: [],
  };
}

export const launchFactoryAbi = [
  {
    type: "function",
    name: "launchFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewLaunchEconomics",
    inputs: [
      { name: "launchConfigId", type: "uint256" },
      { name: "pairToken", type: "address" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "poolKeyFor",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{
      name: "",
      type: "tuple",
      components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLaunchedToken",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{
      name: "",
      type: "tuple",
      components: [
        { name: "token", type: "address" },
        { name: "deployer", type: "address" },
        { name: "creatorFeeRecipient", type: "address" },
        { name: "pairToken", type: "address" },
        { name: "phantomQuote", type: "uint256" },
        { name: "poolFee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "tickLower", type: "int24" },
        { name: "tickUpper", type: "int24" },
        { name: "liquidity", type: "uint128" },
        { name: "positionId", type: "uint256" },
        { name: "baseFeeBps", type: "uint16" },
        { name: "creatorTaxBps", type: "uint16" },
        { name: "protocolFeeShareBps", type: "uint16" },
        { name: "protocolFeeRecipient", type: "address" },
        { name: "launchedAt", type: "uint64" },
        { name: "exists", type: "bool" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TokenLaunched",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "poolId", type: "bytes32", indexed: true },
      { name: "deployer", type: "address", indexed: true },
      { name: "pairToken", type: "address", indexed: false },
      { name: "launchConfigId", type: "uint256", indexed: false },
      { name: "poolFee", type: "uint24", indexed: false },
    ],
    anonymous: false,
  },
];

export const routerAbi = [
  {
    type: "function", name: "swapExactIn", stateMutability: "payable",
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" }, { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" }, { name: "tickSpacing", type: "int24" }, { name: "hooks", type: "address" },
      ] },
      { name: "zeroForOne", type: "bool" }, { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" }, { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "buyWithEth",
    stateMutability: "payable",
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ] },
      { name: "leg", type: "tuple", components: [
        { name: "v3Path", type: "bytes" },
        { name: "v4Hops", type: "tuple[]", components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ] },
      ] },
      { name: "minTokensOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "tokensOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "sellToEth",
    stateMutability: "nonpayable",
    inputs: [
      { name: "key", type: "tuple", components: [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" },
      ] },
      { name: "tokenIsCurrency0", type: "bool" },
      { name: "tokensIn", type: "uint256" },
      { name: "leg", type: "tuple", components: [
        { name: "v3Path", type: "bytes" },
        { name: "v4Hops", type: "tuple[]", components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ] },
      ] },
      { name: "minEthOut", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [{ name: "ethOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "launchAndBuyWithEth",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "logo", type: "string" },
          { name: "description", type: "string" },
          {
            name: "socials",
            type: "tuple",
            components: [
              { name: "twitter", type: "string" },
              { name: "telegram", type: "string" },
              { name: "discord", type: "string" },
              { name: "website", type: "string" },
              { name: "farcaster", type: "string" },
            ],
          },
          { name: "creatorFeeRecipient", type: "address" },
          { name: "creatorTaxBps", type: "uint16" },
          { name: "expectedEconomics", type: "bytes32" },
          { name: "salt", type: "bytes32" },
        ],
      },
      { name: "launchConfigId", type: "uint256" },
      { name: "pairToken", type: "address" },
      {
        name: "leg",
        type: "tuple",
        components: [
          { name: "v3Path", type: "bytes" },
          {
            name: "v4Hops",
            type: "tuple[]",
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
        ],
      },
      { name: "minTokensOut", type: "uint256" },
    ],
    outputs: [
      { name: "token", type: "address" },
      { name: "poolId", type: "bytes32" },
      { name: "tokensOut", type: "uint256" },
    ],
  },
  {
    type: "function", name: "launchAndBuyWithQuote", stateMutability: "payable",
    inputs: [
      { name: "params", type: "tuple", components: [
        { name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "logo", type: "string" },
        { name: "description", type: "string" },
        { name: "socials", type: "tuple", components: [
          { name: "twitter", type: "string" }, { name: "telegram", type: "string" }, { name: "discord", type: "string" },
          { name: "website", type: "string" }, { name: "farcaster", type: "string" },
        ] },
        { name: "creatorFeeRecipient", type: "address" }, { name: "creatorTaxBps", type: "uint16" },
        { name: "expectedEconomics", type: "bytes32" }, { name: "salt", type: "bytes32" },
      ] },
      { name: "launchConfigId", type: "uint256" }, { name: "pairToken", type: "address" },
      { name: "quoteIn", type: "uint256" }, { name: "minTokensOut", type: "uint256" },
    ],
    outputs: [{ name: "token", type: "address" }, { name: "poolId", type: "bytes32" }, { name: "tokensOut", type: "uint256" }],
  },
];

export const launchLockerAbi = [
  { type: "function", name: "pendingFees", stateMutability: "view", inputs: [{ name: "token", type: "address" }], outputs: [{ name: "amount0", type: "uint256" }, { name: "amount1", type: "uint256" }] },
  { type: "function", name: "collectFees", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }], outputs: [{ name: "amount0", type: "uint256" }, { name: "amount1", type: "uint256" }] },
];

export const feeEscrowAbi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "recipient", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "balanceOfToken", stateMutability: "view", inputs: [{ name: "recipient", type: "address" }, { name: "token", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [], outputs: [{ name: "amount", type: "uint256" }] },
  { type: "function", name: "claimToken", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }], outputs: [{ name: "amount", type: "uint256" }] },
];

export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
];

export const explorerUrl = (type, value) =>
  `${robinhoodTestnet.blockExplorers.default.url}/${type}/${value}`;
