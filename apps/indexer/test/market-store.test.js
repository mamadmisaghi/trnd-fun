import test from "node:test";
import assert from "node:assert/strict";
import { bucketStart, quotePerToken, ratioToDecimal, tokenIsCurrency0, tradeVolumes } from "../src/market-store.js";

test("ratioToDecimal keeps deterministic fixed precision", () => {
  assert.equal(ratioToDecimal(1n, 2n), "0.5");
  assert.equal(ratioToDecimal(5n, 2n, 3), "2.5");
});

test("quotePerToken returns one for a 1:1 pool with equal decimals", () => {
  assert.equal(quotePerToken({ sqrtPriceX96: 2n ** 96n, tokenIsCurrency0: true, tokenDecimals: 18, pairDecimals: 18 }), "1");
  assert.equal(quotePerToken({ sqrtPriceX96: 2n ** 96n, tokenIsCurrency0: false, tokenDecimals: 18, pairDecimals: 18 }), "1");
});

test("trade volumes follow token currency ordering", () => {
  assert.deepEqual(tradeVolumes({ amount0: -10n, amount1: 25n, tokenIsCurrency0: true }), { tokenVolume: 10n, quoteVolume: 25n });
  assert.deepEqual(tradeVolumes({ amount0: -10n, amount1: 25n, tokenIsCurrency0: false }), { tokenVolume: 25n, quoteVolume: 10n });
});

test("currency ordering handles the native zero address", () => {
  assert.equal(tokenIsCurrency0("0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000000"), false);
});

test("bucketStart aligns timestamps", () => {
  assert.equal(bucketStart("2026-09-07T12:34:56.000Z", 300).toISOString(), "2026-09-07T12:30:00.000Z");
});
