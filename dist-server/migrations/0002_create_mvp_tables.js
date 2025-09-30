import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { log } from "../vite.js";
async function runMigration() {
  try {
    log("Starting migration: create MVP tables (users, posts, communities, events, reports, blocks)");
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        display_name TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS communities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID REFERENCES users(id) ON DELETE CASCADE,
        community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        starts_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
        subject_type TEXT NOT NULL CHECK (subject_type IN ('post','event','community')),
        subject_id UUID NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(blocker_id, blocked_user_id)
      );
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities (created_at DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at DESC);`);
    log("\u2705 MVP tables and indexes created/verified");
    return true;
  } catch (error) {
    log("\u274C MVP tables migration failed: " + String(error));
    return false;
  }
}
export {
  runMigration
};
