import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { createDatabase } from "../src/db.js";
import { runMigrations } from "../src/migrations.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for PostgreSQL integration tests");
}

const migrations = ["001_initial.sql", "002_market_data_and_keeper.sql", "003_pair_catalog_and_routes.sql"];
const expectedTables = [
  "candles",
  "creator_epoch_rankings",
  "fee_claims",
  "fee_collections",
  "holder_balances",
  "indexed_blocks",
  "indexer_state",
  "keeper_actions",
  "keeper_runs",
  "launches",
  "pair_assets",
  "raw_events",
  "reward_finalizations",
  "reward_funding",
  "schema_migrations",
  "token_transfers",
  "trades",
];
const expectedIndexes = [
  "candles_market_idx",
  "fee_claims_recipient_idx",
  "fee_collections_market_idx",
  "keeper_actions_retry_idx",
  "launches_creator_idx",
  "launches_order_idx",
  "pair_assets_enabled_idx",
  "positive_holders_idx",
  "raw_events_block_idx",
  "reward_funding_epoch_idx",
  "token_transfers_market_idx",
  "trades_market_idx",
  "trades_recent_market_idx",
];

function quoteIdentifier(identifier) {
  assert.match(identifier, /^[a-z][a-z0-9_]+$/);
  return `"${identifier}"`;
}

async function withDisposableSchema(work) {
  const schema = `migration_${randomBytes(8).toString("hex")}`;
  const admin = createDatabase(connectionString);
  await admin.query(`CREATE SCHEMA ${quoteIdentifier(schema)}`);

  const scopedUrl = new URL(connectionString);
  scopedUrl.searchParams.set("options", `-c search_path=${schema},public`);
  const db = createDatabase(scopedUrl.toString());

  try {
    await work(db, schema);
  } finally {
    await db.close();
    await admin.query(`DROP SCHEMA ${quoteIdentifier(schema)} CASCADE`);
    await admin.close();
  }
}

async function migrationNames(db) {
  const result = await db.query("SELECT name FROM schema_migrations ORDER BY name");
  return result.rows.map(({ name }) => name);
}

test("fresh install creates the complete schema and reruns idempotently", async () => {
  await withDisposableSchema(async (db, schema) => {
    const firstRun = await runMigrations(db, { logger: { log() {} } });
    assert.deepEqual(firstRun.appliedNames, migrations);
    assert.deepEqual(await migrationNames(db), migrations);

    const tables = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 ORDER BY table_name",
      [schema],
    );
    assert.deepEqual(tables.rows.map(({ table_name }) => table_name), expectedTables);

    const columns = await db.query(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema=$1",
      [schema],
    );
    const columnSet = new Set(columns.rows.map(({ table_name, column_name }) => `${table_name}.${column_name}`));
    for (const column of [
      "launches.block_time",
      "launches.pair_decimals",
      "launches.pair_symbol",
      "pair_assets.metadata_valid",
      "trades.block_time",
      "trades.price_quote_per_token",
      "trades.quote_volume",
      "trades.token_is_currency0",
      "trades.token_volume",
    ]) {
      assert.ok(columnSet.has(column), `missing expected column ${column}`);
    }

    const indexes = await db.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname=$1 ORDER BY indexname",
      [schema],
    );
    const indexSet = new Set(indexes.rows.map(({ indexname }) => indexname));
    for (const index of expectedIndexes) assert.ok(indexSet.has(index), `missing expected index ${index}`);

    const constraints = await db.query(
      `SELECT rel.relname AS table_name, pg_get_constraintdef(con.oid) AS definition
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid=con.conrelid
       JOIN pg_namespace ns ON ns.oid=rel.relnamespace
       WHERE ns.nspname=$1`,
      [schema],
    );
    const definitions = constraints.rows.map(({ table_name, definition }) => `${table_name}: ${definition}`);
    assert.ok(definitions.some((value) => value.startsWith("holder_balances: CHECK") && value.includes("balance >=")));
    assert.ok(definitions.some((value) => value.startsWith("keeper_runs: CHECK") && value.includes("dry-run")));
    assert.ok(definitions.some((value) => value.startsWith("keeper_actions: FOREIGN KEY") && value.includes("keeper_runs")));
    assert.ok(definitions.some((value) => value.startsWith("reward_finalizations: UNIQUE") && value.includes("transaction_hash")));

    const secondRun = await runMigrations(db, { logger: { log() {} } });
    assert.deepEqual(secondRun.appliedNames, []);
    assert.deepEqual(secondRun.skippedNames, migrations);
    assert.deepEqual(await migrationNames(db), migrations);
  });
});

test("pre-ledger schema upgrades without losing indexed data", async () => {
  await withDisposableSchema(async (db) => {
    const initial = await runMigrations(db, {
      through: "001_initial.sql",
      logger: { log() {} },
    });
    assert.deepEqual(initial.appliedNames, ["001_initial.sql"]);

    await db.query(
      `INSERT INTO launches (
        chain_id, token_address, pool_id, deployer, creator_fee_recipient, pair_token,
        launch_config_id, pool_fee, block_number, transaction_hash, log_index
      ) VALUES (46630, '0xtoken', '0xpool', '0xdeployer', '0xcreator', '0xpair', 1, 10000, 114104980, '0xlaunch', 0)`,
    );
    await db.query(
      `INSERT INTO trades (
        chain_id, pool_id, token_address, sender, amount0, amount1, sqrt_price_x96,
        liquidity, tick, fee, block_number, transaction_hash, log_index
      ) VALUES (46630, '0xpool', '0xtoken', '0xsender', 10, -20, 30, 40, 5, 10000, 114104981, '0xtrade', 1)`,
    );
    await db.query(
      `INSERT INTO fee_claims (
        chain_id, recipient, token_address, amount, block_number, transaction_hash, log_index
      ) VALUES (46630, '0xcreator', '0xtoken', 7, 114104982, '0xclaim', 2)`,
    );

    const upgrade = await runMigrations(db, { logger: { log() {} } });
    assert.deepEqual(upgrade.appliedNames, ["002_market_data_and_keeper.sql", "003_pair_catalog_and_routes.sql"]);
    assert.deepEqual(await migrationNames(db), migrations);

    const launch = await db.query("SELECT token_address, pair_symbol, block_time FROM launches");
    assert.deepEqual(launch.rows, [{ token_address: "0xtoken", pair_symbol: null, block_time: null }]);
    const trade = await db.query("SELECT transaction_hash, token_volume, quote_volume FROM trades");
    assert.deepEqual(trade.rows, [{ transaction_hash: "0xtrade", token_volume: null, quote_volume: null }]);
    const claim = await db.query("SELECT transaction_hash, block_time FROM fee_claims");
    assert.deepEqual(claim.rows, [{ transaction_hash: "0xclaim", block_time: null }]);

    const rerun = await runMigrations(db, { logger: { log() {} } });
    assert.deepEqual(rerun.appliedNames, []);
    assert.deepEqual(rerun.skippedNames, migrations);
  });
});
