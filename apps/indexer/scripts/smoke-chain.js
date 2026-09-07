import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";
import { createDatabase } from "../src/db.js";
import { createEventHub } from "../src/events.js";
import { createIndexer } from "../src/indexer.js";

const block = BigInt(process.env.SMOKE_BLOCK || "114906800");
const expectedToken = (process.env.SMOKE_TOKEN || "0x018129F6970cB20877C987d22E4ad7Ef9Ddba791").toLowerCase();
const config = loadConfig();
const db = createDatabase(config.databaseUrl);

try {
  const indexer = createIndexer(config, db, createEventHub());
  const eventCount = await indexer.ingestRange(block, block);
  assert.ok(eventCount > 0, "expected at least one decoded chain event");
  const launch = await db.query(`SELECT token_address,token_symbol,pair_symbol FROM launches WHERE chain_id=$1 AND token_address=$2`, [config.chainId, expectedToken]);
  assert.equal(launch.rowCount, 1, "expected the known launch to be indexed");
  assert.ok(launch.rows[0].token_symbol, "expected token metadata");
  assert.ok(launch.rows[0].pair_symbol, "expected pair metadata");
  const transfers = await db.query(`SELECT count(*)::integer count FROM token_transfers WHERE chain_id=$1 AND token_address=$2`, [config.chainId, expectedToken]);
  assert.ok(transfers.rows[0].count > 0, "expected launch token transfers");
  console.log(`Chain smoke passed: ${expectedToken}, ${eventCount} decoded events.`);
} finally {
  await db.close();
}
