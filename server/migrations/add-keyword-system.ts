import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add Keyword System
 * - Creates keywords table for extracted keywords (without # symbol)
 * - Creates microblog_keywords junction table
 * - Adds indexes for performance
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-keyword-system");

    // 1. Create keywords table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS keywords (
        id SERIAL PRIMARY KEY,
        keyword TEXT NOT NULL UNIQUE,
        display_keyword TEXT NOT NULL,
        trending_score INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMP,
        is_proper_noun BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log("✅ Created keywords table");

    // 2. Create indexes for keywords
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_keywords_trending ON keywords(trending_score DESC)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword)
    `);
    log("✅ Created keywords indexes");

    // 3. Create microblog_keywords junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS microblog_keywords (
        id SERIAL PRIMARY KEY,
        microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
        keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        frequency INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log("✅ Created microblog_keywords table");

    // 4. Create indexes for microblog_keywords
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_microblog_keyword_unique ON microblog_keywords(microblog_id, keyword_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_keywords_microblog ON microblog_keywords(microblog_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_keywords_keyword ON microblog_keywords(keyword_id)
    `);
    log("✅ Created microblog_keywords indexes");

    log("✅ Migration completed: add-keyword-system");
    log("✅ Enabled: Dynamic Trending Keywords, Keyword Extraction");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-keyword-system - ${String(error)}`);
    return false;
  }
}
