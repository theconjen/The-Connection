/**
 * /api/me endpoint
 * Single source of truth for user capabilities and permissions
 * Used by both mobile and web apps to gate UI features
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

/**
 * GET /api/me
 * Returns authenticated user info, permissions, and computed capabilities
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    // Get user info
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user permissions
    const userPermissions = await storage.getUserPermissions(userId);
    const permissionStrings = userPermissions.map(p => p.permission);

    // Compute capabilities
    const inboxAccess =
      permissionStrings.includes('inbox_access') ||
      user.id === 19;

    const canAuthorApologeticsPosts =
      user.role === 'admin' ||
      user.isVerifiedApologeticsAnswerer ||
      permissionStrings.includes('apologetics_post_access') ||
      user.id === 19;

    // Return response matching MeResponse type from shared/api/types.ts
    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        profileImageUrl: user.profileImageUrl,
        role: user.role || 'member',
        isVerifiedApologeticsAnswerer: user.isVerifiedApologeticsAnswerer || false,
      },
      permissions: permissionStrings,
      capabilities: {
        inboxAccess,
        canAuthorApologeticsPosts,
      },
    });
  } catch (error) {
    console.error('Error fetching /api/me:', error);
    res.status(500).json(buildErrorResponse('Error fetching user info', error));
  }
});

export default router;
