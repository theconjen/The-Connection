/**
 * Add event_bookmarks table for tracking user bookmarks on events
 *
 * Run with: npx tsx server/run-event-bookmarks-migration.ts
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.info('='.repeat(60));
  console.info('Migration: Add event_bookmarks table');
  console.info('='.repeat(60));

  try {
    // Check if table already exists
    console.info('\n1. Checking for existing table...');
    const existingTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'event_bookmarks'
    `;

    if (existingTables.length > 0) {
      console.info('   Table event_bookmarks already exists. Checking indexes...');
    } else {
      // Create the table
      console.info('\n2. Creating event_bookmarks table...');
      await sql`
        CREATE TABLE event_bookmarks (
          id SERIAL PRIMARY KEY,
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.info('   Table created successfully!');
    }

    // Check and create unique index
    console.info('\n3. Checking unique constraint...');
    const existingUniqueIndex = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'event_bookmarks'
        AND indexname = 'event_bookmarks_event_user_idx'
    `;

    if (existingUniqueIndex.length === 0) {
      console.info('   Creating unique index on (event_id, user_id)...');
      await sql`
        CREATE UNIQUE INDEX event_bookmarks_event_user_idx
        ON event_bookmarks(event_id, user_id)
      `;
      console.info('   Unique index created!');
    } else {
      console.info('   Unique index already exists.');
    }

    // Check and create user index for efficient lookups
    console.info('\n4. Checking user index...');
    const existingUserIndex = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'event_bookmarks'
        AND indexname = 'event_bookmarks_user_idx'
    `;

    if (existingUserIndex.length === 0) {
      console.info('   Creating index on user_id...');
      await sql`
        CREATE INDEX event_bookmarks_user_idx
        ON event_bookmarks(user_id)
      `;
      console.info('   User index created!');
    } else {
      console.info('   User index already exists.');
    }

    // Verify
    console.info('\n5. Verifying migration...');
    const tableCheck = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'event_bookmarks'
      ORDER BY ordinal_position
    `;

    console.info('   Table columns:');
    tableCheck.forEach((col: any) => {
      console.info(`     - ${col.column_name}: ${col.data_type}`);
    });

    console.info('\n' + '='.repeat(60));
    console.info('SUCCESS: Migration completed!');
    console.info('Event bookmarks are now available.');
    console.info('='.repeat(60));

  } catch (error: any) {
    console.error('\nERROR during migration:', error.message || error);
    process.exit(1);
  }
}

runMigration();
