import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add comprehensive community features
 * - Creates community_wall_post_likes table
 * - Creates community_wall_post_comments table
 * - Creates community_join_requests table (replaces hack using invitations)
 * - Adds banner_url and avatar_url to communities table
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-community-features");

    // 1. Create community_wall_post_likes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_wall_post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_wall_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wall_post_likes_post_id ON community_wall_post_likes(post_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wall_post_likes_user_id ON community_wall_post_likes(user_id)
    `);
    log("✅ Created community_wall_post_likes table");

    // 2. Create community_wall_post_comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_wall_post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES community_wall_posts(id) ON DELETE CASCADE,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES community_wall_post_comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wall_post_comments_post_id ON community_wall_post_comments(post_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wall_post_comments_author_id ON community_wall_post_comments(author_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_wall_post_comments_parent_id ON community_wall_post_comments(parent_id) WHERE parent_id IS NOT NULL
    `);
    log("✅ Created community_wall_post_comments table");

    // 3. Create community_join_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS community_join_requests (
        id SERIAL PRIMARY KEY,
        community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(community_id, user_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_join_requests_community_id ON community_join_requests(community_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON community_join_requests(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_join_requests_status ON community_join_requests(status)
    `);
    log("✅ Created community_join_requests table");

    // 4. Add banner_url and avatar_url to communities
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'communities' AND column_name = 'banner_url'
          ) THEN
              ALTER TABLE communities ADD COLUMN banner_url TEXT;
          END IF;
      END $$;
    `);
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name = 'communities' AND column_name = 'avatar_url'
          ) THEN
              ALTER TABLE communities ADD COLUMN avatar_url TEXT;
          END IF;
      END $$;
    `);
    log("✅ Added banner_url and avatar_url to communities");

    log("✅ Migration completed: add-community-features");
    log("✅ Enabled: Wall Post Likes, Wall Post Comments, Join Requests, Community Images");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-community-features - ${String(error)}`);
    return false;
  }
}
