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
    console.log('[PROFILE] Fetching profile for user ID:', userId);

    if (!Number.isFinite(userId)) {
      console.error('[PROFILE] Invalid user ID:', req.params.userId);
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      console.error('[PROFILE] User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('[PROFILE] User found:', user.username);

    // Get user's communities
    const communities = await storage.getUserCommunities(userId);
    console.log('[PROFILE] Communities count:', communities.length);

    // Get user's posts (forum posts)
    const posts = await storage.getUserPosts(userId);
    console.log('[PROFILE] Posts count:', posts.length);

    // Get user's microblogs
    const microblogs = await storage.getUserMicroblogs(userId);
    console.log('[PROFILE] Microblogs count:', microblogs.length);

    // Get follower/following counts
    const followers = await storage.getUserFollowers(userId);
    const following = await storage.getUserFollowing(userId);
    console.log('[PROFILE] Followers:', followers.length, 'Following:', following.length);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
      },
      stats: {
        followersCount: followers.length,
        followingCount: following.length,
        communitiesCount: communities.length,
        postsCount: posts.length,
        microblogsCount: microblogs.length,
      },
      communities: communities.slice(0, 6), // Show first 6
      recentPosts: posts.slice(0, 10), // Show recent 10
      recentMicroblogs: microblogs.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json(buildErrorResponse('Error fetching user profile', error));
  }
});

export default router;
