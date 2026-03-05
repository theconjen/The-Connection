/**
 * Sync microblog likeCount and replyCount counters from actual data.
 *
 * Run this after seeding or whenever counters are out of sync.
 * Usage: npx tsx server/scripts/sync-microblog-counters.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function syncCounters() {
  console.info('🔄 Syncing microblog counters...\n');

  // Sync likeCount from actual microblog_likes rows
  const likeResult = await db.execute(sql`
    UPDATE microblogs m
    SET like_count = COALESCE(sub.cnt, 0)
    FROM (
      SELECT microblog_id, COUNT(*)::int AS cnt
      FROM microblog_likes
      GROUP BY microblog_id
    ) sub
    WHERE m.id = sub.microblog_id
      AND COALESCE(m.like_count, 0) != sub.cnt
  `);
  console.info(`✅ Like counts synced (${likeResult.rowCount || 0} rows updated)`);

  // Also zero out likeCount for microblogs with no likes
  const zeroLikes = await db.execute(sql`
    UPDATE microblogs
    SET like_count = 0
    WHERE like_count > 0
      AND id NOT IN (SELECT DISTINCT microblog_id FROM microblog_likes)
  `);
  if ((zeroLikes.rowCount || 0) > 0) {
    console.info(`   (zeroed ${zeroLikes.rowCount} orphaned like counts)`);
  }

  // Sync replyCount from actual child microblogs (replies with parentId)
  const replyResult = await db.execute(sql`
    UPDATE microblogs m
    SET reply_count = COALESCE(sub.cnt, 0)
    FROM (
      SELECT parent_id, COUNT(*)::int AS cnt
      FROM microblogs
      WHERE parent_id IS NOT NULL
      GROUP BY parent_id
    ) sub
    WHERE m.id = sub.parent_id
      AND COALESCE(m.reply_count, 0) != sub.cnt
  `);
  console.info(`✅ Reply counts synced (${replyResult.rowCount || 0} rows updated)`);

  // Also add comment counts from the comments table for microblogs
  // (comments created via POST /api/microblogs/:id/comments go into the comments table)
  const commentResult = await db.execute(sql`
    UPDATE microblogs m
    SET reply_count = COALESCE(reply_sub.cnt, 0) + COALESCE(comment_sub.cnt, 0)
    FROM (
      SELECT parent_id AS mid, COUNT(*)::int AS cnt
      FROM microblogs
      WHERE parent_id IS NOT NULL
      GROUP BY parent_id
    ) reply_sub
    FULL OUTER JOIN (
      SELECT post_id AS mid, COUNT(*)::int AS cnt
      FROM comments
      GROUP BY post_id
    ) comment_sub ON reply_sub.mid = comment_sub.mid
    WHERE m.id = COALESCE(reply_sub.mid, comment_sub.mid)
      AND COALESCE(m.reply_count, 0) != (COALESCE(reply_sub.cnt, 0) + COALESCE(comment_sub.cnt, 0))
  `);
  if ((commentResult.rowCount || 0) > 0) {
    console.info(`✅ Combined reply+comment counts synced (${commentResult.rowCount} rows updated)`);
  }

  console.info('\n🎉 Counter sync complete!');
}

syncCounters()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
