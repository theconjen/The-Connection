import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add Post Hashtag/Keyword System
 * - Creates post_hashtags junction table
 * - Creates post_keywords junction table
 * - Adds indexes for performance
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-post-hashtag-keyword-system");

    // 1. Create post_hashtags junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS post_hashtags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log("✅ Created post_hashtags table");

    // 2. Create indexes for post_hashtags
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_post_hashtag_unique ON post_hashtags(post_id, hashtag_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id)
    `);
    log("✅ Created post_hashtags indexes");

    // 3. Create post_keywords junction table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS post_keywords (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
        frequency INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log("✅ Created post_keywords table");

    // 4. Create indexes for post_keywords
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_post_keyword_unique ON post_keywords(post_id, keyword_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_post_keywords_post ON post_keywords(post_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_post_keywords_keyword ON post_keywords(keyword_id)
    `);
    log("✅ Created post_keywords indexes");

    log("✅ Migration completed: add-post-hashtag-keyword-system");
    log("✅ Enabled: Forum Post Trending, Hashtag/Keyword Filtering for Posts");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-post-hashtag-keyword-system - ${String(error)}`);
    return false;
  }
}
