/**
 * Run Christian profile fields migration on production database
 */
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('[Migration] Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log('[Migration] Reading migration file...');
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const migrationPath = path.join(__dirname, '../migrations/add_christian_profile_fields.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('[Migration] Running migration...');
  console.log(migrationSQL);

  try {
    // Run the migration
    await pool.query(migrationSQL);
    console.log('[Migration] ✅ Christian profile fields migration completed successfully!');

    // Verify the columns exist
    console.log('[Migration] Verifying columns...');
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('location', 'denomination', 'home_church', 'favorite_bible_verse', 'testimony', 'interests')
      ORDER BY column_name;
    `);

    console.log('[Migration] Found columns:', result.rows);

    if (result.rows.length === 6) {
      console.log('[Migration] ✅ All 6 Christian profile fields are present in the database!');
    } else {
      console.warn('[Migration] ⚠️ Warning: Expected 6 columns but found', result.rows.length);
    }

  } catch (error) {
    console.error('[Migration] ❌ Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
