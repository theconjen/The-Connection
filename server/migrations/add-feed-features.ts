import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add comprehensive feed and forum features
 * - Adds vote_type column to post_votes and comment_votes (enables downvotes)
 * - Adds downvotes column to posts and comments
 * - Creates microblog_reposts table
 * - Creates microblog_bookmarks table
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-feed-features");

    // 1. Add vote_type to post_votes (for downvotes)
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'post_votes' AND column_name = 'vote_type'
          ) THEN
              ALTER TABLE post_votes ADD COLUMN vote_type VARCHAR(10) DEFAULT 'upvote';
              ALTER TABLE post_votes ADD CONSTRAINT vote_type_check CHECK (vote_type IN ('upvote', 'downvote'));
          END IF;
      END $$;
    `);
    log("✅ Added vote_type to post_votes");

    // 2. Add vote_type to comment_votes (for downvotes)
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'comment_votes' AND column_name = 'vote_type'
          ) THEN
              ALTER TABLE comment_votes ADD COLUMN vote_type VARCHAR(10) DEFAULT 'upvote';
              ALTER TABLE comment_votes ADD CONSTRAINT comment_vote_type_check CHECK (vote_type IN ('upvote', 'downvote'));
          END IF;
      END $$;
    `);
    log("✅ Added vote_type to comment_votes");

    // 3. Add downvotes column to posts
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'posts' AND column_name = 'downvotes'
          ) THEN
              ALTER TABLE posts ADD COLUMN downvotes INTEGER DEFAULT 0;
          END IF;
      END $$;
    `);
    log("✅ Added downvotes column to posts");

    // 4. Add downvotes column to comments
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'comments' AND column_name = 'downvotes'
          ) THEN
              ALTER TABLE comments ADD COLUMN downvotes INTEGER DEFAULT 0;
          END IF;
      END $$;
    `);
    log("✅ Added downvotes column to comments");

    // 5. Create microblog_reposts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS microblog_reposts (
          id SERIAL PRIMARY KEY,
          microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(microblog_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_reposts_microblog_id ON microblog_reposts(microblog_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_reposts_user_id ON microblog_reposts(user_id)
    `);
    log("✅ Created microblog_reposts table");

    // 6. Create microblog_bookmarks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS microblog_bookmarks (
          id SERIAL PRIMARY KEY,
          microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(microblog_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_microblog_id ON microblog_bookmarks(microblog_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_user_id ON microblog_bookmarks(user_id)
    `);
    log("✅ Created microblog_bookmarks table");

    log("✅ Migration completed: add-feed-features");
    log("✅ Enabled: Forum Downvotes, Feed Reposts, Feed Bookmarks");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-feed-features - ${String(error)}`);
    return false;
  }
}
