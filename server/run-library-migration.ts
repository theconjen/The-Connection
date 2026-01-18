import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const sql = neon(DATABASE_URL);
  const migrationPath = path.join(__dirname, '../migrations/add-qa-library-posts.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.error('Running migration: add-qa-library-posts.sql');

  // Split into individual statements (separated by semicolons)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.error(`Executing ${statements.length} SQL statements...`);

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.error('✓ Migration executed successfully');
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  });
