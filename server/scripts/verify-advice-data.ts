/**
 * Verify Advice Data Script
 * Checks that advice posts have replies with correct parentId
 * Run: npx tsx server/scripts/verify-advice-data.ts
 */

import 'dotenv/config';
import { db } from '../db';
import { microblogs } from '@shared/schema';
import { eq, isNotNull, isNull, sql } from 'drizzle-orm';

async function verifyAdviceData() {
  console.log('\n🔍 Verifying advice data...\n');

  try {
    // 1. Count advice posts (topic=QUESTION, no parentId)
    const advicePosts = await db
      .select()
      .from(microblogs)
      .where(sql`${microblogs.topic} = 'QUESTION' AND ${microblogs.parentId} IS NULL`);

    console.log(`📝 Advice posts (topic=QUESTION, no parent): ${advicePosts.length}`);

    if (advicePosts.length > 0) {
      console.log('\n   Sample advice posts:');
      for (const post of advicePosts.slice(0, 3)) {
        console.log(`   - ID ${post.id}: "${post.content?.substring(0, 50)}..."`);
      }
    }

    // 2. Count all replies (microblogs with parentId)
    const allReplies = await db
      .select()
      .from(microblogs)
      .where(isNotNull(microblogs.parentId));

    console.log(`\n💬 Total replies (has parentId): ${allReplies.length}`);

    // 3. For each advice post, count its direct replies
    console.log('\n📊 Replies per advice post:');
    for (const post of advicePosts.slice(0, 5)) {
      const replies = await db
        .select()
        .from(microblogs)
        .where(eq(microblogs.parentId, post.id));

      console.log(`   - Post ${post.id}: ${replies.length} replies`);

      if (replies.length > 0) {
        console.log(`     Sample reply: "${replies[0].content?.substring(0, 40)}..."`);
      }
    }

    // 4. Check replyCount in microblogs table
    console.log('\n📈 Cached reply counts on advice posts:');
    for (const post of advicePosts.slice(0, 5)) {
      console.log(`   - Post ${post.id}: replyCount = ${post.replyCount}`);
    }

    // 5. Check if there are orphan replies (parentId points to non-existent post)
    const orphanReplies = await db.execute(sql`
      SELECT COUNT(*) as count FROM microblogs m
      WHERE m.parent_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM microblogs p WHERE p.id = m.parent_id)
    `);
    console.log(`\n⚠️  Orphan replies (parentId points to deleted post): ${(orphanReplies as any)[0]?.count || 0}`);

    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
}

verifyAdviceData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
