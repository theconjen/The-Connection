/**
 * Check database status and identify missing tables/columns
 */
import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

async function checkDatabaseStatus() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Check for Christian profile fields in users table
    const userFields = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('location', 'denomination', 'home_church', 'favorite_bible_verse', 'testimony', 'interests')
      ORDER BY column_name;
    `);

    if (userFields.rows.length === 6) {
    } else {
    }

    // Check for microblog_reposts table
    const repostsTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_reposts'
      );
    `);

    if (repostsTable.rows[0].exists) {
    } else {
    }

    // Check for microblog_bookmarks table
    const bookmarksTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_bookmarks'
      );
    `);

    if (bookmarksTable.rows[0].exists) {
    } else {
    }

    // Check for vote_type in post_votes
    const postVoteType = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'post_votes' AND column_name = 'vote_type'
      );
    `);

    if (postVoteType.rows[0].exists) {
    } else {
    }

    // Check for downvotes column in posts
    const postDownvotes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'downvotes'
      );
    `);

    if (postDownvotes.rows[0].exists) {
    } else {
    }

    // Check for downvotes column in comments
    const commentDownvotes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'downvotes'
      );
    `);

    if (commentDownvotes.rows[0].exists) {
    } else {
    }

    // Summary
    );
    );

    const allChecks = [
      userFields.rows.length === 6,
      repostsTable.rows[0].exists,
      bookmarksTable.rows[0].exists,
      postVoteType.rows[0].exists,
      postDownvotes.rows[0].exists,
      commentDownvotes.rows[0].exists,
    ];

    const passedChecks = allChecks.filter(Boolean).length;

    if (passedChecks === 6) {
    } else {
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkDatabaseStatus().catch(console.error);
