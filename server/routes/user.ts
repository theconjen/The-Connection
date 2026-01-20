import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { isAuthenticated } from '../auth';
import { requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Get current user with permissions
router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user permissions from user_permissions table
    const { userPermissions } = await import('@shared/schema');
    const permissionsResult = await db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    const permissions = permissionsResult.map(p => p.permission);

    res.json({
      ...user,
      permissions,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update profile visibility
router.patch('/profile-visibility', isAuthenticated, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const { visibility } = req.body;

    // Validate input
    if (!visibility || !['public', 'private'].includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility value. Must be "public" or "private"' });
    }

    // Check if user is suspended (optional - could be done in middleware)
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if ((currentUser as any).isSuspended) {
      return res.status(403).json({ message: 'Account is suspended' });
    }

    // Update the profile visibility
    const result = await db
      .update(users)
      .set({ profileVisibility: visibility })
      .where(eq(users.id, userId))
      .returning();

    if (!result || result.length === 0) {
      console.error(`Failed to update user ${userId} - update returned no rows`);
      return res.status(500).json({ message: 'Failed to update profile visibility' });
    }

    res.json({ ok: true, message: 'Profile visibility updated', visibility });
  } catch (error: any) {
    console.error('Error updating profile visibility:', error);
    const errorMessage = error?.message || 'Failed to update privacy setting';
    res.status(500).json({ message: errorMessage });
  }
});

export default router;
