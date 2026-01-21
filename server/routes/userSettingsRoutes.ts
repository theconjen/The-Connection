import express from "express";
import { storage } from "../storage";
import { buildErrorResponse } from "../utils/errors";
import { requireAuth } from "../middleware/auth";
import { requireSessionUserId } from "../utils/session";
import { clearPreferencesCache } from "../services/notificationHelper";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Fetch user settings
router.get("/settings", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without sensitive fields
    const { password, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json(buildErrorResponse('Error fetching user settings', error));
  }
});

// Update user settings
router.put("/settings", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    const {
      displayName,
      email,
      bio,
      city,
      state,
      zipCode,
      profileVisibility,
      showLocation,
      showInterests,
      notifyDms,
      notifyCommunities,
      notifyForums,
      notifyFeed,
      dateOfBirth,
    } = req.body;

    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (typeof showLocation === 'boolean') updateData.showLocation = showLocation;
    if (typeof showInterests === 'boolean') updateData.showInterests = showInterests;
    if (typeof notifyDms === 'boolean') updateData.notifyDms = notifyDms;
    if (typeof notifyCommunities === 'boolean') updateData.notifyCommunities = notifyCommunities;
    if (typeof notifyForums === 'boolean') updateData.notifyForums = notifyForums;
    if (typeof notifyFeed === 'boolean') updateData.notifyFeed = notifyFeed;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    await storage.updateUser(userId, updateData);

    // Clear notification preferences cache if any notification settings were updated
    const notificationPrefsUpdated =
      typeof notifyDms === 'boolean' ||
      typeof notifyCommunities === 'boolean' ||
      typeof notifyForums === 'boolean' ||
      typeof notifyFeed === 'boolean';

    if (notificationPrefsUpdated) {
      clearPreferencesCache(userId);
      console.info(`[Settings] Cleared notification preferences cache for user ${userId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json(buildErrorResponse('Error updating user settings', error));
  }
});

// PATCH user settings (partial update)
router.patch("/settings", async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    const {
      displayName,
      email,
      bio,
      city,
      state,
      zipCode,
      profileVisibility,
      showLocation,
      showInterests,
      notifyDms,
      notifyCommunities,
      notifyForums,
      notifyFeed,
      dateOfBirth,
    } = req.body;

    // Only allow updating specific fields
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (typeof showLocation === 'boolean') updateData.showLocation = showLocation;
    if (typeof showInterests === 'boolean') updateData.showInterests = showInterests;
    if (typeof notifyDms === 'boolean') updateData.notifyDms = notifyDms;
    if (typeof notifyCommunities === 'boolean') updateData.notifyCommunities = notifyCommunities;
    if (typeof notifyForums === 'boolean') updateData.notifyForums = notifyForums;
    if (typeof notifyFeed === 'boolean') updateData.notifyFeed = notifyFeed;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    await storage.updateUser(userId, updateData);

    // Clear notification preferences cache if any notification settings were updated
    const notificationPrefsUpdated =
      typeof notifyDms === 'boolean' ||
      typeof notifyCommunities === 'boolean' ||
      typeof notifyForums === 'boolean' ||
      typeof notifyFeed === 'boolean';

    if (notificationPrefsUpdated) {
      clearPreferencesCache(userId);
      console.info(`[Settings] Cleared notification preferences cache for user ${userId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json(buildErrorResponse('Error updating user settings', error));
  }
});

export default router;
