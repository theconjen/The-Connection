import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Follow a user
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

    // Check if user exists
    const userToFollow = await storage.getUser(followingId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    const existingFollow = await storage.getUserFollow(followerId, followingId);
    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Create follow relationship
    await storage.createUserFollow({ followerId, followingId });

    res.json({
      success: true,
      message: 'Successfully followed user',
      isFollowing: true,
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json(buildErrorResponse('Error following user', error));
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

// Check if current user is following another user
router.get('/users/:userId/follow-status', requireAuth, async (req, res) => {
  try {
    const currentUserId = requireSessionUserId(req);
    const targetUserId = parseInt(req.params.userId);

    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const isFollowing = await storage.isUserFollowing(currentUserId, targetUserId);

    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json(buildErrorResponse('Error checking follow status', error));
  }
});

// Get user profile with stats
router.get('/users/:userId/profile', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);


    if (!Number.isFinite(userId)) {
      console.error('[PROFILE] Invalid user ID:', req.params.userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      console.error('[PROFILE] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.info('[GET /users/:userId/profile] User from DB:', {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      location: user.location,
      denomination: user.denomination,
      homeChurch: user.homeChurch,
      favoriteBibleVerse: user.favoriteBibleVerse,
      testimony: user.testimony,
      interests: user.interests,
    });

    // Get user's communities (for display, not just count)
    let communities = [];
    try {
      communities = await storage.getUserCommunities(userId);
    } catch (error) {
      console.error('[PROFILE] Error fetching communities:', error);
    }

    // Get user's recent posts (forum posts)
    let posts = [];
    try {
      const allPosts = await storage.getUserPosts(userId);
      posts = allPosts.slice(0, 10); // Only get recent 10
    } catch (error) {
      console.error('[PROFILE] Error fetching posts:', error);
    }

    // Get user's recent microblogs
    let microblogs = [];
    try {
      const allMicroblogs = await storage.getUserMicroblogs(userId);
      microblogs = allMicroblogs.slice(0, 10); // Only get recent 10
    } catch (error) {
      console.error('[PROFILE] Error fetching microblogs:', error);
    }

    // Use efficient COUNT queries for stats
    const { db } = await import('../db');
    const { userFollows, posts: postsTable, microblogs: microblogsTable } = await import('@shared/schema');
    const { eq, sql } = await import('drizzle-orm');

    let followersCount = 0;
    let followingCount = 0;
    let postsCount = 0;
    let microblogsCount = 0;

    try {
      // Get followers count (users who follow this user)
      const followersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userFollows)
        .where(eq(userFollows.followingId, userId));
      followersCount = Number(followersResult[0]?.count || 0);

      // Get following count (users this user follows)
      const followingResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userFollows)
        .where(eq(userFollows.followerId, userId));
      followingCount = Number(followingResult[0]?.count || 0);

      // Get posts count (forum posts)
      const postsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(postsTable)
        .where(eq(postsTable.userId, userId));
      postsCount = Number(postsResult[0]?.count || 0);

      // Get microblogs count (feed posts)
      const microblogsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(microblogsTable)
        .where(eq(microblogsTable.userId, userId));
      microblogsCount = Number(microblogsResult[0]?.count || 0);
    } catch (error) {
      console.error('[PROFILE] Error fetching stats:', error);
    }

    // Total posts = forum posts + microblogs
    const totalPosts = postsCount + microblogsCount;

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
        createdAt: user.createdAt,
      },
      stats: {
        followersCount,
        followingCount,
        communitiesCount: communities.length,
        postsCount: totalPosts, // Total of forum posts + microblogs
        forumPostsCount: postsCount,
        feedPostsCount: microblogsCount,
      },
      communities: communities.slice(0, 6), // Show first 6
      recentPosts: posts,
      recentMicroblogs: microblogs,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json(buildErrorResponse('Error fetching user profile', error));
  }
});

export default router;
