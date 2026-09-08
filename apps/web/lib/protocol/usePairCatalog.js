"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { pairAssets as productAssets } from "@/data";
import { getEnabledPairCatalog } from "@/lib/indexer/client";

function toDisplayAsset(pair) {
  const product = productAssets.find((asset) => asset.symbol === pair.symbol);
  return {
    ...product,
    address: pair.address,
    name: pair.name || product?.name || pair.symbol,
    symbol: pair.symbol,
    logoKey: pair.logoKey,
    decimals: pair.decimals,
    type: pair.type === "NATIVE" ? "CRYPTO" : pair.type,
    sector: product?.sector || (pair.type === "STABLE" ? "Stablecoin" : pair.type === "STOCK" ? "Stock token" : "Native asset"),
    configVersion: pair.configVersion,
    route: pair.route,
  };
}

export function usePairCatalog() {
  const [state, setState] = useState({ status: "loading", pairs: [], version: null, policy: null, error: "" });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const catalog = await getEnabledPairCatalog();
      setState({ status: "ready", pairs: (catalog.data || []).map(toDisplayAsset), version: catalog.catalogVersion, policy: catalog.policy, error: "" });
    } catch (error) {
      setState({ status: "error", pairs: [], version: null, policy: null, error: error?.message || "Pair catalog is unavailable." });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const bySymbol = useMemo(() => new Map(state.pairs.map((pair) => [pair.symbol, pair])), [state.pairs]);
  return { ...state, bySymbol, refresh };
}
