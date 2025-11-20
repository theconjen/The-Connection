import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Add read status fields to messages table for tracking read receipts
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-message-read-status");

    // Add is_read column (default false)
    await db.execute(sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false
    `);

    // Add read_at column
    await db.execute(sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP
    `);

    // Create index for efficient unread message queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
      ON messages(receiver_id, is_read)
      WHERE is_read = false
    `);

    // Create index for conversation queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages(sender_id, receiver_id, created_at DESC)
    `);

    log("✅ Message read status migration completed");
    return true;
  } catch (error) {
    log("❌ Error in message read status migration: " + String(error));
    return false;
  }
}
