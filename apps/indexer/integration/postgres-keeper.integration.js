import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { createDatabase } from "../src/db.js";
import { createKeeper } from "../src/keeper.js";
import { runMigrations } from "../src/migrations.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required for PostgreSQL integration tests");

const address = (digit) => `0x${digit.repeat(40)}`;
const chainId = 46630;

function quoteIdentifier(identifier) {
  assert.match(identifier, /^[a-z][a-z0-9_]+$/);
  return `"${identifier}"`;
}

async function withDisposableSchema(work) {
  const schema = `keeper_${randomBytes(8).toString("hex")}`;
  const admin = createDatabase(connectionString);
  await admin.query(`CREATE SCHEMA ${quoteIdentifier(schema)}`);
  const scopedUrl = new URL(connectionString);
  scopedUrl.searchParams.set("options", `-c search_path=${schema},public`);
  const db = createDatabase(scopedUrl.toString());
  try {
    await runMigrations(db, { logger: { log() {} } });
    await work(db);
  } finally {
    await db.close();
    await admin.query(`DROP SCHEMA ${quoteIdentifier(schema)} CASCADE`);
    await admin.close();
  }
}

function keeperConfig(overrides = {}) {
  return {
    chainId,
    rpcUrl: "http://127.0.0.1:1",
    contracts: { locker: address("a"), rewardVault: address("b") },
    keeper: {
      dryRun: true,
      privateKey: "",
      intervalMs: 60_000,
      collectMinAgeMs: 300_000,
      confirmations: 2,
      maxAttempts: 3,
      retryDelayMs: 1_000,
      rankingMode: "testnet_trade_count_v1",
      ...overrides,
    },
  };
}

async function seedLaunch(db, digit, creator = address(digit)) {
  await db.query(
    `INSERT INTO launches(chain_id,token_address,pool_id,deployer,creator_fee_recipient,pair_token,
       launch_config_id,pool_fee,block_number,transaction_hash,log_index,block_time)
     VALUES($1,$2,$3,$4,$5,$6,1,10000,1,$7,0,'1970-01-02T00:00:00Z')`,
    [chainId, address(digit), `pool-${digit}`, address("f"), creator, address("0"), `launch-${digit}`],
  );
}

test("dry-run simulates, never writes, retries failures, and stays idempotent", async () => {
  await withDisposableSchema(async (db) => {
    await seedLaunch(db, "1");
    let simulations = 0;
    let failFirst = true;
    const client = {
      async readContract({ functionName }) {
        if (functionName === "pendingFees") return [1n, 2n];
        if (functionName === "currentEpoch") return 1n;
        throw new Error(`unexpected read ${functionName}`);
      },
      async simulateContract() {
        simulations += 1;
        if (failFirst) { failFirst = false; throw new Error("RPC https://secret.invalid failed"); }
        return { request: {} };
      },
      async waitForTransactionReceipt() { throw new Error("dry-run must not wait for a receipt"); },
    };
    const keeper = createKeeper(keeperConfig(), db, client, { error() {}, warn() {} });

    const failed = await keeper.runOnce();
    assert.equal(failed.statuses.failed, 1);
    let action = (await db.query("SELECT status,attempts,error,next_attempt_at FROM keeper_actions")).rows[0];
    assert.equal(action.status, "failed");
    assert.equal(action.attempts, 1);
    assert.match(action.error, /\[redacted-url\]/);
    assert.ok(action.next_attempt_at);

    await db.query("UPDATE keeper_actions SET next_attempt_at=now()-interval '1 second'");
    const passed = await keeper.runOnce();
    assert.equal(passed.statuses.simulated, 1);
    action = (await db.query("SELECT status,attempts,transaction_hash FROM keeper_actions")).rows[0];
    assert.deepEqual({ status: action.status, attempts: action.attempts, transaction_hash: action.transaction_hash }, { status: "simulated", attempts: 2, transaction_hash: null });

    const repeat = await keeper.runOnce();
    assert.deepEqual(repeat.statuses, {});
    assert.equal(simulations, 2);
  });
});

test("advisory lock prevents concurrent keeper execution", async () => {
  await withDisposableSchema(async (db) => {
    const lockId = 0x54524e44 + chainId;
    await db.withClient(async (holder) => {
      await holder.query("SELECT pg_advisory_lock($1)", [lockId]);
      try {
        const keeper = createKeeper(keeperConfig(), db, { readContract: async () => 1n }, { error() {}, warn() {} });
        assert.deepEqual(await keeper.runOnce(), { skipped: "another_keeper_holds_lock" });
      } finally {
        await holder.query("SELECT pg_advisory_unlock($1)", [lockId]);
      }
    });
    assert.equal((await db.query("SELECT count(*)::int count FROM keeper_runs")).rows[0].count, 0);
  });
});

test("ranking is reproducible, excludes direct creator self-trades, and simulates exactly five recipients", async () => {
  await withDisposableSchema(async (db) => {
    for (const digit of ["1", "2", "3", "4", "5"]) await seedLaunch(db, digit);
    let sequence = 0;
    for (const digit of ["1", "2", "3", "4", "5"]) {
      const count = 6 - Number(digit);
      for (let index = 0; index < count; index += 1) {
        sequence += 1;
        await db.query(
          `INSERT INTO trades(chain_id,pool_id,token_address,sender,amount0,amount1,sqrt_price_x96,liquidity,tick,fee,
             block_number,transaction_hash,log_index,block_time)
           VALUES($1,$2,$3,$4,1,-1,1,1,0,10000,$5,$6,0,'1970-01-02T12:00:00Z')`,
          [chainId, `pool-${digit}`, address(digit), address("e"), sequence, `trade-${sequence}`],
        );
      }
      sequence += 1;
      await db.query(
        `INSERT INTO trades(chain_id,pool_id,token_address,sender,amount0,amount1,sqrt_price_x96,liquidity,tick,fee,
           block_number,transaction_hash,log_index,block_time)
         VALUES($1,$2,$3,$3,1,-1,1,1,0,10000,$4,$5,0,'1970-01-02T12:00:00Z')`,
        [chainId, `pool-${digit}`, address(digit), sequence, `self-${sequence}`],
      );
    }
    await db.query(
      "INSERT INTO reward_funding(chain_id,epoch_id,currency,amount,block_number,block_time,transaction_hash,log_index) VALUES($1,1,$2,100,1,'1970-01-02T12:00:00Z','fund',0)",
      [chainId, address("0")],
    );
    let finalRecipients;
    const client = {
      async readContract({ functionName }) {
        if (functionName === "pendingFees") return [0n, 0n];
        if (functionName === "currentEpoch") return 2n;
        if (functionName === "distributor") return address("d");
        throw new Error(`unexpected read ${functionName}`);
      },
      async simulateContract(request) { finalRecipients = request.args[2]; return { request }; },
    };
    const result = await createKeeper(keeperConfig(), db, client, { error() {}, warn() {} }).runOnce();
    assert.equal(result.finalized, 1);
    assert.deepEqual(finalRecipients, ["1", "2", "3", "4", "5"].map(address));
    const rankings = await db.query("SELECT rank,creator_address,score::text FROM creator_epoch_rankings ORDER BY rank");
    assert.deepEqual(rankings.rows.map((row) => row.score), ["5", "4", "3", "2", "1"]);
  });
});

test("an epoch with fewer than five eligible creators is safely blocked", async () => {
  await withDisposableSchema(async (db) => {
    await seedLaunch(db, "1");
    await db.query(
      `INSERT INTO trades(chain_id,pool_id,token_address,sender,amount0,amount1,sqrt_price_x96,liquidity,tick,fee,
         block_number,transaction_hash,log_index,block_time)
       VALUES($1,'pool-1',$2,$3,1,-1,1,1,0,10000,1,'trade',0,'1970-01-02T12:00:00Z')`,
      [chainId, address("1"), address("e")],
    );
    await db.query(
      "INSERT INTO reward_funding(chain_id,epoch_id,currency,amount,block_number,block_time,transaction_hash,log_index) VALUES($1,1,$2,100,1,'1970-01-02T12:00:00Z','fund',0)",
      [chainId, address("0")],
    );
    const client = {
      async readContract({ functionName }) {
        if (functionName === "pendingFees") return [0n, 0n];
        if (functionName === "currentEpoch") return 2n;
        throw new Error(`unexpected read ${functionName}`);
      },
      async simulateContract() { throw new Error("blocked epoch must not simulate"); },
    };
    const result = await createKeeper(keeperConfig(), db, client, { error() {}, warn() {} }).runOnce();
    assert.equal(result.statuses.blocked, 1);
    const action = (await db.query("SELECT status,error,next_attempt_at FROM keeper_actions")).rows[0];
    assert.equal(action.status, "blocked");
    assert.match(action.error, /found 1/);
    assert.ok(action.next_attempt_at);
  });
});

