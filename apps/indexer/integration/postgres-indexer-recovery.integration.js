import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { encodeAbiParameters, encodeEventTopics } from "viem";
import { protocolAbi, swapEvent, transferEvent } from "../src/abi.js";
import { createDatabase } from "../src/db.js";
import { createEventHub } from "../src/events.js";
import { createIndexer } from "../src/indexer.js";
import { runMigrations } from "../src/migrations.js";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("TEST_DATABASE_URL is required for PostgreSQL integration tests");

const CHAIN_ID = 46_630;
const FACTORY = "0x00000000000000000000000000000000000000f1";
const ROUTER = "0x00000000000000000000000000000000000000f2";
const LOCKER = "0x00000000000000000000000000000000000000f3";
const ESCROW = "0x00000000000000000000000000000000000000f4";
const SPLITTER = "0x00000000000000000000000000000000000000f5";
const REWARDS = "0x00000000000000000000000000000000000000f6";
const POOL_MANAGER = "0x00000000000000000000000000000000000000f7";
const TOKEN = "0x1000000000000000000000000000000000000000";
const PAIR = "0x2000000000000000000000000000000000000000";
const DEPLOYER = "0x3000000000000000000000000000000000000000";
const BUYER = "0x4000000000000000000000000000000000000000";
const POOL_ID = `0x${"ab".repeat(32)}`;
const Q96 = 2n ** 96n;

const eventByName = new Map(protocolAbi.filter(({ type }) => type === "event").map((event) => [event.name, event]));

function quoteIdentifier(identifier) {
  assert.match(identifier, /^[a-z][a-z0-9_]+$/);
  return `"${identifier}"`;
}

async function withDisposableSchema(work) {
  const schema = `recovery_${randomBytes(8).toString("hex")}`;
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

function encodedLog({ event, args, address, blockNumber, transaction, logIndex, blockHash }) {
  const topics = encodeEventTopics({ abi: [event], eventName: event.name, args });
  const inputs = event.inputs.filter(({ indexed }) => !indexed);
  const data = inputs.length ? encodeAbiParameters(inputs, inputs.map(({ name }) => args[name])) : "0x";
  return {
    address,
    blockNumber: BigInt(blockNumber),
    blockHash,
    transactionHash: `0x${transaction.toString(16).padStart(64, "0")}`,
    transactionIndex: 0,
    logIndex,
    data,
    topics,
  };
}

function makeFork(label) {
  const block = (number) => {
    const branch = number <= 100 ? "00" : label;
    const parentBranch = number - 1 <= 100 ? "00" : label;
    return ({
    number: BigInt(number),
    hash: `0x${branch}${number.toString(16).padStart(62, "0")}`,
    parentHash: `0x${parentBranch}${(number - 1).toString(16).padStart(62, "0")}`,
    timestamp: BigInt(1_780_000_000 + number),
    });
  };
  const blocks = new Map([100, 101, 102, 103].map((number) => [number, block(number)]));
  const base = [
    encodedLog({
      event: eventByName.get("TokenLaunched"),
      args: { token: TOKEN, poolId: POOL_ID, deployer: DEPLOYER, pairToken: PAIR, launchConfigId: 0n, poolFee: 10_000 },
      address: FACTORY, blockNumber: 100, transaction: 1, logIndex: 0, blockHash: blocks.get(100).hash,
    }),
    encodedLog({
      event: transferEvent,
      args: { from: "0x0000000000000000000000000000000000000000", to: DEPLOYER, value: 1_000n },
      address: TOKEN, blockNumber: 100, transaction: 1, logIndex: 1, blockHash: blocks.get(100).hash,
    }),
  ];
  const forkEvents = label === "aa" ? [
    encodedLog({
      event: swapEvent,
      args: { id: POOL_ID, sender: ROUTER, amount0: -100n, amount1: 50n, sqrtPriceX96: Q96, liquidity: 10_000n, tick: 0, fee: 10_000 },
      address: POOL_MANAGER, blockNumber: 101, transaction: 2, logIndex: 0, blockHash: blocks.get(101).hash,
    }),
    encodedLog({
      event: swapEvent,
      args: { id: POOL_ID, sender: ROUTER, amount0: 25n, amount1: -20n, sqrtPriceX96: Q96 * 2n, liquidity: 9_900n, tick: 1, fee: 10_000 },
      address: POOL_MANAGER, blockNumber: 103, transaction: 3, logIndex: 0, blockHash: blocks.get(103).hash,
    }),
  ] : [
    encodedLog({
      event: swapEvent,
      args: { id: POOL_ID, sender: ROUTER, amount0: -50n, amount1: 40n, sqrtPriceX96: Q96 * 3n, liquidity: 9_800n, tick: 2, fee: 10_000 },
      address: POOL_MANAGER, blockNumber: 102, transaction: 4, logIndex: 0, blockHash: blocks.get(102).hash,
    }),
    encodedLog({
      event: transferEvent,
      args: { from: DEPLOYER, to: BUYER, value: 100n },
      address: TOKEN, blockNumber: 103, transaction: 5, logIndex: 0, blockHash: blocks.get(103).hash,
    }),
  ];
  return { blocks, events: [...base, ...forkEvents] };
}

function fakeClient(initialLabel = "aa") {
  let fork = makeFork(initialLabel);
  return {
    setFork(label) { fork = makeFork(label); },
    async getBlockNumber() { return 103n; },
    async getBlock({ blockNumber }) { return fork.blocks.get(Number(blockNumber)); },
    async getLogs({ address, event, fromBlock, toBlock }) {
      const addresses = new Set((Array.isArray(address) ? address : [address]).map((value) => value.toLowerCase()));
      return fork.events.filter((log) => {
        if (log.blockNumber < fromBlock || log.blockNumber > toBlock || !addresses.has(log.address.toLowerCase())) return false;
        if (!event) return log.address.toLowerCase() !== TOKEN.toLowerCase();
        return log.topics[0] === encodeEventTopics({ abi: [event], eventName: event.name })[0];
      });
    },
    async readContract({ address, functionName }) {
      if (functionName === "name") return address.toLowerCase() === TOKEN.toLowerCase() ? "Recovery Token" : "Pair Token";
      if (functionName === "symbol") return address.toLowerCase() === TOKEN.toLowerCase() ? "RCV" : "PAIR";
      if (functionName === "decimals") return address.toLowerCase() === TOKEN.toLowerCase() ? 18 : 6;
      if (functionName === "getLaunchedToken") return { creatorFeeRecipient: DEPLOYER };
      throw new Error(`Unexpected read ${functionName}`);
    },
  };
}

const config = {
  rpcUrl: "http://unused.invalid",
  chainId: CHAIN_ID,
  startBlock: 100n,
  confirmations: 0n,
  batchSize: 2n,
  pollMs: 1,
  reorgRewind: 2n,
  contracts: { factory: FACTORY, router: ROUTER, locker: LOCKER, feeEscrow: ESCROW, feeSplitter: SPLITTER, rewardVault: REWARDS, poolManager: POOL_MANAGER },
};
const logger = { info() {}, warn() {}, error() {} };

async function snapshot(db) {
  const result = {};
  for (const table of ["indexer_state", "raw_events", "launches", "trades", "indexed_blocks", "candles", "token_transfers", "holder_balances"]) {
    const rows = await db.query(`SELECT * FROM ${table} ORDER BY 1,2,3`);
    result[table] = rows.rows.map((row) => Object.fromEntries(
      Object.entries(row).filter(([key]) => !["created_at", "updated_at", "applied_at"].includes(key)),
    ));
  }
  return result;
}

test("full configured backfill is restart-idempotent and reorg rebuilds deterministically", async () => {
  let rebuilt;
  await withDisposableSchema(async (db) => {
    const client = fakeClient("aa");
    const first = createIndexer(config, db, createEventHub(), logger, { client });
    const completed = await first.syncOnce();
    assert.equal(completed.cursor, 103n);
    assert.equal(completed.target, 103n);

    const beforeRestart = await snapshot(db);
    const restarted = createIndexer(config, db, createEventHub(), logger, { client });
    await restarted.syncOnce();
    assert.deepEqual(await snapshot(db), beforeRestart);

    client.setFork("bb");
    await restarted.syncOnce();
    rebuilt = await snapshot(db);
    assert.equal(rebuilt.trades.length, 1);
    assert.equal(rebuilt.trades[0].transaction_hash, `0x${(4).toString(16).padStart(64, "0")}`);
    assert.deepEqual(rebuilt.holder_balances.map(({ holder_address, balance }) => [holder_address, balance]), [
      [DEPLOYER.toLowerCase(), "900"],
      [BUYER.toLowerCase(), "100"],
    ]);
  });

  await withDisposableSchema(async (db) => {
    const clean = createIndexer(config, db, createEventHub(), logger, { client: fakeClient("bb") });
    await clean.syncOnce();
    assert.deepEqual(await snapshot(db), rebuilt);
  });
});
