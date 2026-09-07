import { createDatabase } from "./db.js";
import { runMigrations } from "./migrations.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const db = createDatabase(process.env.DATABASE_URL);
try {
  await runMigrations(db);
  console.log("Indexer schema is current.");
} finally {
  await db.close();
}
