import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

/**
 * GET /bible/social-reading
 * Returns what the user's friends and community members are currently reading.
 */
router.get('/bible/social-reading', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const { db } = await import('../db');
    const { users, userFollows, communityMembers, communities } = await import('@shared/schema');
    const { eq, and, isNotNull, inArray, ne } = await import('drizzle-orm');

    // 1. Get friends' reading (people the user follows)
    const follows = await db.select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, userId),
        eq(userFollows.status, 'accepted')
      ));

    const followingIds = follows.map(f => f.followingId);

    let friendsReading: any[] = [];
    if (followingIds.length > 0) {
      friendsReading = await db.select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
        currentBibleBook: users.currentBibleBook,
        currentBibleChapter: users.currentBibleChapter,
      })
        .from(users)
        .where(and(
          inArray(users.id, followingIds),
          isNotNull(users.currentBibleBook),
        ));
    }

    // 2. Get community members' reading
    const userCommunityRows = await db.select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const communityIds = userCommunityRows.map(r => r.communityId);

    let communityReading: any[] = [];
    if (communityIds.length > 0) {
      let communityList: any[];
      try {
        communityList = await db.select({
          id: communities.id,
          name: communities.name,
          currentBibleBook: communities.currentBibleBook,
          currentBibleChapter: communities.currentBibleChapter,
        })
          .from(communities)
          .where(inArray(communities.id, communityIds));
      } catch {
        // Fallback if new columns don't exist yet (db:push not run)
        communityList = await db.select({
          id: communities.id,
          name: communities.name,
        })
          .from(communities)
          .where(inArray(communities.id, communityIds));
      }

      // Get all members of those communities who are reading something (exclude self)
      const memberRows = await db.select({ userId: communityMembers.userId, communityId: communityMembers.communityId })
        .from(communityMembers)
        .where(and(
          inArray(communityMembers.communityId, communityIds),
          ne(communityMembers.userId, userId),
        ));

      const memberUserIds = [...new Set(memberRows.map(m => m.userId))];

      let readingMembers: any[] = [];
      if (memberUserIds.length > 0) {
        readingMembers = await db.select({
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          avatarUrl: users.avatarUrl,
          currentBibleBook: users.currentBibleBook,
          currentBibleChapter: users.currentBibleChapter,
        })
          .from(users)
          .where(and(
            inArray(users.id, memberUserIds),
            isNotNull(users.currentBibleBook),
          ));
      }

      // Group by community — include community-set book + individual readers
      communityReading = communityList.map(community => {
        const communityMemberIds = memberRows
          .filter(m => m.communityId === community.id)
          .map(m => m.userId);
        const readers = readingMembers.filter(u => communityMemberIds.includes(u.id));
        return {
          communityId: community.id,
          communityName: community.name,
          communityBook: community.currentBibleBook || null,
          communityChapter: community.currentBibleChapter || null,
          readers,
        };
      }).filter(c => c.readers.length > 0 || c.communityBook);
    }

    res.json({
      friendsReading,
      communityReading,
    });
  } catch (error) {
    console.error('Error fetching social reading data:', error);
    res.status(500).json(buildErrorResponse('Error fetching social reading data', error));
  }
});

export default router;
