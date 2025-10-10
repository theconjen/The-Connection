import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { log } from "../vite.js";
async function runMigration() {
  try {
    log("Starting migration: Adding locality and interest features");
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT,
      ADD COLUMN IF NOT EXISTS zip_code TEXT,
      ADD COLUMN IF NOT EXISTS latitude TEXT,
      ADD COLUMN IF NOT EXISTS longitude TEXT,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE
    `);
    log("\u2705 Added locality fields to users table");
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS city TEXT`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS state TEXT`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS is_local_community BOOLEAN DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS latitude TEXT`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS longitude TEXT`);
    try {
      await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS interest_tags TEXT[]`);
      log("\u2705 Added interest_tags array column");
    } catch (error) {
      log("\u26A0\uFE0F Could not add interest_tags column: " + String(error));
      try {
        await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS interest_tags_json JSONB DEFAULT '[]'`);
        log("\u2705 Added interest_tags_json column as alternative");
      } catch (innerError) {
        log("\u26A0\uFE0F Could not add interest_tags_json column: " + String(innerError));
      }
    }
    log("\u2705 Added interest tags and locality fields to communities table");
    log("Migration completed successfully");
    return true;
  } catch (error) {
    log("\u274C Migration failed: " + String(error));
    return false;
  }
}
export {
  runMigration
};
