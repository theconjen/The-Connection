import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../middleware/auth';
import { storage } from '../../storage-optimized';
import { buildErrorResponse } from '../../utils/errors';
import { getSessionUserId, requireSessionUserId } from '../../utils/session';
import { clearPreferencesCache } from '../../services/notificationHelper';

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

// Get current user with permissions (used by mobile app)
router.get('/', async (req, res, next) => {
  console.error('USER.TS ROUTER / HANDLER EXECUTING');
  try {
    const userId = requireSessionUserId(req);
    console.error('user.ts: userId =', userId);
    if (!userId) {
      return;
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user permissions from user_permissions table
    const { db } = await import('../../db');
    const { userPermissions } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const permissionsResult = await db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    const permissions = permissionsResult.map(p => p.permission);

    console.info('[GET /api/user] User:', userId, user.username);
    console.info('[GET /api/user] Permissions query result:', permissionsResult);
    console.info('[GET /api/user] Permissions array:', permissions);

    // Return user data without sensitive fields, with permissions
    const { password, ...userData } = user;
    res.json({
      ...userData,
      profileImageUrl: user.avatarUrl, // Map avatarUrl to profileImageUrl for mobile app compatibility
      permissions,
    });
  } catch (error) {
    next(error);
  }
});

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
      location, denomination, homeChurch, favoriteBibleVerse, testimony, interests,
      birthday, age
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
    if (birthday !== undefined) {
      // Validate age is 13+ if birthday is provided (COPPA compliance)
      const birthdayDate = new Date(birthday);
      if (!isNaN(birthdayDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthdayDate.getFullYear();
        const monthDiff = today.getMonth() - birthdayDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdayDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 13) {
          return res.status(403).json({
            code: 'AGE_RESTRICTED',
            message: 'You must be 13 or older to use this app.'
          });
        }
      }
      // Map to database field name (dateOfBirth -> date_of_birth column)
      updateData.dateOfBirth = birthday;
    }
    if (age !== undefined) updateData.age = age;
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

// NOTE: /settings routes are handled by userSettingsRoutes.ts which is mounted before this router
// The /:id route below will NOT match "settings" because userSettingsRoutes handles it first

// Alternative endpoint for updating user by ID
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
      location, denomination, homeChurch, favoriteBibleVerse, testimony, interests,
      birthday, age
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
    if (birthday !== undefined) {
      // Validate age is 13+ if birthday is provided (COPPA compliance)
      const birthdayDate = new Date(birthday);
      if (!isNaN(birthdayDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthdayDate.getFullYear();
        const monthDiff = today.getMonth() - birthdayDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdayDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge < 13) {
          return res.status(403).json({
            code: 'AGE_RESTRICTED',
            message: 'You must be 13 or older to use this app.'
          });
        }
      }
      // Map to database field name (dateOfBirth -> date_of_birth column)
      updateData.dateOfBirth = birthday;
    }
    if (age !== undefined) updateData.age = age;
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

    console.info('[Friend Suggestions] Request from user:', userId);

    try {
      const { db } = await import('../../db');
      const { users, userFollows, communityMembers, userBlocks, hiddenSuggestions, communities } = await import('@shared/schema');
      const { eq, and, sql, ne, notIn, isNull, desc, or } = await import('drizzle-orm');

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

      // Get blocked users (both directions) - users I blocked OR users who blocked me
      const blocked = await db
        .select({ blockerId: userBlocks.blockerId, blockedId: userBlocks.blockedId })
        .from(userBlocks)
        .where(
          or(
            eq(userBlocks.blockerId, userId),
            eq(userBlocks.blockedId, userId)
          )
        );
      const blockedIds = [
        ...blocked.filter(b => b.blockerId === userId).map(b => b.blockedId),
        ...blocked.filter(b => b.blockedId === userId).map(b => b.blockerId)
      ];

      console.info('[Friend Suggestions] Blocked users found:', blockedIds.length, blockedIds);

      // Get hidden suggestions
      const hidden = await db
        .select({ hiddenUserId: hiddenSuggestions.hiddenUserId })
        .from(hiddenSuggestions)
        .where(eq(hiddenSuggestions.userId, userId));
      const hiddenIds = hidden.map(h => h.hiddenUserId);

      // Get current user's communities with names
      const userCommunitiesData = await db
        .select({
          communityId: communityMembers.communityId,
          communityName: communities.name
        })
        .from(communityMembers)
        .innerJoin(communities, eq(communityMembers.communityId, communities.id))
        .where(eq(communityMembers.userId, userId));
      const communityIds = userCommunitiesData.map(c => c.communityId);
      const communityNames = new Map(userCommunitiesData.map(c => [c.communityId, c.communityName]));

      // Get total user count for diagnostics
      const totalUsersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(isNull(users.deletedAt));
      const totalUsers = Number(totalUsersResult[0]?.count || 0);

      // Build exclusion list (self, following, blocked, hidden)
      const excludeIds = [userId, ...followingIds, ...blockedIds, ...hiddenIds];

      console.info('[Friend Suggestions] User:', userId, '| Total users in system:', totalUsers);
      console.info('[Friend Suggestions] Exclusions:', {
        following: followingIds.length,
        blocked: blockedIds.length,
        hidden: hiddenIds.length,
        totalExcluded: excludeIds.length,
        remainingPool: totalUsers - excludeIds.length
      });

      // Get candidate users - exclude soft-deleted users (deletedAt IS NOT NULL)
      let whereConditions;
      if (excludeIds.length > 1) {
        whereConditions = and(
          ne(users.id, userId),
          notIn(users.id, excludeIds),
          isNull(users.deletedAt)
        );
      } else {
        whereConditions = and(
          ne(users.id, userId),
          isNull(users.deletedAt)
        );
      }

      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          bio: users.bio,
          city: users.city,
          state: users.state,
          denomination: users.denomination,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereConditions)
        .limit(100);

      console.info('[Friend Suggestions] Found', allUsers.length, 'candidate users after exclusions');

      // Score each user with new weights and caps
      const scoredUsers = await Promise.all(
        allUsers.map(async (user) => {
          let mutualFollowsCount = 0;
          let mutualCommunitiesCount = 0;
          let sharedCommunityName: string | null = null;
          let locationScore = 0;

          try {
            // Calculate mutual follows (capped at 2)
            if (followingIds.length > 0) {
              const mutualFollows = await db
                .select({ count: sql<number>`count(*)` })
                .from(userFollows)
                .where(
                  and(
                    eq(userFollows.followerId, user.id),
                    sql`${userFollows.followingId} IN (SELECT following_id FROM user_follows WHERE follower_id = ${userId})`
                  )
                );
              mutualFollowsCount = Math.min(Number(mutualFollows[0]?.count || 0), 2); // Cap at 2
            }

            // Calculate mutual communities (capped at 2) and get first shared community name
            if (communityIds.length > 0) {
              const mutualCommunities = await db
                .select({ communityId: communityMembers.communityId })
                .from(communityMembers)
                .where(
                  and(
                    eq(communityMembers.userId, user.id),
                    sql`${communityMembers.communityId} IN (${communityIds.join(',')})`
                  )
                );
              mutualCommunitiesCount = Math.min(mutualCommunities.length, 2); // Cap at 2

              // Get first shared community name for display
              if (mutualCommunities.length > 0) {
                sharedCommunityName = communityNames.get(mutualCommunities[0].communityId) || null;
              }
            }

            // Calculate location score (city: 10, state only: 5)
            if (currentUser.city && currentUser.state) {
              if (user.city === currentUser.city && user.state === currentUser.state) {
                locationScore = 10;
              } else if (user.state === currentUser.state) {
                locationScore = 5;
              }
            }
          } catch (scoringError) {
            console.error('[Friend Suggestions] Error scoring user:', user.id, scoringError);
          }

          // New weights: mutualCommunities=20, mutualFollows=15, location as calculated
          const mutualFollowsScore = mutualFollowsCount * 15;
          const mutualCommunitiesScore = mutualCommunitiesCount * 20;
          const totalScore = mutualFollowsScore + mutualCommunitiesScore + locationScore;

          // Determine primary reason for display (priority: community > mutual > location)
          let reason: string | null = null;
          if (sharedCommunityName) {
            reason = `From ${sharedCommunityName}`;
          } else if (mutualFollowsCount > 0) {
            reason = mutualFollowsCount === 1
              ? '1 mutual connection'
              : `${mutualFollowsCount} mutual connections`;
          } else if (locationScore > 0) {
            if (user.city === currentUser.city) {
              reason = `From ${user.city}`;
            } else if (user.state === currentUser.state) {
              reason = `From ${user.state}`;
            }
          }

          return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            city: user.city,
            state: user.state,
            denomination: user.denomination,
            reason,
            suggestionScore: {
              total: totalScore,
              mutualFollows: mutualFollowsScore,
              mutualCommunities: mutualCommunitiesScore,
              location: locationScore,
            },
          };
        })
      );

      // Filter users with score > 0 and sort by score
      const scoredWithPoints = scoredUsers.filter(user => user.suggestionScore.total > 0);
      console.info('[Friend Suggestions] Users with score > 0:', scoredWithPoints.length);

      let suggestions = scoredWithPoints
        .sort((a, b) => b.suggestionScore.total - a.suggestionScore.total)
        .slice(0, limit);

      // Cold start fallback: if no scored suggestions, return newest users
      // Use less restrictive conditions - only exclude self, blocked, and following (not hidden)
      // This ensures new users always see SOME suggestions
      if (suggestions.length === 0) {
        console.info('[Friend Suggestions] Cold start - falling back to newest users');
        console.info('[Friend Suggestions] Following count:', followingIds.length, ', Blocked count:', blockedIds.length);

        // Build fallback exclusion list (only self, following, blocked - NOT hidden)
        const fallbackExcludeIds = [userId, ...followingIds, ...blockedIds];

        let fallbackConditions;
        if (fallbackExcludeIds.length > 1) {
          fallbackConditions = and(
            ne(users.id, userId),
            notIn(users.id, fallbackExcludeIds),
            isNull(users.deletedAt)
          );
        } else {
          fallbackConditions = and(
            ne(users.id, userId),
            isNull(users.deletedAt)
          );
        }

        const fallbackUsers = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            city: users.city,
            state: users.state,
            denomination: users.denomination,
          })
          .from(users)
          .where(fallbackConditions)
          .orderBy(desc(users.createdAt))
          .limit(limit);

        console.info('[Friend Suggestions] Fallback found', fallbackUsers.length, 'users');

        suggestions = fallbackUsers.map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          city: user.city,
          state: user.state,
          denomination: user.denomination,
          reason: 'New member',
          suggestionScore: {
            total: 0,
            mutualFollows: 0,
            mutualCommunities: 0,
            location: 0,
          },
        }));
      }

      console.info('[Friend Suggestions] Returning', suggestions.length, 'suggestions');
      res.json(suggestions);
    } catch (innerError) {
      console.error('[Friend Suggestions] Inner error:', innerError);
      res.json([]);
    }
  } catch (error) {
    console.error('[Friend Suggestions] Outer error:', error);
    res.json([]);
  }
});

// Hide a friend suggestion
router.post('/suggestions/hide', async (req, res, next) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) {
      return;
    }

    const { hiddenUserId } = req.body;
    if (!hiddenUserId || typeof hiddenUserId !== 'number') {
      return res.status(400).json({ message: 'hiddenUserId is required' });
    }

    const { db } = await import('../../db');
    const { hiddenSuggestions } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');

    // Insert with ON CONFLICT DO NOTHING to avoid duplicates
    await db.execute(sql`
      INSERT INTO hidden_suggestions (user_id, hidden_user_id)
      VALUES (${userId}, ${hiddenUserId})
      ON CONFLICT (user_id, hidden_user_id) DO NOTHING
    `);

    console.info('[Friend Suggestions] User', userId, 'hid suggestion', hiddenUserId);
    res.json({ success: true });
  } catch (error) {
    console.error('[Friend Suggestions] Error hiding suggestion:', error);
    res.status(500).json({ message: 'Failed to hide suggestion' });
  }
});

export default router;
