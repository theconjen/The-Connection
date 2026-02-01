/**
 * Cleanup Script: Remove all community memberships
 *
 * This script removes ALL entries from the community_members table.
 * After running this:
 * - All communities will have 0 members
 * - Users must voluntarily join communities
 * - First user to join a community becomes the owner/admin
 *
 * Run with: npx tsx server/scripts/cleanup-community-members.ts
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function cleanupCommunityMembers() {
  console.info('\n' + '='.repeat(50));
  console.info('🧹 Community Membership Cleanup');
  console.info('='.repeat(50) + '\n');

  try {
    // Get current counts
    const beforeCount = await db.execute(sql`SELECT COUNT(*) as count FROM community_members`);
    const memberCount = Number((beforeCount.rows[0] as any)?.count || 0);

    const communityCount = await db.execute(sql`SELECT COUNT(*) as count FROM communities`);
    const totalCommunities = Number((communityCount.rows[0] as any)?.count || 0);

    console.info(`📊 Current state:`);
    console.info(`   - Total communities: ${totalCommunities}`);
    console.info(`   - Total memberships: ${memberCount}`);
    console.info('');

    if (memberCount === 0) {
      console.info('✅ No memberships to clean up!');
      return;
    }

    // Delete all community memberships
    console.info('🗑️  Removing all community memberships...');
    await db.execute(sql`DELETE FROM community_members`);

    // Reset member_count on all communities to 0
    console.info('📝 Resetting community member counts to 0...');
    await db.execute(sql`UPDATE communities SET member_count = 0`);

    // Verify cleanup
    const afterCount = await db.execute(sql`SELECT COUNT(*) as count FROM community_members`);
    const remainingMembers = Number((afterCount.rows[0] as any)?.count || 0);

    console.info('');
    console.info('✅ Cleanup Complete!');
    console.info('='.repeat(50));
    console.info(`🗑️  Memberships removed: ${memberCount}`);
    console.info(`📦 Communities affected: ${totalCommunities}`);
    console.info(`✓  Remaining memberships: ${remainingMembers}`);
    console.info('='.repeat(50));
    console.info('');
    console.info('ℹ️  Users must now voluntarily join communities.');
    console.info('ℹ️  First user to join a community becomes the owner.');
    console.info('');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }

  process.exit(0);
}

cleanupCommunityMembers();
