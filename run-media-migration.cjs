/**
 * Migration script to add multiple media support
 * Run with: node run-media-migration.cjs
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
    const migrationPath = path.join(__dirname, 'migrations', 'add_multiple_media_support.sql');
    const migration = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Running migration: add_multiple_media_support.sql');
    await client.query(migration);

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 New columns added:');
    console.log('   - microblogs.image_urls (JSONB)');
    console.log('   - microblogs.video_url (TEXT)');
    console.log('   - posts.image_urls (JSONB)');
    console.log('   - posts.video_url (TEXT)');
    console.log('');
    console.log('🔍 Indexes created for performance optimization');
    console.log('📦 Existing imageUrl data migrated to imageUrls arrays');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
