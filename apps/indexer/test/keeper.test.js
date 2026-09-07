import assert from "node:assert/strict";
import test from "node:test";
import { collectActionKey, epochBounds, validateTopFive } from "../src/keeper.js";

const address = (digit) => `0x${digit.repeat(40)}`;

test("validateTopFive accepts exactly five distinct valid recipients", () => {
  const rows = ["1", "2", "3", "4", "5"].map((digit) => ({ creator_address: address(digit) }));
  assert.equal(validateTopFive(rows), true);
  assert.equal(validateTopFive(rows.slice(0, 4)), false);
  assert.equal(validateTopFive([...rows.slice(0, 4), rows[0]]), false);
});

test("epochBounds maps unix-day epochs to an exact UTC day", () => {
  const bounds = epochBounds(1n);
  assert.equal(bounds.start.toISOString(), "1970-01-02T00:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "1970-01-03T00:00:00.000Z");
});

test("collection action keys are stable inside a window and separate by mode", () => {
  const token = address("a");
  assert.equal(collectActionKey(token, 10_001, 5_000, "dry-run"), collectActionKey(token, 14_999, 5_000, "dry-run"));
  assert.notEqual(collectActionKey(token, 10_001, 5_000, "dry-run"), collectActionKey(token, 10_001, 5_000, "live"));
});
