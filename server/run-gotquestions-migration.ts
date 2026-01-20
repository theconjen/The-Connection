/**
 * Run GotQuestions migration
 * Executes update-library-posts-gotquestions.sql migration
 *
 * Usage: npx tsx -r dotenv/config server/run-gotquestions-migration.ts
 */

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
  const migrationPath = path.join(__dirname, '../migrations/update-library-posts-gotquestions.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.error('Running migration: update-library-posts-gotquestions.sql\n');

  // Remove all comment lines
  const cleanedSQL = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split into individual statements by semicolon
  const statements = cleanedSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('COMMENT'));

  console.error(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.replace(/\s+/g, ' ').substring(0, 80);
    console.error(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      await sql.query(statement);
      console.error('✓ Success\n');
    } catch (error: any) {
      console.error(`✗ Error: ${error.message}\n`);

      // Continue with other statements even if one fails (for IF NOT EXISTS cases)
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
  }

  // Handle COMMENT statements separately
  const commentStatements = migrationSQL
    .split('\n')
    .filter(line => line.trim().startsWith('COMMENT ON'))
    .map(line => line.trim().replace(/;$/, ''));

  if (commentStatements.length > 0) {
    console.error(`Adding ${commentStatements.length} table/column comments...\n`);
    for (const comment of commentStatements) {
      try {
        await sql.query(comment);
        console.error('✓ Comment added');
      } catch (error: any) {
        console.error(`✗ Comment failed (non-critical): ${error.message}`);
      }
    }
  }

  console.error('\n✅ Migration completed successfully');
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
