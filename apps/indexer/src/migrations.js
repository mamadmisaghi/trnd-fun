import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const defaultMigrationDirectory = fileURLToPath(new URL("../migrations/", import.meta.url));

export async function runMigrations(
  db,
  { directory = defaultMigrationDirectory, through = null, logger = console } = {},
) {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const migrationNames = (await readdir(directory))
    .filter((name) => name.endsWith(".sql"))
    .filter((name) => through === null || name.localeCompare(through) <= 0)
    .sort();
  const appliedNames = [];
  const skippedNames = [];

  for (const name of migrationNames) {
    const applied = await db.query("SELECT 1 FROM schema_migrations WHERE name=$1", [name]);
    if (applied.rowCount) {
      skippedNames.push(name);
      continue;
    }

    const sql = await readFile(join(directory, name), "utf8");
    await db.transaction(async (tx) => {
      await tx.query(sql);
      await tx.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]);
    });
    appliedNames.push(name);
    logger.log(`Applied migration ${name}.`);
  }

  return { appliedNames, skippedNames };
}
