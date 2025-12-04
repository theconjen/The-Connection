import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { isAuthenticated } from '../../auth';
import { storage } from '../../storage-optimized';
import { buildErrorResponse } from '../../utils/errors';
import { getSessionUserId } from '../../utils/session';

const router = Router();

const allowedVisibilities = ["public", "friends", "private"] as const;
const isValidVisibility = (value: unknown): value is (typeof allowedVisibilities)[number] =>
  typeof value === "string" && (allowedVisibilities as readonly string[]).includes(value);

const requireAuthedUserId = (req: Request, res: Response): number | undefined => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return undefined;
  }
  return userId;
};

// Apply authentication middleware to all routes in this file
router.use(isAuthenticated);

// Get current user's profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = requireAuthedUserId(req, res);
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
    const userId = requireAuthedUserId(req, res);
    if (!userId) {
      return;
    }
    
    const { displayName, bio, avatarUrl, email, city, state, zipCode, profileVisibility, showLocation, showInterests } = req.body;
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
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
    
    const updatedUser = await storage.updateUser(userId, updateData);
    
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
    const userId = requireAuthedUserId(req, res);
    if (!userId) {
      return;
    }

    const targetUserId = parseInt(req.params.id);
    if (!Number.isFinite(targetUserId) || targetUserId !== userId) {
      return res.status(401).json({ message: 'Not authorized to update this profile' });
    }
    
    const { displayName, bio, avatarUrl, email, city, state, zipCode, profileVisibility, showLocation, showInterests } = req.body;
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (email !== undefined) updateData.email = email;
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
    const userId = requireAuthedUserId(req, res);
    if (!userId) {
      return;
    }
    
    // Get communities where user is a member
    const communities = await storage.getUserCommunities(userId);
    res.json(communities);
  } catch (error) {
    next(error);
  }
});

// Get user's prayer requests
router.get('/prayer-requests', async (req, res, next) => {
  try {
    const userId = requireAuthedUserId(req, res);
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
    const userId = requireAuthedUserId(req, res);
    if (!userId) {
      return;
    }
    
    // Get user's posts
    const posts = await storage.getUserPosts(userId);
    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// Get user's upcoming events (RSVPs)
router.get('/events', async (req, res, next) => {
  try {
    const userId = requireAuthedUserId(req, res);
    if (!userId) {
      return;
    }
    
    // Get user's event RSVPs
    const events = await storage.getUserEvents(userId);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// User settings endpoints using your approach
router.get("/settings", async (req, res) => {
  try {
    const userId = requireAuthedUserId(req, res);
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
    const userId = requireAuthedUserId(req, res);
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
    const userId = requireAuthedUserId(req, res);
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

export default router;
