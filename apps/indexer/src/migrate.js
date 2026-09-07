import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./db.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const db = createDatabase(config.databaseUrl);
const path = fileURLToPath(new URL("../migrations/001_initial.sql", import.meta.url));
await db.query(await readFile(path, "utf8"));
await db.close();
console.log("Indexer schema is current.");
