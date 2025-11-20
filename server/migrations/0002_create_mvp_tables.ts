import { db } from "../db";
import { sql } from "drizzle-orm";
import { log } from "../vite-shim";

export async function runMigration() {
  try {
    log("Starting migration: create MVP tables (users, posts, communities, events, reports, blocks)");

    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // users
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        display_name TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        deleted_at TIMESTAMPTZ
      );
    `);

    // communities
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

    // posts
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

    // events
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

    // reports
    // Create reports table with column types that match existing users/posts tables.
    // If users.id is uuid, create reporter_id/subject_id as uuid; otherwise use integer types.
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema='public' AND table_name='users' AND column_name='id' AND data_type='uuid'
        ) THEN
          -- users.id is uuid
          CREATE TABLE IF NOT EXISTS reports (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
            subject_type TEXT NOT NULL CHECK (subject_type IN ('post','event','community')),
            subject_id UUID NOT NULL,
            reason TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
        ELSE
          -- users.id is not uuid (legacy integer IDs)
          CREATE TABLE IF NOT EXISTS reports (
            id BIGSERIAL PRIMARY KEY,
            reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            subject_type TEXT NOT NULL CHECK (subject_type IN ('post','event','community')),
            subject_id INTEGER NOT NULL,
            reason TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
          );
        END IF;
      END
      $$;
    `);

    // blocks
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(blocker_id, blocked_user_id)
      );
    `);

    // Helpful indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities (created_at DESC);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at DESC);`);

    log("✅ MVP tables and indexes created/verified");
    return true;
  } catch (error) {
    log("❌ MVP tables migration failed: " + String(error));
    return false;
  }
}
