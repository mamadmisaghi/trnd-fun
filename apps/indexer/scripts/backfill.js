import { writeFile } from "node:fs/promises";
import { loadConfig } from "../src/config.js";
import { createDatabase } from "../src/db.js";
import { createEventHub } from "../src/events.js";
import { createIndexer } from "../src/indexer.js";

const config = loadConfig();
const db = createDatabase(config.databaseUrl);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function syncWithResume(indexer) {
  const maximumAttempts = Math.max(1, config.backfillMaxAttempts);
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await indexer.syncOnce();
    } catch (error) {
      if (attempt === maximumAttempts) throw error;
      const delay = Math.min(
        config.rpcMaxBackoffMs,
        config.backfillRetryDelayMs * (2 ** Math.min(attempt - 1, 6)),
      );
      process.stderr.write(`Backfill interrupted (${error?.code || error?.name || "RPC error"}); resuming from the persisted checkpoint in ${delay}ms (${attempt}/${maximumAttempts}).\n`);
      await wait(delay);
    }
  }
  throw new Error("Backfill retry budget exhausted.");
}

try {
  const indexer = createIndexer(config, db, createEventHub());
  const completed = await syncWithResume(indexer);
  const state = await db.query("SELECT cursor_block,cursor_block_hash,updated_at FROM indexer_state WHERE chain_id=$1", [config.chainId]);
  const counts = {};
  for (const table of ["raw_events", "launches", "trades", "fee_collections", "fee_claims", "token_transfers", "holder_balances", "candles", "reward_funding", "reward_finalizations"]) {
    const result = await db.query(`SELECT count(*)::integer AS count FROM ${table} WHERE chain_id=$1`, [config.chainId]);
    counts[table] = result.rows[0].count;
  }
  const report = {
    generatedAt: new Date().toISOString(),
    chainId: config.chainId,
    startBlock: config.startBlock.toString(),
    confirmedTarget: completed.target.toString(),
    cursorBlock: completed.cursor.toString(),
    cursorBlockHash: completed.cursorBlockHash,
    complete: completed.cursor >= completed.target,
    counts,
    databaseState: state.rows[0] || null,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (process.env.BACKFILL_REPORT_PATH) await writeFile(process.env.BACKFILL_REPORT_PATH, output, "utf8");
  process.stdout.write(output);
  if (!report.complete) process.exitCode = 1;
} finally {
  await db.close();
}
