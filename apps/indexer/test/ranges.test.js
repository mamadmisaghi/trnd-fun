import test from "node:test";
import assert from "node:assert/strict";
import { nextRange, retryBackoff, rewindHeight } from "../src/ranges.js";

test("nextRange caps at target", () => assert.deepEqual(nextRange(100n, 150n, 1200n), { fromBlock: 101n, toBlock: 150n }));
test("nextRange produces bounded batch", () => assert.deepEqual(nextRange(100n, 5000n, 1200n), { fromBlock: 101n, toBlock: 1300n }));
test("nextRange stops at target", () => assert.equal(nextRange(150n, 150n, 10n), null));
test("rewind never crosses configured start", () => assert.equal(rewindHeight(12n, 10n, 32n), 10n));
test("RPC retry backoff is exponential and bounded", () => {
  assert.equal(retryBackoff(1, 500, 60_000), 500);
  assert.equal(retryBackoff(4, 500, 60_000), 4_000);
  assert.equal(retryBackoff(20, 500, 60_000), 60_000);
});
