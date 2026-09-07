import { loadConfig } from "./config.js";
import { createDatabase } from "./db.js";
import { createIndexer } from "./indexer.js";
import { startApi } from "./api.js";

const config = loadConfig();
const db = createDatabase(config.databaseUrl);
const indexer = createIndexer(config, db);
const api = startApi(config, db);

const shutdown = async () => {
  indexer.stop();
  await new Promise((resolve) => api.close(resolve));
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
await indexer.run();
