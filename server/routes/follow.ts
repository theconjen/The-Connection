import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { requireSessionUserId, getSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { notifyUserWithPreferences, getUserDisplayName } from '../services/notificationHelper';
import { broadcastEngagementUpdate } from '../socketInstance';

const router = Router();

// Follow a user (or send follow request for private accounts)
router.post('/users/:userId/follow', requireAuth, async (req, res) => {
  try {
    const followerId = requireSessionUserId(req);
    const followingId = parseInt(req.params.userId);

    if (!Number.isFinite(followingId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if user exists and is not deleted
    const userToFollow = await storage.getUser(followingId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (userToFollow.deletedAt) {
      return res.status(400).json({ message: 'Cannot follow a deactivated user' });
    }

    // Check if blocked (either direction)
    const { db } = await import('../db');
    const { userBlocks } = await import('@shared/schema');
    const { or, and, eq } = await import('drizzle-orm');

    const blockExists = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(
        or(
          and(eq(userBlocks.blockerId, followerId), eq(userBlocks.blockedId, followingId)),
          and(eq(userBlocks.blockerId, followingId), eq(userBlocks.blockedId, followerId))
        )
      )
      .limit(1);

    if (blockExists.length > 0) {
      return res.status(403).json({ message: 'Cannot follow this user' });
    }

    // Check if follow/request already exists (for idempotency)
    const existingFollow = await storage.getUserFollow(followerId, followingId);
    if (existingFollow) {
      // Idempotent: return current state
      const isPending = existingFollow.status === 'pending';
      return res.json({
        success: true,
        message: isPending ? 'Follow request already sent' : 'Already following user',
        isFollowing: !isPending,
        isPending,
        alreadyExists: true,
      });
    }

    // Check if target account is private
    const isPrivateAccount = userToFollow.profileVisibility === 'private' ||
                             userToFollow.profileVisibility === 'friends';

    if (isPrivateAccount) {
      // Create pending follow request
      await storage.createUserFollow({ followerId, followingId, status: 'pending' });

      // Notify the user about the follow request
      getUserDisplayName(followerId).then(async (followerName) => {
        await notifyUserWithPreferences(followingId, {
          title: `${followerName} wants to follow you`,
          body: 'Tap to review the request',
          data: {
            type: 'follow_request',
            userId: followerId,
          },
          category: 'feed',
          type: 'follow_request',
          actorId: followerId,
        });
      }).catch(error => console.error('[Follow] Error sending follow request notification:', error));

      return res.json({
        success: true,
        message: 'Follow request sent',
        isFollowing: false,
        isPending: true,
      });
    }

    // Public account: Create immediate follow
    await storage.createUserFollow({ followerId, followingId, status: 'accepted' });

    // Broadcast engagement update for real-time follow count sync
    broadcastEngagementUpdate({
      type: 'follow',
      followerId,
      followedId: followingId,
      action: 'add',
    });

    // Notify the followed user
    getUserDisplayName(followerId).then(async (followerName) => {
      await notifyUserWithPreferences(followingId, {
        title: `${followerName} started following you`,
        body: 'Check out their profile!',
        data: {
          type: 'follow',
          userId: followerId,
        },
        category: 'feed',
        type: 'follow',
        actorId: followerId,
      });
    }).catch(error => console.error('[Follow] Error sending follower notification:', error));

    res.json({
      success: true,
      message: 'Successfully followed user',
      isFollowing: true,
      isPending: false,
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json(buildErrorResponse('Error following user', error));
  }
});

// Accept a follow request (for private accounts)
router.post('/follow-requests/:userId/accept', requireAuth, async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const requesterId = parseInt(req.params.userId);

    if (!Number.isFinite(requesterId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if there's a pending request from this user
    const existingFollow = await storage.getUserFollow(requesterId, currentUserId);
    if (!existingFollow) {
      return res.status(404).json({ message: 'No follow request found' });
    }

    if (existingFollow.status === 'accepted') {
      // Already accepted - idempotent
      return res.json({
        success: true,
        message: 'Follow request already accepted',
        alreadyAccepted: true,
      });
    }

    // Update status to accepted
    await storage.updateFollowStatus(requesterId, currentUserId, 'accepted');

    // Broadcast engagement update for real-time follow count sync
    broadcastEngagementUpdate({
      type: 'follow',
      followerId: requesterId,
      followedId: currentUserId,
      action: 'add',
    });

    // Notify the requester that their request was accepted
    getUserDisplayName(currentUserId).then(async (userName) => {
      await notifyUserWithPreferences(requesterId, {
        title: `${userName} accepted your follow request`,
        body: 'You can now see their posts',
        data: {
          type: 'follow_accepted',
          userId: currentUserId,
        },
        category: 'feed',
        type: 'follow_accepted',
        actorId: currentUserId,
      });
    }).catch(error => console.error('[Follow] Error sending accept notification:', error));

    res.json({
      success: true,
      message: 'Follow request accepted',
    });
  } catch (error) {
    console.error('Error accepting follow request:', error);
    res.status(500).json(buildErrorResponse('Error accepting follow request', error));
  }
});

// Deny/remove a follow request (for private accounts)
router.post('/follow-requests/:userId/deny', requireAuth, async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const requesterId = parseInt(req.params.userId);

    if (!Number.isFinite(requesterId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Remove the follow/request (works for both pending and accepted)
    const deleted = await storage.deleteUserFollow(requesterId, currentUserId);

    res.json({
      success: true,
      message: deleted ? 'Follow request denied' : 'No follow request found',
    });
  } catch (error) {
    console.error('Error denying follow request:', error);
    res.status(500).json(buildErrorResponse('Error denying follow request', error));
  }
});

// Get pending follow requests for current user
router.get('/follow-requests', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const requests = await storage.getPendingFollowRequests(userId);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    res.status(500).json(buildErrorResponse('Error fetching follow requests', error));
  }
});

// Unfollow a user
router.delete('/users/:userId/follow', requireAuth, async (req, res) => {
  try {
    const followerId = requireSessionUserId(req);
    const followingId = parseInt(req.params.userId);

    if (!Number.isFinite(followingId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Remove follow relationship
    await storage.deleteUserFollow(followerId, followingId);

    // Broadcast engagement update for real-time follow count sync
    broadcastEngagementUpdate({
      type: 'follow',
      followerId,
      followedId: followingId,
      action: 'remove',
    });

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
      isFollowing: false,
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json(buildErrorResponse('Error unfollowing user', error));
  }
});

// Get user's followers
router.get('/users/:userId/followers', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const followers = await storage.getUserFollowers(userId);

    res.json(followers);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json(buildErrorResponse('Error fetching followers', error));
  }
});

// Get users that user is following
router.get('/users/:userId/following', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const following = await storage.getUserFollowing(userId);

    res.json(following);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json(buildErrorResponse('Error fetching following', error));
  }
});

// Check if current user is following another user (or has pending request)
router.get('/users/:userId/follow-status', requireAuth, async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const targetUserId = parseInt(req.params.userId);

    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const status = await storage.getFollowRequestStatus(currentUserId, targetUserId);

    res.json({
      isFollowing: status === 'accepted',
      isPending: status === 'pending',
      status, // 'none', 'pending', or 'accepted'
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json(buildErrorResponse('Error checking follow status', error));
  }
});

// Get user profile with stats (respects privacy settings)
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const viewerId = getSessionUserId(req);
    const isAdmin = req.session?.isAdmin === true;

    if (!Number.isFinite(userId)) {
      console.error('[PROFILE] Invalid user ID:', req.params.userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      console.error('[PROFILE] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check privacy: can this viewer see this profile?
    const isPrivate = user.profileVisibility === 'private' || user.profileVisibility === 'friends';
    const isSelf = viewerId === userId;
    let canViewFullProfile = isAdmin || isSelf || !isPrivate;

    // For private accounts, check if viewer is an accepted follower
    if (!canViewFullProfile && viewerId) {
      canViewFullProfile = await storage.isUserFollowing(viewerId, userId);
    }

    // Use efficient COUNT queries for stats (only for accepted follows)
    const { db } = await import('../db');
    const { userFollows, posts: postsTable, microblogs: microblogsTable, eventRsvps } = await import('@shared/schema');
    const { eq, sql, and } = await import('drizzle-orm');

    let followersCount = 0;
    let followingCount = 0;
    let postsCount = 0;
    let microblogsCount = 0;
    let eventsCount = 0;

    try {
      // Get followers count (only accepted follows)
      const followersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userFollows)
        .where(and(
          eq(userFollows.followingId, userId),
          eq(userFollows.status, 'accepted')
        ));
      followersCount = Number(followersResult[0]?.count || 0);

      // Get following count (only accepted follows)
      const followingResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userFollows)
        .where(and(
          eq(userFollows.followerId, userId),
          eq(userFollows.status, 'accepted')
        ));
      followingCount = Number(followingResult[0]?.count || 0);

      // Get posts count (forum posts)
      const postsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(postsTable)
        .where(eq(postsTable.authorId, userId));
      postsCount = Number(postsResult[0]?.count || 0);

      // Get microblogs count (feed posts)
      const microblogsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(microblogsTable)
        .where(eq(microblogsTable.authorId, userId));
      microblogsCount = Number(microblogsResult[0]?.count || 0);

      // Get confirmed attended events count (events with confirmedAt set)
      const eventsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRsvps)
        .where(and(
          eq(eventRsvps.userId, userId),
          sql`${eventRsvps.confirmedAt} IS NOT NULL`
        ));
      eventsCount = Number(eventsResult[0]?.count || 0);
    } catch (error) {
      console.error('[PROFILE] Error fetching stats:', error);
    }

    // Total posts = forum posts + microblogs
    const totalPosts = postsCount + microblogsCount;

    // Basic profile info (always visible)
    const basicProfile = {
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: canViewFullProfile ? user.bio : null,
        profileImageUrl: user.avatarUrl,
        profileVisibility: user.profileVisibility,
        createdAt: user.createdAt,
      },
      stats: {
        followersCount,
        followingCount,
        communitiesCount: 0,
        postsCount: canViewFullProfile ? totalPosts : 0,
        forumPostsCount: canViewFullProfile ? postsCount : 0,
        feedPostsCount: canViewFullProfile ? microblogsCount : 0,
        eventsCount: canViewFullProfile ? eventsCount : 0,
      },
      isPrivate,
      canViewFullProfile,
    };

    // If viewer cannot see full profile, return limited info
    if (!canViewFullProfile) {
      return res.json({
        ...basicProfile,
        communities: [],
        recentPosts: [],
        recentMicroblogs: [],
      });
    }

    // Full profile access - get additional data
    let communities: any[] = [];
    let posts: any[] = [];
    let microblogs: any[] = [];

    try {
      communities = await storage.getUserCommunities(userId);
    } catch (error) {
      console.error('[PROFILE] Error fetching communities:', error);
    }

    try {
      const allPosts = await storage.getUserPosts(userId);
      posts = allPosts.slice(0, 10);
    } catch (error) {
      console.error('[PROFILE] Error fetching posts:', error);
    }

    try {
      const allMicroblogs = await storage.getUserMicroblogs(userId);
      microblogs = allMicroblogs.slice(0, 10);
    } catch (error) {
      console.error('[PROFILE] Error fetching microblogs:', error);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImageUrl: user.avatarUrl,
        location: user.location,
        denomination: user.denomination,
        homeChurch: user.homeChurch,
        favoriteBibleVerse: user.favoriteBibleVerse,
        testimony: user.testimony,
        interests: user.interests,
        profileVisibility: isSelf || isAdmin ? user.profileVisibility : undefined,
        createdAt: user.createdAt,
      },
      stats: {
        ...basicProfile.stats,
        communitiesCount: communities.length,
      },
      isPrivate,
      canViewFullProfile: true,
      communities: communities.slice(0, 6),
      recentPosts: posts,
      recentMicroblogs: microblogs,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json(buildErrorResponse('Error fetching user profile', error));
  }
});

export default router;
