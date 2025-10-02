import { db } from '../db';
import { sql } from 'drizzle-orm';
import { log } from '../vite.js';

export async function runMigration() {
  try {
    log('Starting migration: add notifications table');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        body text NOT NULL,
        data jsonb,
        category text DEFAULT 'feed',
        is_read boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read)`);

    log('✅ notifications migration completed');
    return true;
  } catch (error) {
    log('❌ notifications migration failed: ' + String(error));
    return false;
  }
}
