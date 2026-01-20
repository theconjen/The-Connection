/**
 * Migration script to add GIF support
 * Run with: node run-gif-migration.cjs
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'add_gif_support.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Running migration: add_gif_support.sql');
    await client.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 New columns added:');
    console.log('   - microblogs.gif_url (TEXT)');
    console.log('   - posts.gif_url (TEXT)');
    console.log('');
    console.log('🔍 Indexes created for performance optimization');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
