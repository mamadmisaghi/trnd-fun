const ADDRESS = /^0x[0-9a-f]{40}$/;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const lower = (value) => String(value || "").toLowerCase();

function assertAddress(value, label) {
  const normalized = lower(value);
  if (!ADDRESS.test(normalized)) throw new Error(`${label} must be a valid address`);
  return normalized;
}

function catalogMetadata(entry, asset) {
  const expectedSymbol = String(entry.expectedSymbol || "").toUpperCase();
  const expectedDecimals = Number(entry.expectedDecimals);
  const logoKey = String(entry.logoKey || "").toUpperCase();
  if (!/^[A-Z0-9.-]{1,16}$/.test(expectedSymbol)) throw new Error(`${asset} requires an expected symbol`);
  if (!Number.isInteger(expectedDecimals) || expectedDecimals < 0 || expectedDecimals > 255) throw new Error(`${asset} requires expected decimals`);
  if (!/^[A-Z0-9.-]{1,16}$/.test(logoKey)) throw new Error(`${asset} requires a curated logo key`);
  return { expectedSymbol, expectedDecimals, logoKey };
}

export function encodeV3Path(tokenIn, tokenOut, fee) {
  const input = assertAddress(tokenIn, "tokenIn");
  const output = assertAddress(tokenOut, "tokenOut");
  const numericFee = Number(fee);
  if (!Number.isInteger(numericFee) || numericFee <= 0 || numericFee > 0xffffff) throw new Error("fee must fit uint24");
  return `0x${input.slice(2)}${numericFee.toString(16).padStart(6, "0")}${output.slice(2)}`;
}

export function normalizeRouteAllowlist(entries, { chainId, wrappedNative, adapter }) {
  const seen = new Set();
  return entries.map((entry) => {
    const asset = assertAddress(entry.asset, "route asset");
    if (seen.has(asset)) throw new Error(`duplicate route asset ${asset}`);
    seen.add(asset);
    const kind = entry.kind || (asset === ZERO_ADDRESS ? "native" : "testnet_fixed_adapter");
    const testnetOnly = entry.testnetOnly !== false;
    const display = catalogMetadata(entry, asset);
    if (kind === "testnet_fixed_adapter" && Number(chainId) !== 46_630) {
      throw new Error("the fixed-price adapter is restricted to Robinhood Chain Testnet");
    }
    if (kind === "native") {
      if (asset !== ZERO_ADDRESS) throw new Error("native route must use the zero address");
      return { asset, kind, testnetOnly, transferBehavior: "native", enabled: entry.enabled !== false, ...display };
    }
    if (!["v3", "testnet_fixed_adapter"].includes(kind)) throw new Error(`unsupported route kind ${kind}`);
    if (entry.transferBehavior !== "standard") throw new Error(`${asset} must be explicitly attested as a standard non-rebasing ERC-20`);
    const normalized = {
      asset,
      kind,
      testnetOnly,
      transferBehavior: "standard",
      enabled: entry.enabled !== false,
      ...display,
      wrappedNative: assertAddress(entry.wrappedNative || wrappedNative, "wrapped native token"),
      fee: Number(entry.fee || 500),
    };
    if (!Number.isInteger(normalized.fee) || normalized.fee <= 0 || normalized.fee > 0xffffff) {
      throw new Error(`${asset} fee must fit uint24`);
    }
    if (kind === "testnet_fixed_adapter") normalized.adapter = assertAddress(entry.adapter || adapter, "route adapter");
    return normalized;
  });
}

export function buildRouteDescriptor(entry, direction, policy, now = Date.now()) {
  if (!entry?.enabled) throw new Error("route_not_allowed");
  if (!["buy", "sell"].includes(direction)) throw new Error("invalid_direction");
  const ttlSeconds = Math.max(5, Number(policy.quoteTtlSeconds));
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + ttlSeconds * 1_000).toISOString();
  const leg = entry.kind === "native"
    ? { v3Path: "0x", v4Hops: [] }
    : {
        v3Path: encodeV3Path(
          direction === "buy" ? entry.wrappedNative : entry.asset,
          direction === "buy" ? entry.asset : entry.wrappedNative,
          entry.fee,
        ),
        v4Hops: [],
      };
  return {
    asset: entry.asset,
    direction,
    kind: entry.kind,
    testnetOnly: entry.testnetOnly,
    transferBehavior: entry.transferBehavior,
    issuedAt,
    expiresAt,
    ttlSeconds,
    maximumSlippageBps: policy.maximumSlippageBps,
    maximumPriceImpactBps: policy.maximumPriceImpactBps,
    requiresFreshSimulation: true,
    adapter: entry.adapter || null,
    leg,
  };
}

export function publicPair(row, route) {
  const metadataValid = Boolean(row.metadata_valid)
    && Number(row.decimals) === Number(route?.expectedDecimals)
    && String(row.token_symbol || "").toUpperCase() === route?.expectedSymbol;
  return {
    address: lower(row.asset_address),
    name: row.token_name,
    symbol: row.token_symbol,
    decimals: Number(row.decimals),
    type: ["NATIVE", "STABLE", "STOCK"][Number(row.pair_type)] || "UNKNOWN",
    configVersion: String(row.config_version),
    enabled: Boolean(row.registered && row.enabled && metadataValid && route?.enabled),
    metadataValid,
    logoKey: route?.logoKey || null,
    route: route ? {
      kind: route.kind,
      testnetOnly: route.testnetOnly,
      transferBehavior: route.transferBehavior,
    } : null,
  };
}
