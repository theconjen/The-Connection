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

  console.log('🔍 Checking production database status...\n');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Check for Christian profile fields in users table
    console.log('1️⃣ Checking Christian profile fields in users table...');
    const userFields = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('location', 'denomination', 'home_church', 'favorite_bible_verse', 'testimony', 'interests')
      ORDER BY column_name;
    `);

    if (userFields.rows.length === 6) {
      console.log('   ✅ All 6 Christian profile fields exist');
    } else {
      console.log('   ❌ Missing Christian profile fields:', 6 - userFields.rows.length);
      console.log('   Run: node server/run-christian-fields-migration.ts');
    }

    // Check for microblog_reposts table
    console.log('\n2️⃣ Checking microblog_reposts table...');
    const repostsTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_reposts'
      );
    `);

    if (repostsTable.rows[0].exists) {
      console.log('   ✅ microblog_reposts table exists');
    } else {
      console.log('   ❌ microblog_reposts table missing');
      console.log('   Migration: migrations/create_microblog_reposts_table.sql');
    }

    // Check for microblog_bookmarks table
    console.log('\n3️⃣ Checking microblog_bookmarks table...');
    const bookmarksTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'microblog_bookmarks'
      );
    `);

    if (bookmarksTable.rows[0].exists) {
      console.log('   ✅ microblog_bookmarks table exists');
    } else {
      console.log('   ❌ microblog_bookmarks table missing');
      console.log('   Migration: migrations/create_microblog_bookmarks_table.sql');
    }

    // Check for vote_type in post_votes
    console.log('\n4️⃣ Checking vote_type column in post_votes...');
    const postVoteType = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'post_votes' AND column_name = 'vote_type'
      );
    `);

    if (postVoteType.rows[0].exists) {
      console.log('   ✅ vote_type column exists in post_votes');
    } else {
      console.log('   ❌ vote_type column missing from post_votes');
      console.log('   Migration: migrations/apply_feed_features.sql');
    }

    // Check for downvotes column in posts
    console.log('\n5️⃣ Checking downvotes column in posts...');
    const postDownvotes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'downvotes'
      );
    `);

    if (postDownvotes.rows[0].exists) {
      console.log('   ✅ downvotes column exists in posts');
    } else {
      console.log('   ❌ downvotes column missing from posts');
      console.log('   Migration: migrations/apply_feed_features.sql');
    }

    // Check for downvotes column in comments
    console.log('\n6️⃣ Checking downvotes column in comments...');
    const commentDownvotes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'downvotes'
      );
    `);

    if (commentDownvotes.rows[0].exists) {
      console.log('   ✅ downvotes column exists in comments');
    } else {
      console.log('   ❌ downvotes column missing from comments');
      console.log('   Migration: migrations/apply_feed_features.sql');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));

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
      console.log('✅ All database checks passed! Database is up to date.');
    } else {
      console.log(`⚠️  ${6 - passedChecks} checks failed. Database needs migrations.`);
      console.log('\n📝 Recommended action:');
      console.log('   Run: node server/run-feed-features-migration.ts');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkDatabaseStatus().catch(console.error);
