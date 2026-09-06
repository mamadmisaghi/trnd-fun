"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeEventLog,
  formatEther,
  http,
  isAddress,
  keccak256,
  parseEther,
  stringToHex,
} from "viem";
import {
  launchFactoryAbi,
  nativePairAddress,
  protocolContracts,
  robinhoodTestnet,
  routerAbi,
} from "@/lib/protocol/robinhood-testnet";

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
    const recipient = isAddress(creatorFeeRecipient || "") ? creatorFeeRecipient : account;
    const feeBps = Math.round(Math.max(0, Math.min(10, Number(creatorFeePercent) || 0)) * 100);
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
    const buyValue = parseEther(String(openingBuyEth || "0"));
    const salt = keccak256(stringToHex(`${account}:${symbol}:${Date.now()}:${crypto.randomUUID?.() || Math.random()}`));
    const args = [
      {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        logo: /^https?:\/\//i.test(logo) ? logo : "",
        description: description.trim(),
        socials: { twitter, telegram, discord: "", website, farcaster: "" },
        creatorFeeRecipient: recipient,
        creatorTaxBps: feeBps,
        expectedEconomics,
        salt,
      },
      0n,
      nativePairAddress,
      { v3Path: "0x", v4Hops: [] },
      0n,
    ];
    const walletClient = createWalletClient({ account, chain: robinhoodTestnet, transport: custom(provider) });
    await providerClient.simulateContract({
      account,
      address: protocolContracts.router,
      abi: routerAbi,
      functionName: "launchAndBuyWithEth",
      args,
      value: launchFee + buyValue,
    });
    const hash = await walletClient.writeContract({
      address: protocolContracts.router,
      abi: routerAbi,
      functionName: "launchAndBuyWithEth",
      args,
      value: launchFee + buyValue,
    });
    const receipt = await providerClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new Error("The transaction reverted on Robinhood Chain Testnet.");
    let tokenAddress = null;
    let poolId = null;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== protocolContracts.launchFactory.toLowerCase()) continue;
      try {
        const decoded = decodeEventLog({ abi: launchFactoryAbi, data: log.data, topics: log.topics });
        if (decoded.eventName === "TokenLaunched") {
          tokenAddress = decoded.args.token;
          poolId = decoded.args.poolId;
          break;
        }
      } catch {}
    }
    await refresh();
    return { hash, receipt, tokenAddress, poolId, launchFee, openingBuy: buyValue };
  }, [address, chainId, connect, refresh, switchNetwork]);

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
  }), [address, balance, chainId, connect, error, launchWithEth, status, switchNetwork]);

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
