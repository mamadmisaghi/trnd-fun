import assert from "node:assert/strict";
import test from "node:test";
import { buildRouteDescriptor, encodeV3Path, normalizeRouteAllowlist, publicPair, ZERO_ADDRESS } from "../src/route-policy.js";

const WETH = "0x1000000000000000000000000000000000000000";
const PAIR = "0x2000000000000000000000000000000000000000";
const ADAPTER = "0x3000000000000000000000000000000000000000";

test("route allowlist is explicit, unique and testnet guarded", () => {
  const routes = normalizeRouteAllowlist([
    { asset: ZERO_ADDRESS, kind: "native", expectedSymbol: "ETH", expectedDecimals: 18, logoKey: "ETH" },
    { asset: PAIR, kind: "testnet_fixed_adapter", fee: 500, transferBehavior: "standard", expectedSymbol: "TEST", expectedDecimals: 18, logoKey: "TEST" },
  ], { chainId: 46_630, wrappedNative: WETH, adapter: ADAPTER });
  assert.equal(routes.length, 2);
  assert.throws(() => normalizeRouteAllowlist([
    { asset: PAIR, kind: "testnet_fixed_adapter", transferBehavior: "standard", expectedSymbol: "TEST", expectedDecimals: 18, logoKey: "TEST" },
  ], { chainId: 4_663, wrappedNative: WETH, adapter: ADAPTER }), /restricted/);
  assert.throws(() => normalizeRouteAllowlist([
    { asset: PAIR, kind: "testnet_fixed_adapter", expectedSymbol: "TEST", expectedDecimals: 18, logoKey: "TEST" },
  ], { chainId: 46_630, wrappedNative: WETH, adapter: ADAPTER }), /explicitly attested/);
});

test("route descriptors have canonical endpoints and a short expiry", () => {
  const [route] = normalizeRouteAllowlist([
    { asset: PAIR, kind: "testnet_fixed_adapter", fee: 500, transferBehavior: "standard", expectedSymbol: "TEST", expectedDecimals: 18, logoKey: "TEST" },
  ], { chainId: 46_630, wrappedNative: WETH, adapter: ADAPTER });
  const policy = { quoteTtlSeconds: 30, maximumSlippageBps: 300, maximumPriceImpactBps: 1_000 };
  const buy = buildRouteDescriptor(route, "buy", policy, 1_000);
  const sell = buildRouteDescriptor(route, "sell", policy, 1_000);
  assert.equal(buy.leg.v3Path, encodeV3Path(WETH, PAIR, 500));
  assert.equal(sell.leg.v3Path, encodeV3Path(PAIR, WETH, 500));
  assert.equal(Date.parse(buy.expiresAt) - Date.parse(buy.issuedAt), 30_000);
  assert.equal(buy.requiresFreshSimulation, true);
});

test("catalog enables only metadata-valid onchain pairs with an allowlisted route", () => {
  const row = {
    asset_address: PAIR,
    registered: true,
    enabled: true,
    pair_type: 2,
    decimals: 18,
    config_version: "7",
    token_name: "Test Stock",
    token_symbol: "TEST",
    metadata_valid: true,
  };
  const route = { enabled: true, kind: "v3", testnetOnly: false, transferBehavior: "standard", expectedSymbol: "TEST", expectedDecimals: 18, logoKey: "TEST" };
  assert.equal(publicPair(row, route).enabled, true);
  assert.equal(publicPair(row, route).logoKey, "TEST");
  assert.equal(publicPair({ ...row, token_symbol: "SPOOF" }, route).enabled, false);
  assert.equal(publicPair({ ...row, metadata_valid: false }, { enabled: true }).enabled, false);
  assert.equal(publicPair(row, null).enabled, false);
});
