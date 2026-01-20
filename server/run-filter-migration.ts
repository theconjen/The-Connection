/**
 * Run the community filters migration
 */
import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {

    const migrationSQL = readFileSync(
      join(__dirname, '../migrations/add_community_filters.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
