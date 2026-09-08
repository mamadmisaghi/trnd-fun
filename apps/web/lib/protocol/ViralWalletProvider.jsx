"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  formatEther,
  formatUnits,
  http,
  isAddress,
  keccak256,
  parseEther,
  parseUnits,
  stringToHex,
} from "viem";
import {
  erc20Abi,
  feeEscrowAbi,
  launchFactoryAbi,
  launchLockerAbi,
  nativePairAddress,
  protocolContracts,
  robinhoodTestnet,
  routerAbi,
} from "@/lib/protocol/robinhood-testnet";
import { getEnabledPairCatalog, getEthRoute } from "@/lib/indexer/client";

const WalletContext = createContext(null);
const WALLET_CHANGED = "viralterminal:wallet-changed";

export const publicClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(),
});

function getProvider() {
  return typeof window !== "undefined" ? window.ethereum : undefined;
}

function humanizeError(error) {
  const message = error?.shortMessage || error?.details || error?.message || "The wallet request failed.";
  if (/rejected|denied/i.test(message)) return "The wallet request was rejected.";
  if (/insufficient funds/i.test(message)) return "This wallet does not have enough Robinhood testnet ETH.";
  return message.replace(/^ContractFunctionExecutionError:\s*/i, "");
}

async function enabledPair(symbol) {
  const catalog = await getEnabledPairCatalog();
  const pair = (catalog.data || []).find((entry) => entry.enabled && entry.symbol === String(symbol || "").toUpperCase());
  if (!pair) throw new Error(`${symbol} is not enabled by the current onchain pair catalog and server route policy.`);
  return pair;
}

async function freshEthLeg(pairAddress, direction, requestedSlippageBps = 100) {
  const payload = await getEthRoute(pairAddress, direction);
  if (requestedSlippageBps > Number(payload.route.maximumSlippageBps)) {
    throw new Error(`Slippage exceeds the server policy limit of ${payload.route.maximumSlippageBps / 100}%.`);
  }
  return payload.route;
}

function assertFreshRoute(route) {
  if (!route?.requiresFreshSimulation || !route.expiresAt || Date.parse(route.expiresAt) <= Date.now()) {
    throw new Error("The server route expired. Refresh the quote and try again.");
  }
}

function priceImpactBps(input, output, referenceInput, referenceOutput) {
  if (input <= 0n || output <= 0n || referenceInput <= 0n || referenceOutput <= 0n) return 10_000;
  const expectedScaled = referenceOutput * input;
  const actualScaled = output * referenceInput;
  if (actualScaled >= expectedScaled) return 0;
  return Number(((expectedScaled - actualScaled) * 10_000n) / expectedScaled);
}

async function enforcePriceImpact({ route, input, output, simulateReference }) {
  const referenceInput = input > 100n ? input / 100n : input;
  const referenceOutput = referenceInput === input ? output : await simulateReference(referenceInput);
  const impactBps = priceImpactBps(input, output, referenceInput, referenceOutput);
  if (impactBps > Number(route.maximumPriceImpactBps)) {
    throw new Error(`Estimated price impact of ${(impactBps / 100).toFixed(2)}% exceeds the server policy limit of ${route.maximumPriceImpactBps / 100}%.`);
  }
  return impactBps;
}

function createLaunchParams({ account, name, symbol, logo, description, website, twitter, telegram, creatorFeeRecipient, creatorFeePercent, expectedEconomics }) {
  const recipient = isAddress(creatorFeeRecipient || "") ? creatorFeeRecipient : account;
  const feeBps = Math.round(Math.max(0, Math.min(10, Number(creatorFeePercent) || 0)) * 100);
  return {
    name: name.trim(),
    symbol: symbol.trim().toUpperCase(),
    logo: /^https?:\/\//i.test(logo) ? logo : "",
    description: description.trim(),
    socials: { twitter, telegram, discord: "", website, farcaster: "" },
    creatorFeeRecipient: recipient,
    creatorTaxBps: feeBps,
    expectedEconomics,
    salt: keccak256(stringToHex(`${account}:${symbol}:${Date.now()}:${crypto.randomUUID?.() || Math.random()}`)),
  };
}

function decodeLaunchReceipt(receipt) {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== protocolContracts.launchFactory.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({ abi: launchFactoryAbi, data: log.data, topics: log.topics });
      if (decoded.eventName === "TokenLaunched") return { tokenAddress: decoded.args.token, poolId: decoded.args.poolId };
    } catch {}
  }
  return { tokenAddress: null, poolId: null };
}

function slippageFloor(value, slippageBps = 100) {
  const bps = BigInt(Math.max(0, Math.min(5000, Number(slippageBps) || 0)));
  return (value * (10000n - bps)) / 10000n;
}

export function ViralWalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [status, setStatus] = useState("disconnected");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;
    const accounts = await provider.request({ method: "eth_accounts" });
    const nextAddress = accounts?.[0] || null;
    const chainHex = await provider.request({ method: "eth_chainId" });
    setAddress(nextAddress);
    setChainId(Number.parseInt(chainHex, 16));
    setStatus(nextAddress ? "connected" : "disconnected");
    if (nextAddress) {
      const providerClient = createPublicClient({ chain: robinhoodTestnet, transport: custom(provider) });
      const value = await providerClient.getBalance({ address: nextAddress });
      setBalance(value);
    } else {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    const provider = getProvider();
    if (!provider?.on) return undefined;
    provider.on("accountsChanged", refresh);
    provider.on("chainChanged", refresh);
    return () => {
      provider.removeListener?.("accountsChanged", refresh);
      provider.removeListener?.("chainChanged", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(WALLET_CHANGED));
  }, [address, chainId]);

  const switchNetwork = useCallback(async () => {
    const provider = getProvider();
    if (!provider) throw new Error("Install an EIP-1193 wallet such as MetaMask to continue.");
    const chainHex = `0x${robinhoodTestnet.id.toString(16)}`;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
    } catch (switchError) {
      if (switchError?.code !== 4902) throw switchError;
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: chainHex,
          chainName: robinhoodTestnet.name,
          nativeCurrency: robinhoodTestnet.nativeCurrency,
          rpcUrls: robinhoodTestnet.rpcUrls.default.http,
          blockExplorerUrls: [robinhoodTestnet.blockExplorers.default.url],
        }],
      });
    }
    await refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    const provider = getProvider();
    setError("");
    if (!provider) {
      const nextError = "No browser wallet detected. Install MetaMask or another EIP-1193 wallet.";
      setError(nextError);
      throw new Error(nextError);
    }
    setStatus("connecting");
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAddress(accounts[0]);
      const chainHex = await provider.request({ method: "eth_chainId" });
      const currentChain = Number.parseInt(chainHex, 16);
      setChainId(currentChain);
      if (currentChain !== robinhoodTestnet.id) await switchNetwork();
      await refresh();
      return accounts[0];
    } catch (connectError) {
      const nextError = humanizeError(connectError);
      setStatus("disconnected");
      setError(nextError);
      throw new Error(nextError);
    }
  }, [refresh, switchNetwork]);

  const launchWithEth = useCallback(async ({
    name,
    symbol,
    logo = "",
    description = "",
    website = "",
    twitter = "",
    telegram = "",
    creatorFeeRecipient,
    creatorFeePercent = 0,
    openingBuyEth = "0",
  }) => {
    const provider = getProvider();
    if (!provider) throw new Error("No browser wallet detected.");
    const account = address || await connect();
    if (chainId !== robinhoodTestnet.id) await switchNetwork();
    const providerClient = createPublicClient({ chain: robinhoodTestnet, transport: custom(provider) });
    const launchFee = await providerClient.readContract({
      address: protocolContracts.launchFactory,
      abi: launchFactoryAbi,
      functionName: "launchFee",
    });
    const expectedEconomics = await providerClient.readContract({
      address: protocolContracts.launchFactory,
      abi: launchFactoryAbi,
      functionName: "previewLaunchEconomics",
      args: [0n, nativePairAddress],
    });
    const route = await freshEthLeg(nativePairAddress, "buy");
    const buyValue = parseEther(String(openingBuyEth || "0"));
    const args = [
      createLaunchParams({ account, name, symbol, logo, description, website, twitter, telegram, creatorFeeRecipient, creatorFeePercent, expectedEconomics }),
      0n,
      nativePairAddress,
      route.leg,
      0n,
    ];
    const walletClient = createWalletClient({ account, chain: robinhoodTestnet, transport: custom(provider) });
    const preview = await providerClient.simulateContract({
      account,
      address: protocolContracts.router,
      abi: routerAbi,
      functionName: "launchAndBuyWithEth",
      args,
      value: launchFee + buyValue,
    });
    if (buyValue > 0n) {
      const quotedOut = preview.result[2];
      await enforcePriceImpact({
        route,
        input: buyValue,
        output: quotedOut,
        simulateReference: async (referenceValue) => (await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "launchAndBuyWithEth", args, value: launchFee + referenceValue })).result[2],
      });
      args[4] = slippageFloor(quotedOut);
      await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "launchAndBuyWithEth", args, value: launchFee + buyValue });
    }
    assertFreshRoute(route);
    const hash = await walletClient.writeContract({
      address: protocolContracts.router,
      abi: routerAbi,
      functionName: "launchAndBuyWithEth",
      args,
      value: launchFee + buyValue,
    });
    const receipt = await providerClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new Error("The transaction reverted on Robinhood Chain Testnet.");
    const { tokenAddress, poolId } = decodeLaunchReceipt(receipt);
    await refresh();
    return { hash, receipt, tokenAddress, poolId, launchFee, openingBuy: buyValue };
  }, [address, chainId, connect, refresh, switchNetwork]);

  const launchWithPair = useCallback(async ({ pairSymbol = "ETH", openingBuyAmount = "0", openingBuyEth, ...launch }) => {
    const pair = await enabledPair(pairSymbol);
    if (pair.type === "NATIVE") return launchWithEth({ ...launch, openingBuyEth: openingBuyEth ?? openingBuyAmount });

    const provider = getProvider();
    if (!provider) throw new Error("No browser wallet detected.");
    const account = address || await connect();
    const chainHex = await provider.request({ method: "eth_chainId" });
    if (Number.parseInt(chainHex, 16) !== robinhoodTestnet.id) await switchNetwork();
    const providerClient = createPublicClient({ chain: robinhoodTestnet, transport: custom(provider) });
    const walletClient = createWalletClient({ account, chain: robinhoodTestnet, transport: custom(provider) });
    const [launchFee, expectedEconomics] = await Promise.all([
      providerClient.readContract({ address: protocolContracts.launchFactory, abi: launchFactoryAbi, functionName: "launchFee" }),
      providerClient.readContract({ address: protocolContracts.launchFactory, abi: launchFactoryAbi, functionName: "previewLaunchEconomics", args: [0n, pair.address] }),
    ]);
    const openingBuy = parseEther(String(openingBuyEth ?? openingBuyAmount ?? "0"));
    const route = await freshEthLeg(pair.address, "buy");
    const args = [
      createLaunchParams({ account, ...launch, expectedEconomics }),
      0n,
      pair.address,
      route.leg,
      0n,
    ];
    const preview = await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "launchAndBuyWithEth", args, value: launchFee + openingBuy });
    if (openingBuy > 0n) {
      const quotedOut = preview.result[2];
      await enforcePriceImpact({
        route,
        input: openingBuy,
        output: quotedOut,
        simulateReference: async (referenceValue) => (await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "launchAndBuyWithEth", args, value: launchFee + referenceValue })).result[2],
      });
      args[4] = slippageFloor(quotedOut);
      await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "launchAndBuyWithEth", args, value: launchFee + openingBuy });
    }
    assertFreshRoute(route);
    const hash = await walletClient.writeContract({ address: protocolContracts.router, abi: routerAbi, functionName: "launchAndBuyWithEth", args, value: launchFee + openingBuy });
    const receipt = await providerClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new Error("The transaction reverted on Robinhood Chain Testnet.");
    const { tokenAddress, poolId } = decodeLaunchReceipt(receipt);
    await refresh();
    return { hash, receipt, tokenAddress, poolId, launchFee, openingBuy, pair };
  }, [address, connect, launchWithEth, refresh, switchNetwork]);

  const getConnectedClients = useCallback(async () => {
    const provider = getProvider();
    if (!provider) throw new Error("No browser wallet detected. Install MetaMask or another EIP-1193 wallet.");
    const account = address || await connect();
    const chainHex = await provider.request({ method: "eth_chainId" });
    if (Number.parseInt(chainHex, 16) !== robinhoodTestnet.id) await switchNetwork();
    return {
      account,
      providerClient: createPublicClient({ chain: robinhoodTestnet, transport: custom(provider) }),
      walletClient: createWalletClient({ account, chain: robinhoodTestnet, transport: custom(provider) }),
    };
  }, [address, connect, switchNetwork]);

  const readMarket = useCallback(async (tokenAddress, owner = address) => {
    if (!isAddress(tokenAddress || "")) throw new Error("This page is not linked to a valid onchain token address.");
    const launched = await publicClient.readContract({
      address: protocolContracts.launchFactory,
      abi: launchFactoryAbi,
      functionName: "getLaunchedToken",
      args: [tokenAddress],
    });
    if (!launched.exists) throw new Error("This token was not launched by the active ViralTerminal testnet factory.");
    const pairIsNative = launched.pairToken.toLowerCase() === nativePairAddress;
    const [poolKey, pendingFees, decimals, tokenName, tokenSymbol, pairDecimals, pairSymbol] = await Promise.all([
      publicClient.readContract({ address: protocolContracts.launchFactory, abi: launchFactoryAbi, functionName: "poolKeyFor", args: [tokenAddress] }),
      publicClient.readContract({ address: protocolContracts.launchLocker, abi: launchLockerAbi, functionName: "pendingFees", args: [tokenAddress] }),
      publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
      publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "name" }),
      publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
      pairIsNative ? 18 : publicClient.readContract({ address: launched.pairToken, abi: erc20Abi, functionName: "decimals" }),
      pairIsNative ? "ETH" : publicClient.readContract({ address: launched.pairToken, abi: erc20Abi, functionName: "symbol" }),
    ]);
    let tokenBalance = 0n;
    let pairBalance = 0n;
    let pairClaimable = 0n;
    let tokenClaimable = 0n;
    if (isAddress(owner || "")) {
      [tokenBalance, pairBalance, pairClaimable, tokenClaimable] = await Promise.all([
        publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [owner] }),
        pairIsNative ? publicClient.getBalance({ address: owner }) : publicClient.readContract({ address: launched.pairToken, abi: erc20Abi, functionName: "balanceOf", args: [owner] }),
        pairIsNative
          ? publicClient.readContract({ address: protocolContracts.feeEscrow, abi: feeEscrowAbi, functionName: "balanceOf", args: [owner] })
          : publicClient.readContract({ address: protocolContracts.feeEscrow, abi: feeEscrowAbi, functionName: "balanceOfToken", args: [owner, launched.pairToken] }),
        publicClient.readContract({ address: protocolContracts.feeEscrow, abi: feeEscrowAbi, functionName: "balanceOfToken", args: [owner, tokenAddress] }),
      ]);
    }
    const tokenIsCurrency0 = poolKey.currency0.toLowerCase() === tokenAddress.toLowerCase();
    const pendingPair = tokenIsCurrency0 ? pendingFees[1] : pendingFees[0];
    const pendingToken = tokenIsCurrency0 ? pendingFees[0] : pendingFees[1];
    return {
      launched,
      poolKey,
      decimals: Number(decimals),
      tokenName,
      tokenSymbol,
      tokenBalance,
      tokenBalanceLabel: formatUnits(tokenBalance, Number(decimals)),
      pairAddress: launched.pairToken,
      pairIsNative,
      pairDecimals: Number(pairDecimals),
      pairSymbol,
      pairBalance,
      pairBalanceLabel: formatUnits(pairBalance, Number(pairDecimals)),
      pendingPair,
      pendingToken,
      pairClaimable,
      tokenClaimable,
      isCreator: Boolean(owner && launched.creatorFeeRecipient.toLowerCase() === owner.toLowerCase()),
    };
  }, [address]);

  const quoteEthTrade = useCallback(async ({ tokenAddress, side, amount }) => {
    const { account, providerClient } = await getConnectedClients();
    const market = await readMarket(tokenAddress, account);
    if (!amount || Number(amount) <= 0) throw new Error("Enter an amount greater than zero.");
    if (side === "buy") {
      const value = parseEther(String(amount));
      const route = await freshEthLeg(market.pairAddress, "buy");
      const simulation = await providerClient.simulateContract({
        account,
        address: protocolContracts.router,
        abi: routerAbi,
        functionName: "buyWithEth",
        args: [market.poolKey, route.leg, 0n, account],
        value,
      });
      return { raw: simulation.result, formatted: formatUnits(simulation.result, market.decimals), decimals: market.decimals };
    }
    const tokensIn = parseUnits(String(amount), market.decimals);
    const allowance = await providerClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "allowance", args: [account, protocolContracts.router] });
    if (allowance < tokensIn) return { raw: null, formatted: null, decimals: 18, approvalRequired: true };
    const tokenIsCurrency0 = market.poolKey.currency0.toLowerCase() === tokenAddress.toLowerCase();
    const route = await freshEthLeg(market.pairAddress, "sell");
    const simulation = await providerClient.simulateContract({
      account,
      address: protocolContracts.router,
      abi: routerAbi,
      functionName: "sellToEth",
      args: [market.poolKey, tokenIsCurrency0, tokensIn, route.leg, 0n, account],
    });
    return { raw: simulation.result, formatted: formatEther(simulation.result), decimals: 18, approvalRequired: false };
  }, [getConnectedClients, readMarket]);

  const tradeEthMarket = useCallback(async ({ tokenAddress, side, amount, slippageBps = 100, onStage }) => {
    const { account, providerClient, walletClient } = await getConnectedClients();
    const market = await readMarket(tokenAddress, account);
    if (!amount || Number(amount) <= 0) throw new Error("Enter an amount greater than zero.");
    let approvalHash = null;
    let functionName;
    let args;
    let value;
    let quotedOut;
    let activeRoute;
    if (side === "buy") {
      value = parseEther(String(amount));
      const route = await freshEthLeg(market.pairAddress, "buy", slippageBps);
      activeRoute = route;
      const leg = route.leg;
      const preview = await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "buyWithEth", args: [market.poolKey, leg, 0n, account], value });
      quotedOut = preview.result;
      await enforcePriceImpact({
        route,
        input: value,
        output: quotedOut,
        simulateReference: async (referenceValue) => (await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "buyWithEth", args: [market.poolKey, leg, 0n, account], value: referenceValue })).result,
      });
      functionName = "buyWithEth";
      args = [market.poolKey, leg, slippageFloor(quotedOut, slippageBps), account];
    } else {
      const tokensIn = parseUnits(String(amount), market.decimals);
      if (tokensIn > market.tokenBalance) throw new Error("This wallet does not have enough tokens for that sale.");
      const allowance = await providerClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "allowance", args: [account, protocolContracts.router] });
      if (allowance < tokensIn) {
        onStage?.("approval");
        approvalHash = await walletClient.writeContract({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [protocolContracts.router, tokensIn] });
        const approvalReceipt = await providerClient.waitForTransactionReceipt({ hash: approvalHash, confirmations: 1 });
        if (approvalReceipt.status !== "success") throw new Error("Token approval reverted.");
      }
      onStage?.("quoting");
      const tokenIsCurrency0 = market.poolKey.currency0.toLowerCase() === tokenAddress.toLowerCase();
      const route = await freshEthLeg(market.pairAddress, "sell", slippageBps);
      activeRoute = route;
      const leg = route.leg;
      const preview = await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "sellToEth", args: [market.poolKey, tokenIsCurrency0, tokensIn, leg, 0n, account] });
      quotedOut = preview.result;
      await enforcePriceImpact({
        route,
        input: tokensIn,
        output: quotedOut,
        simulateReference: async (referenceTokens) => (await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName: "sellToEth", args: [market.poolKey, tokenIsCurrency0, referenceTokens, leg, 0n, account] })).result,
      });
      functionName = "sellToEth";
      args = [market.poolKey, tokenIsCurrency0, tokensIn, leg, slippageFloor(quotedOut, slippageBps), account];
    }
    onStage?.("signature");
    await providerClient.simulateContract({ account, address: protocolContracts.router, abi: routerAbi, functionName, args, ...(value ? { value } : {}) });
    assertFreshRoute(activeRoute);
    const hash = await walletClient.writeContract({ address: protocolContracts.router, abi: routerAbi, functionName, args, ...(value ? { value } : {}) });
    onStage?.("confirming");
    const receipt = await providerClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new Error("The trade reverted on Robinhood Chain Testnet.");
    await refresh();
    return { hash, receipt, approvalHash, quotedOut, market };
  }, [getConnectedClients, readMarket, refresh]);

  const collectMarketFees = useCallback(async (tokenAddress) => {
    const { account, providerClient, walletClient } = await getConnectedClients();
    await readMarket(tokenAddress, account);
    await providerClient.simulateContract({ account, address: protocolContracts.launchLocker, abi: launchLockerAbi, functionName: "collectFees", args: [tokenAddress] });
    const hash = await walletClient.writeContract({ address: protocolContracts.launchLocker, abi: launchLockerAbi, functionName: "collectFees", args: [tokenAddress] });
    const receipt = await providerClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new Error("Fee collection reverted.");
    return { hash, receipt };
  }, [getConnectedClients, readMarket]);

  const claimMarketFees = useCallback(async ({ tokenAddress, currency }) => {
    const { account, providerClient, walletClient } = await getConnectedClients();
    const market = await readMarket(tokenAddress, account);
    const tokenClaim = currency === "token";
    const claimable = tokenClaim ? market.tokenClaimable : market.pairClaimable;
    if (claimable === 0n) throw new Error("There is no claimable balance for this wallet.");
    const functionName = tokenClaim || !market.pairIsNative ? "claimToken" : "claim";
    const args = tokenClaim ? [tokenAddress] : market.pairIsNative ? [] : [market.pairAddress];
    await providerClient.simulateContract({ account, address: protocolContracts.feeEscrow, abi: feeEscrowAbi, functionName, args });
    const hash = await walletClient.writeContract({ address: protocolContracts.feeEscrow, abi: feeEscrowAbi, functionName, args });
    const receipt = await providerClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new Error("Fee claim reverted.");
    await refresh();
    return { hash, receipt, amount: claimable };
  }, [getConnectedClients, readMarket, refresh]);

  const value = useMemo(() => ({
    address,
    chainId,
    balance,
    balanceLabel: balance == null ? null : `${Number(formatEther(balance)).toFixed(4)} ETH`,
    status,
    error,
    isConnected: Boolean(address),
    isCorrectNetwork: chainId === robinhoodTestnet.id,
    connect,
    switchNetwork,
    launchWithEth,
    launchWithPair,
    readMarket,
    quoteEthTrade,
    tradeEthMarket,
    collectMarketFees,
    claimMarketFees,
  }), [address, balance, chainId, claimMarketFees, collectMarketFees, connect, error, launchWithEth, launchWithPair, quoteEthTrade, readMarket, status, switchNetwork, tradeEthMarket]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useViralWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useViralWallet must be used inside ViralWalletProvider");
  return value;
}

export function shortAddress(address) {
  return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect wallet";
}
