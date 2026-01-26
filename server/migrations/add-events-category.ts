import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add category column to events table
 * This column was defined in the schema but never added to the database
 * It allows categorizing events (Sunday Service, Worship, Bible Study, etc.)
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add category column to events table");

    // Add category column to events table
    await db.execute(
      sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT`
    );
    log("Added category column to events table");

    log("Migration completed: add-events-category");
    return true;
  } catch (error) {
    log(`Migration failed: add-events-category - ${String(error)}`);
    return false;
  }
}
