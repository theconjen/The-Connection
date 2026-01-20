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

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const migrationPath = path.join(__dirname, '../migrations/add_christian_profile_fields.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');


  try {
    // Run the migration
    await pool.query(migrationSQL);

    // Verify the columns exist
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('location', 'denomination', 'home_church', 'favorite_bible_verse', 'testimony', 'interests')
      ORDER BY column_name;
    `);


    if (result.rows.length === 6) {
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
