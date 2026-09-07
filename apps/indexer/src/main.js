import { loadConfig } from "./config.js";
import { createDatabase } from "./db.js";
import { createIndexer } from "./indexer.js";
import { startApi } from "./api.js";
import { createEventHub } from "./events.js";
import { createKeeper } from "./keeper.js";

const config = loadConfig();
const db = createDatabase(config.databaseUrl);
const eventHub = createEventHub();
const indexer = createIndexer(config, db, eventHub);
const keeper = config.keeper.enabled ? createKeeper(config, db, indexer.client) : null;
const api = startApi(config, db, eventHub);

const shutdown = async () => {
  indexer.stop();
  keeper?.stop();
  await new Promise((resolve) => api.close(resolve));
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
await Promise.all([indexer.run(), keeper?.run()].filter(Boolean));
