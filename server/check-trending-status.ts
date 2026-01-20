/**
 * Check Trending Hashtags Status
 * Diagnoses if the trending feature is working
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

async function checkTrendingStatus() {
  console.log('='.repeat(60));
  console.log('TRENDING HASHTAGS DIAGNOSTIC');
  console.log('='.repeat(60));

  try {
    // Check if hashtags table exists
    console.log('\n1. Checking if hashtags table exists...');
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'hashtags'
      );
    `);
    console.log('   ✓ Hashtags table exists:', tableExists.rows[0]?.exists || false);

    if (!tableExists.rows[0]?.exists) {
      console.log('\n   ❌ PROBLEM: Hashtags table does not exist!');
      console.log('   FIX: Run the migration:');
      console.log('   cd /Users/rawaselou/Desktop/The-Connection-main');
      console.log('   psql $DATABASE_URL -f migrations/add_hashtag_system.sql');
      return;
    }

    // Check hashtag count
    console.log('\n2. Checking hashtag count...');
    const hashtagCount = await db.execute(sql`SELECT COUNT(*) FROM hashtags`);
    const count = parseInt(hashtagCount.rows[0]?.count || '0');
    console.log(`   ✓ Total hashtags: ${count}`);

    if (count === 0) {
      console.log('\n   ⚠️  No hashtags in database yet');
      console.log('   REASON: No microblogs with hashtags have been posted');
      console.log('   FIX: Post microblogs with hashtags like:');
      console.log('   - "Join us for #BibleStudy tonight!"');
      console.log('   - "Praying for you all #Prayer #Community"');
      return;
    }

    // Show top 10 trending hashtags
    console.log('\n3. Top 10 Trending Hashtags:');
    const trending = await db.execute(sql`
      SELECT tag, display_tag, trending_score, usage_count, last_used_at
      FROM hashtags
      ORDER BY trending_score DESC
      LIMIT 10
    `);

    if (trending.rows.length === 0) {
      console.log('   ⚠️  No trending hashtags found');
    } else {
      trending.rows.forEach((row: any, index: number) => {
        console.log(`   ${index + 1}. #${row.display_tag}`);
        console.log(`      Score: ${row.trending_score}`);
        console.log(`      Uses: ${row.usage_count}`);
        console.log(`      Last used: ${row.last_used_at}`);
      });
    }

    // Check microblog_hashtags junction table
    console.log('\n4. Checking microblog-hashtag links...');
    const linkCount = await db.execute(sql`SELECT COUNT(*) FROM microblog_hashtags`);
    const links = parseInt(linkCount.rows[0]?.count || '0');
    console.log(`   ✓ Total links: ${links}`);

    // Check recent microblogs with hashtags
    console.log('\n5. Recent microblogs with hashtags (last 24h)...');
    const recentWithHashtags = await db.execute(sql`
      SELECT
        m.id,
        m.content,
        m.created_at,
        COUNT(mh.hashtag_id) as hashtag_count
      FROM microblogs m
      LEFT JOIN microblog_hashtags mh ON m.id = mh.microblog_id
      WHERE m.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY m.id, m.content, m.created_at
      HAVING COUNT(mh.hashtag_id) > 0
      ORDER BY m.created_at DESC
      LIMIT 5
    `);

    if (recentWithHashtags.rows.length === 0) {
      console.log('   ⚠️  No microblogs with hashtags in last 24 hours');
      console.log('   This is why trending shows nothing - need recent activity!');
    } else {
      recentWithHashtags.rows.forEach((row: any) => {
        console.log(`   - ID ${row.id}: ${row.content.substring(0, 50)}...`);
        console.log(`     Hashtags: ${row.hashtag_count}, Posted: ${row.created_at}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during diagnostic:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
  }

  process.exit(0);
}

checkTrendingStatus();
