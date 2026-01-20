/**
 * Run comprehensive feed features migration
 * Adds: downvotes, reposts, bookmarks
 */
import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  const migrationPath = path.join(__dirname, '../migrations/apply_feed_features.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');


  try {
    // Run the migration
    await pool.query(migrationSQL);

    // Verify the changes

    // Check microblog_reposts table
    const repostsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_reposts'
      );
    `);

    // Check microblog_bookmarks table
    const bookmarksCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_bookmarks'
      );
    `);

    // Check vote_type in post_votes
    const voteTypeCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'post_votes' AND column_name = 'vote_type'
      );
    `);

    // Check downvotes in posts
    const postDownvotesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'downvotes'
      );
    `);

    // Check downvotes in comments
    const commentDownvotesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'downvotes'
      );
    `);


  } catch (error) {
    console.error('[Migration] ❌ Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
