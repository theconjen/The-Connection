/**
 * Add unique constraint on event_rsvps (event_id, user_id)
 * This is required for the ON CONFLICT upsert to work
 *
 * Run with: npx tsx server/run-event-rsvps-constraint.ts
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
  console.info('Migration: Add unique constraint on event_rsvps');
  console.info('='.repeat(60));

  try {
    // Check if constraint already exists
    console.info('\n1. Checking for existing constraint...');
    const existingConstraints = await sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'event_rsvps'
        AND constraint_type = 'UNIQUE'
    `;

    console.info(`   Found ${existingConstraints.length} unique constraints`);

    const hasConstraint = existingConstraints.some(
      (c: any) => c.constraint_name.includes('event_id') || c.constraint_name.includes('user_id')
    );

    if (hasConstraint) {
      console.info('   Unique constraint already exists. No migration needed.');
      return;
    }

    // Check for duplicate entries that would violate the constraint
    console.info('\n2. Checking for duplicate entries...');
    const duplicates = await sql`
      SELECT event_id, user_id, COUNT(*) as count
      FROM event_rsvps
      GROUP BY event_id, user_id
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      console.info(`   Found ${duplicates.length} duplicate entries. Cleaning up...`);

      // Keep only the most recent RSVP for each event/user pair
      for (const dup of duplicates) {
        await sql`
          DELETE FROM event_rsvps
          WHERE event_id = ${dup.event_id}
            AND user_id = ${dup.user_id}
            AND id NOT IN (
              SELECT id FROM event_rsvps
              WHERE event_id = ${dup.event_id}
                AND user_id = ${dup.user_id}
              ORDER BY created_at DESC
              LIMIT 1
            )
        `;
      }
      console.info('   Duplicates cleaned up.');
    } else {
      console.info('   No duplicates found.');
    }

    // Add the unique constraint
    console.info('\n3. Adding unique constraint...');
    await sql`
      ALTER TABLE event_rsvps
      ADD CONSTRAINT event_rsvps_event_id_user_id_unique
      UNIQUE (event_id, user_id)
    `;
    console.info('   Constraint added successfully!');

    // Verify
    console.info('\n4. Verifying constraint...');
    const verifyConstraints = await sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'event_rsvps'
        AND constraint_type = 'UNIQUE'
    `;

    const verified = verifyConstraints.some(
      (c: any) => c.constraint_name === 'event_rsvps_event_id_user_id_unique'
    );

    if (verified) {
      console.info('\n' + '='.repeat(60));
      console.info('SUCCESS: Migration completed!');
      console.info('RSVP upsert operations will now work correctly.');
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
