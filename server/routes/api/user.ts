import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../middleware/auth';
import { storage } from '../../storage-optimized';
import { buildErrorResponse } from '../../utils/errors';
import { getSessionUserId, requireSessionUserId } from '../../utils/session';

const router = Router();

const allowedVisibilities = ["public", "friends", "private"] as const;
const isValidVisibility = (value: unknown): value is (typeof allowedVisibilities)[number] =>
  typeof value === "string" && (allowedVisibilities as readonly string[]).includes(value);

const normalizeUserIdValue = (raw: unknown): number | undefined => {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const parsed = parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const filterItemsByUserId = <T>(items: T[], userId: number): T[] =>
  items.filter((item) => {
    const ownerId = normalizeUserIdValue((item as any).userId ?? (item as any).authorId);
    return ownerId === userId;
  });

// Apply authentication middleware to all routes in this file
router.use(requireAuth);

// Get current user's profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Update user profile
// Update user profile - supports both /profile and /:id endpoints
router.patch('/profile', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }


    const {
      displayName, bio, avatarUrl, email, city, state, zipCode,
      profileVisibility, showLocation, showInterests,
      location, denomination, homeChurch, favoriteBibleVerse, testimony, interests
    } = req.body;

    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (location !== undefined) updateData.location = location;
    if (denomination !== undefined) updateData.denomination = denomination;
    if (homeChurch !== undefined) updateData.homeChurch = homeChurch;
    if (favoriteBibleVerse !== undefined) updateData.favoriteBibleVerse = favoriteBibleVerse;
    if (testimony !== undefined) updateData.testimony = testimony;
    if (interests !== undefined) updateData.interests = interests;
    if (profileVisibility !== undefined) {
      if (!isValidVisibility(profileVisibility)) {
        return res.status(400).json({ message: "Invalid profile visibility option" });
      }
      updateData.profileVisibility = profileVisibility;
    }
    if (typeof showLocation === "boolean") updateData.showLocation = showLocation;
    if (typeof showInterests === "boolean") updateData.showInterests = showInterests;


    const updatedUser = await storage.updateUser(userId, updateData);

    console.info('[PATCH /user/profile] Updated user from DB:', {
      id: updatedUser.id,
      displayName: updatedUser.displayName,
      location: updatedUser.location,
      denomination: updatedUser.denomination,
      homeChurch: updatedUser.homeChurch,
      favoriteBibleVerse: updatedUser.favoriteBibleVerse,
      testimony: updatedUser.testimony,
      interests: updatedUser.interests,
    });

    // Return updated user data without sensitive fields
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Alternative endpoint for updating user by ID (same functionality)
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const targetUserId = parseInt(req.params.id);
    if (!Number.isFinite(targetUserId) || targetUserId !== userId) {
      return res.status(401).json({ message: 'Not authorized to update this profile' });
    }
    
    const {
      displayName, bio, avatarUrl, email, city, state, zipCode,
      profileVisibility, showLocation, showInterests,
      location, denomination, homeChurch, favoriteBibleVerse, testimony, interests
    } = req.body;

    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (location !== undefined) updateData.location = location;
    if (denomination !== undefined) updateData.denomination = denomination;
    if (homeChurch !== undefined) updateData.homeChurch = homeChurch;
    if (favoriteBibleVerse !== undefined) updateData.favoriteBibleVerse = favoriteBibleVerse;
    if (testimony !== undefined) updateData.testimony = testimony;
    if (interests !== undefined) updateData.interests = interests;
    if (profileVisibility !== undefined) {
      if (!isValidVisibility(profileVisibility)) {
        return res.status(400).json({ message: "Invalid profile visibility option" });
      }
      updateData.profileVisibility = profileVisibility;
    }
    if (typeof showLocation === "boolean") updateData.showLocation = showLocation;
    if (typeof showInterests === "boolean") updateData.showInterests = showInterests;
    
    const updatedUser = await storage.updateUser(targetUserId, updateData);
    
    // Return updated user data without sensitive fields
    const { password, ...userData } = updatedUser;
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Get communities the user is a member of
router.get('/communities', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    // Get communities where user is a member
    const communities = await storage.getUserCommunities(userId);
    res.json(filterItemsByUserId(communities, userId));
  } catch (error) {
    next(error);
  }
});

// Get user's prayer requests
router.get('/prayer-requests', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const prayerRequests = await storage.getUserPrayerRequests(userId);
    res.json(prayerRequests);
  } catch (error) {
    next(error);
  }
});

// Get user's feed posts
router.get('/posts', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    // Get user's posts
    const posts = await storage.getUserPosts(userId);
    res.json(filterItemsByUserId(posts, userId));
  } catch (error) {
    next(error);
  }
});

// Get user's upcoming events (RSVPs)
router.get('/events', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    // Get user's event RSVPs
    const events = await storage.getUserEvents(userId);
    res.json(filterItemsByUserId(events, userId));
  } catch (error) {
    next(error);
  }
});

// User settings endpoints using your approach
router.get("/settings", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error fetching user settings', error));
  }
});

// Update user settings using your approach
router.put("/settings", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const {
      displayName, email, bio, city, state, zipCode,
      profileVisibility, showLocation, showInterests,
      notifyDms, notifyCommunities, notifyForums, notifyFeed
    } = req.body;

    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (profileVisibility !== undefined) {
      if (!isValidVisibility(profileVisibility)) {
        return res.status(400).json({ message: "Invalid profile visibility option" });
      }
      updateData.profileVisibility = profileVisibility;
    }
    if (typeof showLocation === "boolean") updateData.showLocation = showLocation;
    if (typeof showInterests === "boolean") updateData.showInterests = showInterests;
    if (typeof notifyDms === "boolean") updateData.notifyDms = notifyDms;
    if (typeof notifyCommunities === "boolean") updateData.notifyCommunities = notifyCommunities;
    if (typeof notifyForums === "boolean") updateData.notifyForums = notifyForums;
    if (typeof notifyFeed === "boolean") updateData.notifyFeed = notifyFeed;

    await storage.updateUser(userId, updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error updating user settings', error));
  }
});

// Change password endpoint
router.post("/change-password", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Validate new password strength
    if (newPassword.length < 12) {
      return res.status(400).json({ message: 'New password must be at least 12 characters long' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one lowercase letter' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one number' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one special character' });
    }

    // Get user (includes password when available)
    const user = await storage.getUser(userId);
    if (!user || !user.password) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await storage.updateUser(userId, { password: hashedPassword });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json(buildErrorResponse('Error changing password', error));
  }
});

// Delete account endpoint (required by Apple App Store)
router.delete("/account", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const { password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete your account' });
    }

    // Get user (includes password when available)
    const user = await storage.getUser(userId);
    if (!user || !user.password) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Delete user and all related data
    const deleted = await storage.deleteUser(userId);

    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete account' });
    }

    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session after account deletion:', err);
      }
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json(buildErrorResponse('Error deleting account', error));
  }
});

// Get user stats (followers, following, posts count)
router.get('/:id/stats', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id);
    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const { db } = await import('../../db');
    const { userFollows, posts, microblogs } = await import('@shared/schema');
    const { eq, and, sql } = await import('drizzle-orm');

    // Get followers count (users who follow this user)
    const followersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followingId, targetUserId));
    const followersCount = Number(followersResult[0]?.count || 0);

    // Get following count (users this user follows)
    const followingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followerId, targetUserId));
    const followingCount = Number(followingResult[0]?.count || 0);

    // Get posts count (forum posts)
    const postsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.userId, targetUserId));
    const postsCount = Number(postsResult[0]?.count || 0);

    // Get microblogs count (feed posts)
    const microblogsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(microblogs)
      .where(eq(microblogs.userId, targetUserId));
    const microblogsCount = Number(microblogsResult[0]?.count || 0);

    // Total posts = forum posts + microblogs
    const totalPosts = postsCount + microblogsCount;

    res.json({
      followersCount,
      followingCount,
      postsCount: totalPosts,
      forumPostsCount: postsCount,
      feedPostsCount: microblogsCount,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    next(error);
  }
});

// Get friend suggestions based on mutual friends, communities, and location
router.get('/suggestions/friends', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const { db } = await import('../../db');
    const { users, userFollows, communityMembers, userBlocks } = await import('@shared/schema');
    const { eq, and, sql, ne, notInArray, inArray } = await import('drizzle-orm');

    // Get current user's data
    const currentUser = await storage.getUser(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get users the current user is already following
    const following = await db
      .select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));
    const followingIds = following.map(f => f.followingId);

    // Get users who have blocked current user or current user has blocked
    const blocked = await db
      .select({ userId: userBlocks.userId, blockedUserId: userBlocks.blockedUserId })
      .from(userBlocks)
      .where(
        sql`${userBlocks.userId} = ${userId} OR ${userBlocks.blockedUserId} = ${userId}`
      );
    const blockedIds = [
      ...blocked.filter(b => b.userId === userId).map(b => b.blockedUserId),
      ...blocked.filter(b => b.blockedUserId === userId).map(b => b.userId)
    ];

    // Get current user's communities
    const userCommunities = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));
    const communityIds = userCommunities.map(c => c.communityId);

    // Build exclusion list: self, already following, blocked users
    const excludeIds = [userId, ...followingIds, ...blockedIds];

    // Query to find suggested friends with scoring
    const suggestions = await db.execute(sql`
      WITH candidate_users AS (
        SELECT DISTINCT u.id
        FROM ${users} u
        WHERE u.id != ${userId}
          AND u.id NOT IN (${sql.join(excludeIds.length > 0 ? excludeIds : [-1], sql`, `)})
          AND u.profile_visibility != 'private'
      ),
      mutual_follows AS (
        SELECT
          cu.id as user_id,
          COUNT(DISTINCT uf1.following_id) as mutual_count
        FROM candidate_users cu
        LEFT JOIN ${userFollows} uf1 ON uf1.follower_id = cu.id
        LEFT JOIN ${userFollows} uf2 ON uf2.follower_id = ${userId} AND uf2.following_id = uf1.following_id
        WHERE uf2.following_id IS NOT NULL
        GROUP BY cu.id
      ),
      mutual_communities AS (
        SELECT
          cu.id as user_id,
          COUNT(DISTINCT cm1.community_id) as community_count
        FROM candidate_users cu
        LEFT JOIN ${communityMembers} cm1 ON cm1.user_id = cu.id
        WHERE cm1.community_id IN (${sql.join(communityIds.length > 0 ? communityIds : [-1], sql`, `)})
        GROUP BY cu.id
      ),
      location_matches AS (
        SELECT
          cu.id as user_id,
          CASE
            WHEN u.city = ${currentUser.city} AND u.state = ${currentUser.state} THEN 20
            WHEN u.state = ${currentUser.state} THEN 10
            ELSE 0
          END as location_score
        FROM candidate_users cu
        JOIN ${users} u ON u.id = cu.id
      ),
      scored_suggestions AS (
        SELECT
          cu.id,
          COALESCE(mf.mutual_count, 0) * 15 as mutual_follows_score,
          COALESCE(mc.community_count, 0) * 10 as community_score,
          COALESCE(lm.location_score, 0) as location_score,
          (COALESCE(mf.mutual_count, 0) * 15 +
           COALESCE(mc.community_count, 0) * 10 +
           COALESCE(lm.location_score, 0)) as total_score
        FROM candidate_users cu
        LEFT JOIN mutual_follows mf ON mf.user_id = cu.id
        LEFT JOIN mutual_communities mc ON mc.user_id = cu.id
        LEFT JOIN location_matches lm ON lm.user_id = cu.id
        WHERE (COALESCE(mf.mutual_count, 0) + COALESCE(mc.community_count, 0) + COALESCE(lm.location_score, 0)) > 0
      )
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.city,
        u.state,
        u.denomination,
        ss.total_score,
        ss.mutual_follows_score,
        ss.community_score,
        ss.location_score
      FROM scored_suggestions ss
      JOIN ${users} u ON u.id = ss.id
      ORDER BY ss.total_score DESC
      LIMIT ${limit}
    `);

    // Format results
    const formattedSuggestions = suggestions.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      city: row.city,
      state: row.state,
      denomination: row.denomination,
      suggestionScore: {
        total: row.total_score,
        mutualFollows: row.mutual_follows_score,
        mutualCommunities: row.community_score,
        location: row.location_score,
      },
    }));

    res.json(formattedSuggestions);
  } catch (error) {
    console.error('Error fetching friend suggestions:', error);
    next(error);
  }
});

export default router;
