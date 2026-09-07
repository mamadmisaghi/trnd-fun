import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./db.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = createDatabase(process.env.DATABASE_URL);
const directory = fileURLToPath(new URL("../migrations/", import.meta.url));
await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`);
for (const name of (await readdir(directory)).filter((item) => item.endsWith(".sql")).sort()) {
  const applied = await db.query(`SELECT 1 FROM schema_migrations WHERE name=$1`, [name]);
  if (applied.rowCount) continue;
  const sql = await readFile(new URL(`../migrations/${name}`, import.meta.url), "utf8");
  await db.transaction(async (tx) => {
    await tx.query(sql);
    await tx.query(`INSERT INTO schema_migrations(name) VALUES($1)`, [name]);
  });
  console.log(`Applied migration ${name}.`);
}
await db.close();
console.log("Indexer schema is current.");
