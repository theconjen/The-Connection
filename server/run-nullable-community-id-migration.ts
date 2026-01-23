/**
 * Run migration to make events.community_id nullable
 * This allows admins to create app-wide events for "The Connection"
 *
 * Run with: npx tsx server/run-nullable-community-id-migration.ts
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
  console.info('Migration: Make events.community_id nullable');
  console.info('='.repeat(60));

  try {
    // Check current state
    console.info('\n1. Checking current column definition...');
    const columnInfo = await sql`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'community_id'
    `;

    if (columnInfo.length === 0) {
      console.warn('WARNING: community_id column not found in events table');
      return;
    }

    const isNullable = columnInfo[0].is_nullable === 'YES';
    console.info(`   Current state: is_nullable = ${isNullable ? 'YES' : 'NO'}`);

    if (isNullable) {
      console.info('\n   Column is already nullable. No migration needed.');
      return;
    }

    // Check for existing events without community_id (shouldn't exist if constraint is NOT NULL)
    console.info('\n2. Checking for events without community_id...');
    const eventsWithoutCommunity = await sql`
      SELECT COUNT(*) as count FROM events WHERE community_id IS NULL
    `;
    console.info(`   Events without community_id: ${eventsWithoutCommunity[0].count}`);

    // Drop the NOT NULL constraint
    console.info('\n3. Dropping NOT NULL constraint on community_id...');
    await sql`ALTER TABLE events ALTER COLUMN community_id DROP NOT NULL`;
    console.info('   Constraint dropped successfully!');

    // Add comment
    console.info('\n4. Adding column comment...');
    await sql`
      COMMENT ON COLUMN events.community_id IS 'FK to communities table - nullable for app-wide events hosted by The Connection'
    `;
    console.info('   Comment added.');

    // Verify the change
    console.info('\n5. Verifying migration...');
    const verifyInfo = await sql`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'community_id'
    `;
    const nowNullable = verifyInfo[0].is_nullable === 'YES';
    console.info(`   New state: is_nullable = ${nowNullable ? 'YES' : 'NO'}`);

    if (nowNullable) {
      console.info('\n' + '='.repeat(60));
      console.info('SUCCESS: Migration completed!');
      console.info('Janelle can now create events for "The Connection"');
      console.info('='.repeat(60));
    } else {
      console.error('\nERROR: Migration verification failed');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\nERROR during migration:', error.message || error);
    process.exit(1);
  }
}

runMigration();
