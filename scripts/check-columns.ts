import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

const sql = neon(databaseUrl as string);

async function main() {
  try {
    const rows = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name LIKE 'email_verification%';`;
    console.log('email verification columns:');
    console.table(rows);
  } catch (err) {
    console.error('query failed', err);
    process.exit(1);
  }
}

void main();
