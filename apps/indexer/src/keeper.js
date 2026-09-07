import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { lockerKeeperAbi, rewardKeeperAbi } from "./abi.js";

const lower = (value) => value.toLowerCase();
const json = (value) => JSON.stringify(value, (_, item) => typeof item === "bigint" ? item.toString() : item);

export function epochBounds(epochId) {
  const start = Number(BigInt(epochId) * 86_400n);
  return { start: new Date(start * 1_000), end: new Date((start + 86_400) * 1_000) };
}

export function validateTopFive(rows) {
  if (rows.length !== 5) return false;
  const recipients = rows.map((row) => lower(row.creator_address));
  return recipients.every((address) => /^0x[0-9a-f]{40}$/.test(address)) && new Set(recipients).size === 5;
}

export function collectActionKey(token, now, intervalMs, mode) {
  return `collect:${mode}:${lower(token)}:${Math.floor(now / intervalMs)}`;
}

async function reserveAction(db, runId, action) {
  const result = await db.query(
    `INSERT INTO keeper_actions(run_id,action_key,action_type,subject,status,attempts,details)
     VALUES($1,$2,$3,$4,'planned',1,$5::jsonb)
     ON CONFLICT(action_key) DO UPDATE SET run_id=excluded.run_id,status='planned',attempts=keeper_actions.attempts+1,
       error=NULL,updated_at=now(),details=keeper_actions.details||excluded.details
     WHERE keeper_actions.status IN ('blocked','failed') RETURNING id`,
    [runId, action.key, action.type, action.subject, json(action.details || {})],
  );
  return result.rows[0]?.id;
}

async function updateAction(db, id, status, fields = {}) {
  await db.query(
    `UPDATE keeper_actions SET status=$2,transaction_hash=$3,error=$4,details=details||$5::jsonb,updated_at=now() WHERE id=$1`,
    [id, status, fields.transactionHash || null, fields.error || null, json(fields.details || {})],
  );
}

async function rankCreators(db, chainId, epochId, scoreVersion) {
  const { start, end } = epochBounds(epochId);
  const result = await db.query(
    `SELECT l.creator_fee_recipient creator_address,count(*)::numeric score
     FROM trades t JOIN launches l ON l.chain_id=t.chain_id AND l.token_address=t.token_address
     WHERE t.chain_id=$1 AND t.block_time>=$2 AND t.block_time<$3 AND l.creator_fee_recipient IS NOT NULL
     GROUP BY l.creator_fee_recipient ORDER BY score DESC,l.creator_fee_recipient ASC LIMIT 5`,
    [chainId, start, end],
  );
  if (!validateTopFive(result.rows)) return result.rows;
  await db.query(`DELETE FROM creator_epoch_rankings WHERE chain_id=$1 AND epoch_id=$2`, [chainId, String(epochId)]);
  for (let index = 0; index < result.rows.length; index += 1) {
    const row = result.rows[index];
    await db.query(
      `INSERT INTO creator_epoch_rankings(chain_id,epoch_id,rank,creator_address,score,score_version) VALUES($1,$2,$3,$4,$5,$6)`,
      [chainId, String(epochId), index + 1, lower(row.creator_address), row.score, scoreVersion],
    );
  }
  return result.rows;
}

export function createKeeper(config, db, publicClient, logger = console) {
  const mode = config.keeper.dryRun ? "dry-run" : "live";
  if (!config.keeper.dryRun && !/^0x[0-9a-fA-F]{64}$/.test(config.keeper.privateKey)) {
    throw new Error("KEEPER_PRIVATE_KEY must be a 32-byte hex key when live keeper mode is enabled");
  }
  const account = config.keeper.dryRun ? null : privateKeyToAccount(config.keeper.privateKey);
  const wallet = account ? createWalletClient({ account, transport: http(config.rpcUrl) }) : null;
  let stopped = false;

  async function submit(actionId, request) {
    try {
      const simulated = await publicClient.simulateContract({ ...request, account });
      await updateAction(db, actionId, "simulated");
      const hash = await wallet.writeContract(simulated.request);
      await updateAction(db, actionId, "submitted", { transactionHash: hash });
      await publicClient.waitForTransactionReceipt({ hash, confirmations: config.keeper.confirmations });
      await updateAction(db, actionId, "confirmed", { transactionHash: hash });
      return true;
    } catch (error) {
      await updateAction(db, actionId, "failed", { error: error.shortMessage || error.message });
      logger.error(`Keeper action failed: ${error.shortMessage || error.message}`);
      return false;
    }
  }

  async function collectFees(runId) {
    const launches = await db.query(
      `SELECT l.token_address FROM launches l LEFT JOIN LATERAL (
         SELECT max(block_time) collected_at FROM fee_collections f WHERE f.chain_id=l.chain_id AND f.token_address=l.token_address
       ) recent ON true WHERE l.chain_id=$1 AND (recent.collected_at IS NULL OR recent.collected_at<now()-($2::text||' milliseconds')::interval)`,
      [config.chainId, config.keeper.collectMinAgeMs],
    );
    let completed = 0;
    for (const row of launches.rows) {
      let pending;
      try { pending = await publicClient.readContract({ address: config.contracts.locker, abi: lockerKeeperAbi, functionName: "pendingFees", args: [row.token_address] }); }
      catch (error) { logger.warn(`pendingFees read failed for ${row.token_address}: ${error.shortMessage || error.message}`); continue; }
      if (pending[0] === 0n && pending[1] === 0n) continue;
      const key = collectActionKey(row.token_address, Date.now(), config.keeper.collectMinAgeMs, mode);
      const id = await reserveAction(db, runId, { key, type: "collect_fees", subject: lower(row.token_address), details: { pending0: pending[0], pending1: pending[1] } });
      if (!id) continue;
      if (config.keeper.dryRun) { await updateAction(db, id, "simulated", { details: { execution: "disabled_by_dry_run" } }); completed += 1; }
      else if (await submit(id, { address: config.contracts.locker, abi: lockerKeeperAbi, functionName: "collectFees", args: [row.token_address] })) completed += 1;
    }
    return completed;
  }

  async function finalizeRewards(runId) {
    const currentEpoch = await publicClient.readContract({ address: config.contracts.rewardVault, abi: rewardKeeperAbi, functionName: "currentEpoch" });
    const funded = await db.query(
      `SELECT epoch_id,currency,sum(amount)::text amount FROM reward_funding rf
       WHERE chain_id=$1 AND epoch_id<$2 AND NOT EXISTS (
         SELECT 1 FROM reward_finalizations f WHERE f.chain_id=rf.chain_id AND f.epoch_id=rf.epoch_id AND f.currency=rf.currency
       ) GROUP BY epoch_id,currency ORDER BY epoch_id,currency`,
      [config.chainId, currentEpoch.toString()],
    );
    let completed = 0;
    for (const reward of funded.rows) {
      const rankings = await rankCreators(db, config.chainId, reward.epoch_id, config.keeper.rankingMode);
      const key = `finalize:${mode}:${reward.epoch_id}:${lower(reward.currency)}`;
      const id = await reserveAction(db, runId, { key, type: "finalize_epoch", subject: `${reward.epoch_id}:${lower(reward.currency)}`, details: { funding: reward.amount, rankingMode: config.keeper.rankingMode } });
      if (!id) continue;
      if (!validateTopFive(rankings)) {
        await updateAction(db, id, "blocked", { error: `Exactly five distinct creators are required; found ${rankings.length}` });
        continue;
      }
      const recipients = rankings.map((row) => lower(row.creator_address));
      if (config.keeper.dryRun) { await updateAction(db, id, "simulated", { details: { recipients, execution: "disabled_by_dry_run" } }); completed += 1; }
      else if (await submit(id, { address: config.contracts.rewardVault, abi: rewardKeeperAbi, functionName: "finalizeEpoch", args: [BigInt(reward.epoch_id), reward.currency, recipients] })) completed += 1;
    }
    return completed;
  }

  async function runOnce() {
    return db.withClient(async (lockClient) => {
      const lock = await lockClient.query(`SELECT pg_try_advisory_lock($1) acquired`, [0x54524e44 + config.chainId]);
      if (!lock.rows[0].acquired) return { skipped: "another_keeper_holds_lock" };
      let runId;
      try {
        const run = await db.query(`INSERT INTO keeper_runs(chain_id,mode) VALUES($1,$2) RETURNING id`, [config.chainId, mode]);
        runId = run.rows[0].id;
        const collected = await collectFees(runId);
        const finalized = await finalizeRewards(runId);
        const details = { collected, finalized };
        await db.query(`UPDATE keeper_runs SET status='succeeded',completed_at=now(),details=$2::jsonb WHERE id=$1`, [runId, json(details)]);
        return details;
      } catch (error) {
        if (runId) await db.query(`UPDATE keeper_runs SET status='failed',completed_at=now(),details=$2::jsonb WHERE id=$1`, [runId, json({ error: error.message })]);
        throw error;
      } finally {
        await lockClient.query(`SELECT pg_advisory_unlock($1)`, [0x54524e44 + config.chainId]);
      }
    });
  }

  async function run() {
    while (!stopped) {
      try { await runOnce(); } catch (error) { logger.error(error); }
      if (!stopped) await new Promise((resolve) => setTimeout(resolve, config.keeper.intervalMs));
    }
  }

  return { run, runOnce, stop: () => { stopped = true; } };
}
