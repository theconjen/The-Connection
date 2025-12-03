import 'dotenv/config';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

const sql = neon(databaseUrl as string) as any;

async function main() {
  try {
    const sqlText = fs.readFileSync('migrations/0009_add_email_verification_hash.sql', 'utf8');
    console.log('Applying migration 0009...');

    // Split into statements and execute sequentially because the client
    // does not allow multiple statements in a single prepared statement.
    // Prefer executing ALTER TABLE blocks first to avoid index creation
    // errors when columns don't exist yet.
    const alterMatch = sqlText.match(/ALTER\s+TABLE[\s\S]*?;/i);
    let remaining = sqlText;
    if (alterMatch) {
      const alterStmt = alterMatch[0].trim();
      console.log('Executing ALTER TABLE statement...');
      await sql.query(alterStmt);
      remaining = sqlText.replace(alterStmt, '');
    }

    const statements = remaining
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      console.log('Executing statement:', stmt.slice(0, 120).replace(/\n/g, ' '));
      await sql.query(stmt);
    }

    console.log('Migration applied');
  } catch (err) {
    console.error('Failed to apply migration:', err);
    process.exit(1);
  }
}

void main();
