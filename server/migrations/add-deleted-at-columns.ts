import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add deleted_at columns to posts and comments tables
 * This enables soft deletion of posts and comments
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add deleted_at columns to posts and comments");

    // Add deleted_at to posts table
    await db.execute(
      sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz`
    );
    log("✅ Added deleted_at column to posts table");

    // Add deleted_at to comments table
    await db.execute(
      sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at timestamptz`
    );
    log("✅ Added deleted_at column to comments table");

    log("✅ Migration completed: add-deleted-at-columns");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-deleted-at-columns - ${String(error)}`);
    return false;
  }
}
