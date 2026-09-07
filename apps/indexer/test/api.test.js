import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import test from "node:test";
import { startApi } from "../src/api.js";
import { createEventHub } from "../src/events.js";

const TOKEN = "0x1000000000000000000000000000000000000000";

test("SSE advertises reconnect delay and delivers only confirmed matching updates", async () => {
  const eventHub = createEventHub();
  const db = { async query() { return { rows: [{ cursor_block: "123" }], rowCount: 1 }; } };
  const config = { apiPort: 0, chainId: 46_630, corsOrigin: "http://localhost:3000", sseHeartbeatMs: 60_000, sseRetryMs: 2_000 };
  const server = startApi(config, db, eventHub);
  await once(server, "listening");

  try {
    const body = await new Promise((resolve, reject) => {
      const request = http.get(`http://127.0.0.1:${server.address().port}/v1/stream?token=${TOKEN}`, (response) => {
        let received = "";
        let published = false;
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          received += chunk;
          if (!published && received.includes("event: ready")) {
            published = true;
            eventHub.publish({ type: "market.updated", tokenAddress: TOKEN, blockNumber: "124", confirmed: false });
            eventHub.publish({ type: "market.updated", tokenAddress: "0x2000000000000000000000000000000000000000", blockNumber: "124", confirmed: true });
            eventHub.publish({ type: "market.updated", tokenAddress: TOKEN, blockNumber: "124", confirmed: true });
          }
          if (received.includes("event: market.updated")) {
            request.destroy();
            resolve(received);
          }
        });
      });
      request.on("error", (error) => {
        if (error.code !== "ECONNRESET") reject(error);
      });
    });

    assert.match(body, /retry: 2000/);
    assert.match(body, /"confirmedOnly":true/);
    assert.match(body, /id: 124/);
    assert.equal((body.match(/event: market\.updated/g) || []).length, 1);
    assert.match(body, /"confirmed":true/);
  } finally {
    server.close();
  }
});

test("readiness reports confirmed lag and fails closed above its threshold", async () => {
  let cursor = "198";
  const db = { async query() { return { rows: [{ cursor_block: cursor, cursor_block_hash: "0xabc", updated_at: new Date() }], rowCount: 1 }; } };
  const indexer = { client: { async getBlockNumber() { return 202n; } }, status: () => ({ consecutiveFailures: 0 }) };
  const config = { apiPort: 0, chainId: 46_630, corsOrigin: "http://localhost:3000", confirmations: 2n, readinessMaxLagBlocks: 2n };
  const server = startApi(config, db, createEventHub(), indexer);
  await once(server, "listening");
  try {
    const url = `http://127.0.0.1:${server.address().port}/ready`;
    const ready = await fetch(url);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { ready: true, chainId: 46_630, head: "202", confirmedTarget: "200", cursor: "198", lagBlocks: "2", maximumLagBlocks: "2", runtime: { consecutiveFailures: 0 } });

    cursor = "197";
    const stale = await fetch(url);
    assert.equal(stale.status, 503);
    assert.equal((await stale.json()).lagBlocks, "3");
  } finally {
    server.close();
  }
});
