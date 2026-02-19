/**
 * Sync Microblog Counts
 *
 * Updates the cached likeCount and replyCount on microblogs table
 * based on actual data in microblog_likes and child microblogs.
 *
 * Run: npx tsx server/scripts/sync-microblog-counts.ts
 */

import 'dotenv/config';
import { db } from '../db';
import { microblogs, microblogLikes } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

async function syncMicroblogCounts() {
  console.info('\n🔄 Syncing microblog counts...\n');

  try {
    // 1. Update like counts from microblog_likes table
    console.info('📊 Updating like counts...');
    const likeResult = await db.execute(sql`
      UPDATE microblogs m
      SET like_count = (
        SELECT COUNT(*)::int FROM microblog_likes ml WHERE ml.microblog_id = m.id
      )
    `);
    console.info('   ✅ Like counts updated');

    // 2. Update reply counts from child microblogs AND comments table
    // Advice posts get responses via both:
    //   - child microblogs (parent_id = this microblog)
    //   - comments table (post_id = this microblog)
    console.info('📊 Updating reply counts (microblogs + comments)...');
    const replyResult = await db.execute(sql`
      UPDATE microblogs m
      SET reply_count = (
        SELECT (
          COALESCE((SELECT COUNT(*)::int FROM microblogs r WHERE r.parent_id = m.id), 0) +
          COALESCE((SELECT COUNT(*)::int FROM comments c WHERE c.post_id = m.id), 0)
        )
      )
    `);
    console.info('   ✅ Reply counts updated (includes both microblogs and comments)');

    // 3. Update bookmark counts from microblog_bookmarks table
    console.info('📊 Updating bookmark counts...');
    const bookmarkResult = await db.execute(sql`
      UPDATE microblogs m
      SET bookmark_count = (
        SELECT COUNT(*)::int FROM microblog_bookmarks mb WHERE mb.microblog_id = m.id
      )
    `);
    console.info('   ✅ Bookmark counts updated');

    // 4. Update repost counts from microblog_reposts table
    console.info('📊 Updating repost counts...');
    const repostResult = await db.execute(sql`
      UPDATE microblogs m
      SET repost_count = (
        SELECT COUNT(*)::int FROM microblog_reposts mr WHERE mr.microblog_id = m.id
      )
    `);
    console.info('   ✅ Repost counts updated');

    // 5. Update unique replier counts
    console.info('📊 Updating unique replier counts...');
    const uniqueReplierResult = await db.execute(sql`
      UPDATE microblogs m
      SET unique_replier_count = (
        SELECT COUNT(DISTINCT author_id)::int FROM microblogs r WHERE r.parent_id = m.id
      )
    `);
    console.info('   ✅ Unique replier counts updated');

    // Get some stats
    const stats = await db.execute(sql`
      SELECT
        COUNT(*) as total_microblogs,
        SUM(like_count) as total_likes,
        SUM(reply_count) as total_replies,
        SUM(bookmark_count) as total_bookmarks,
        COUNT(*) FILTER (WHERE like_count > 0) as posts_with_likes,
        COUNT(*) FILTER (WHERE reply_count > 0) as posts_with_replies
      FROM microblogs
    `);

    console.info('\n' + '='.repeat(50));
    console.info('✨ Sync Complete!');
    console.info('='.repeat(50));

    const row = (stats as any)[0];
    if (row) {
      console.info(`📝 Total microblogs: ${row.total_microblogs}`);
      console.info(`❤️  Total likes: ${row.total_likes}`);
      console.info(`💬 Total replies: ${row.total_replies}`);
      console.info(`🔖 Total bookmarks: ${row.total_bookmarks}`);
      console.info(`📈 Posts with likes: ${row.posts_with_likes}`);
      console.info(`📈 Posts with replies: ${row.posts_with_replies}`);
    }

    console.info('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error syncing counts:', error);
    throw error;
  }
}

async function main() {
  await syncMicroblogCounts();
  console.info('🎉 Done!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
