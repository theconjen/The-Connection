import { db } from '../db';
import { sql } from 'drizzle-orm';
import { log } from '../vite.js';

export async function runMigration() {
  try {
    log('Starting migration: add push_tokens and notify columns');

    await db.execute(sql`
      ALTER TABLE IF EXISTS users
        ADD COLUMN IF NOT EXISTS notify_dms boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_communities boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_forums boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS notify_feed boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS dm_privacy text DEFAULT 'everyone'
    `);

    // Create push_tokens table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token text NOT NULL UNIQUE,
        platform text NOT NULL,
        created_at timestamptz DEFAULT now(),
        last_used timestamptz DEFAULT now()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id)`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token)`);

    log('✅ push_tokens migration completed');
    return true;
  } catch (error) {
    log('❌ push_tokens migration failed: ' + String(error));
    return false;
  }
}
