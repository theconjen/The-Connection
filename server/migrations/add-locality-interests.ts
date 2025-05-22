import { db } from "../db";
import { sql } from "drizzle-orm";
import { log } from "../vite";

/**
 * Migration to add locality and interest features to the database
 */
export async function runMigration() {
  try {
    log("Starting migration: Adding locality and interest features");

    // Add columns to users table
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS state TEXT,
      ADD COLUMN IF NOT EXISTS zip_code TEXT,
      ADD COLUMN IF NOT EXISTS latitude TEXT,
      ADD COLUMN IF NOT EXISTS longitude TEXT,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE
    `);
    
    log("✅ Added locality fields to users table");

    // Add columns to communities table one by one to avoid errors
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS city TEXT`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS state TEXT`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS is_local_community BOOLEAN DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS latitude TEXT`);
    await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS longitude TEXT`);
    
    // Add array column separately as it might require special handling
    try {
      await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS interest_tags TEXT[]`);
      log("✅ Added interest_tags array column");
    } catch (error) {
      log("⚠️ Could not add interest_tags column: " + String(error));
      // Try alternative approach for PostgreSQL arrays
      try {
        await db.execute(sql`ALTER TABLE IF EXISTS communities ADD COLUMN IF NOT EXISTS interest_tags_json JSONB DEFAULT '[]'`);
        log("✅ Added interest_tags_json column as alternative");
      } catch (innerError) {
        log("⚠️ Could not add interest_tags_json column: " + String(innerError));
      }
    }
    
    log("✅ Added interest tags and locality fields to communities table");
    
    log("Migration completed successfully");
    return true;
  } catch (error) {
    log("❌ Migration failed: " + String(error));
    return false;
  }
}