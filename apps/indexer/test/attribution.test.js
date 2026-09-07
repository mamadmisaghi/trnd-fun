import assert from "node:assert/strict";
import test from "node:test";
import { routedTradeSenders } from "../src/indexer.js";

const BUYER = "0x1000000000000000000000000000000000000000";
const SELLER = "0x2000000000000000000000000000000000000000";
const POOL = `0x${"ab".repeat(32)}`;

test("routedTradeSenders attributes ZapBuy and ZapSell to the end-user wallet", () => {
  const events = [
    { eventName: "ZapBuy", log: { transactionHash: "0xAAA" }, args: { poolId: POOL.toUpperCase(), buyer: BUYER.toUpperCase() } },
    { eventName: "ZapSell", log: { transactionHash: "0xBBB" }, args: { poolId: POOL, seller: SELLER } },
  ];

  const senders = routedTradeSenders(events);
  assert.equal(senders.get(`0xaaa:${POOL}`), BUYER);
  assert.equal(senders.get(`0xbbb:${POOL}`), SELLER);
});
