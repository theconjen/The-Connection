import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add Hashtag System
 * - Creates hashtags table
 * - Creates microblog_hashtags junction table
 * - Adds indexes for performance
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-hashtag-system");

    // 1. Create hashtags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hashtags (
        id SERIAL PRIMARY KEY,
        tag TEXT NOT NULL UNIQUE,
        display_tag TEXT NOT NULL,
        trending_score INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log("✅ Created hashtags table");

    // 2. Create indexes for hashtags
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(trending_score DESC)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag)
    `);
    log("✅ Created hashtags indexes");

    // 3. Create microblog_hashtags junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS microblog_hashtags (
        id SERIAL PRIMARY KEY,
        microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
        hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log("✅ Created microblog_hashtags table");

    // 4. Create indexes for microblog_hashtags
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_microblog_hashtag_unique ON microblog_hashtags(microblog_id, hashtag_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_hashtags_microblog ON microblog_hashtags(microblog_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_hashtags_hashtag ON microblog_hashtags(hashtag_id)
    `);
    log("✅ Created microblog_hashtags indexes");

    log("✅ Migration completed: add-hashtag-system");
    log("✅ Enabled: Dynamic Trending Hashtags, Hashtag Filtering");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-hashtag-system - ${String(error)}`);
    return false;
  }
}
