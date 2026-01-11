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

  console.log('[Migration] Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });

  console.log('[Migration] Reading migration file...');
  const migrationPath = path.join(__dirname, '../migrations/apply_feed_features.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('[Migration] Running feed features migration...');
  console.log('This will add:');
  console.log('  - vote_type column to post_votes and comment_votes');
  console.log('  - downvotes column to posts and comments');
  console.log('  - microblog_reposts table');
  console.log('  - microblog_bookmarks table');
  console.log('');

  try {
    // Run the migration
    await pool.query(migrationSQL);
    console.log('[Migration] ✅ Feed features migration completed successfully!\n');

    // Verify the changes
    console.log('[Migration] Verifying changes...\n');

    // Check microblog_reposts table
    const repostsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_reposts'
      );
    `);
    console.log(`  microblog_reposts table: ${repostsCheck.rows[0].exists ? '✅' : '❌'}`);

    // Check microblog_bookmarks table
    const bookmarksCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_bookmarks'
      );
    `);
    console.log(`  microblog_bookmarks table: ${bookmarksCheck.rows[0].exists ? '✅' : '❌'}`);

    // Check vote_type in post_votes
    const voteTypeCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'post_votes' AND column_name = 'vote_type'
      );
    `);
    console.log(`  post_votes.vote_type column: ${voteTypeCheck.rows[0].exists ? '✅' : '❌'}`);

    // Check downvotes in posts
    const postDownvotesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'downvotes'
      );
    `);
    console.log(`  posts.downvotes column: ${postDownvotesCheck.rows[0].exists ? '✅' : '❌'}`);

    // Check downvotes in comments
    const commentDownvotesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'downvotes'
      );
    `);
    console.log(`  comments.downvotes column: ${commentDownvotesCheck.rows[0].exists ? '✅' : '❌'}`);

    console.log('\n[Migration] ✅ All feed features are now available!');

  } catch (error) {
    console.error('[Migration] ❌ Error running migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);
