import { Router } from 'express';
import { isAdmin } from '../../auth';
import { storage } from '../../storage-optimized';
import { getSessionUserId } from '../../utils/session';
import { runVerificationCleanupOnce } from '../../lib/verificationCleanup';
import { db } from '../../db';
import {
  users,
  userPermissions,
  apologistProfiles,
  apologistExpertise,
  qaAreas,
  qaTags
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Apply admin middleware to all routes in this file
router.use(isAdmin);

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get all livestreamer applications
router.get('/applications/livestreamer', async (req, res, next) => {
  try {
    const applications = await storage.getAllLivestreamerApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get apologist scholar applications
router.get('/apologist-scholar-applications', async (req, res, next) => {
  try {
    const applications = await storage.getAllApologistScholarApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get livestreamer application statistics
router.get('/livestreamer-applications/stats', async (req, res, next) => {
  try {
    const stats = await storage.getLivestreamerApplicationStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Update livestreamer application status
router.patch('/applications/livestreamer/:id', async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const applicationId = parseInt(req.params.id);
    
    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }
    
    const updatedApplication = await storage.updateLivestreamerApplicationStatus(
      applicationId,
      status,
      reviewNotes
    );
    
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
});

// Delete user (for admin use only)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Don't allow admins to delete themselves
    const currentUserId = getSessionUserId(req);
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    await storage.deleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Admin endpoint: trigger verification cleanup on demand
router.post('/verification-cleanup', async (req, res, next) => {
  try {
    await runVerificationCleanupOnce();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// APOLOGIST MANAGEMENT
// ============================================================================

/**
 * GET /admin/qa/areas
 * List all Q&A areas and tags for reference
 */
router.get('/qa/areas', async (req, res, next) => {
  try {
    const areas = await db.select().from(qaAreas);
    const tags = await db.select().from(qaTags);

    const areasWithTags = areas.map(area => ({
      ...area,
      tags: tags.filter(t => t.areaId === area.id)
    }));

    res.json(areasWithTags);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/apologists
 * List all apologists with their profiles and expertise
 */
router.get('/apologists', async (req, res, next) => {
  try {
    // Get all users with inbox_access permission
    const apologists = await db
      .select({
        user: users,
        profile: apologistProfiles,
      })
      .from(userPermissions)
      .innerJoin(users, eq(userPermissions.userId, users.id))
      .leftJoin(apologistProfiles, eq(userPermissions.userId, apologistProfiles.userId))
      .where(eq(userPermissions.permission, 'inbox_access'));

    // Get expertise for each apologist
    const result = await Promise.all(
      apologists.map(async ({ user, profile }) => {
        const expertise = await db
          .select({
            id: apologistExpertise.id,
            areaId: apologistExpertise.areaId,
            tagId: apologistExpertise.tagId,
            level: apologistExpertise.level,
            areaName: qaAreas.name,
            tagName: qaTags.name,
          })
          .from(apologistExpertise)
          .leftJoin(qaAreas, eq(apologistExpertise.areaId, qaAreas.id))
          .leftJoin(qaTags, eq(apologistExpertise.tagId, qaTags.id))
          .where(eq(apologistExpertise.userId, user.id));

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          profile: profile ? {
            title: profile.title,
            credentialsShort: profile.credentialsShort,
            inboxEnabled: profile.inboxEnabled,
            verificationStatus: profile.verificationStatus,
          } : null,
          expertise: expertise.map(e => ({
            id: e.id,
            areaId: e.areaId,
            areaName: e.areaName,
            tagId: e.tagId,
            tagName: e.tagName,
            level: e.level,
          })),
        };
      })
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/apologists/:userId/setup
 * Setup a user as an apologist (grant permission, create profile, enable inbox)
 */
router.post('/apologists/:userId/setup', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const adminId = getSessionUserId(req);

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Grant inbox_access permission if not exists
    const existingPermission = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permission, 'inbox_access')
      ));

    if (existingPermission.length === 0) {
      await db.insert(userPermissions).values({
        userId,
        permission: 'inbox_access',
        grantedBy: adminId,
        grantedAt: new Date(),
      } as any);
    }

    // Create or update apologist profile
    const existingProfile = await db
      .select()
      .from(apologistProfiles)
      .where(eq(apologistProfiles.userId, userId));

    let profile;
    if (existingProfile.length === 0) {
      const [newProfile] = await db.insert(apologistProfiles).values({
        userId,
        inboxEnabled: true,
      } as any).returning();
      profile = newProfile;
    } else if (!existingProfile[0].inboxEnabled) {
      const [updatedProfile] = await db
        .update(apologistProfiles)
        .set({ inboxEnabled: true })
        .where(eq(apologistProfiles.userId, userId))
        .returning();
      profile = updatedProfile;
    } else {
      profile = existingProfile[0];
    }

    res.json({
      message: 'Apologist setup complete',
      user: {
        id: user[0].id,
        username: user[0].username,
        displayName: user[0].displayName,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/apologists/:userId/expertise
 * Get expertise for a specific apologist
 */
router.get('/apologists/:userId/expertise', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const expertise = await db
      .select({
        id: apologistExpertise.id,
        areaId: apologistExpertise.areaId,
        tagId: apologistExpertise.tagId,
        level: apologistExpertise.level,
        areaName: qaAreas.name,
        areaDomain: qaAreas.domain,
        tagName: qaTags.name,
      })
      .from(apologistExpertise)
      .leftJoin(qaAreas, eq(apologistExpertise.areaId, qaAreas.id))
      .leftJoin(qaTags, eq(apologistExpertise.tagId, qaTags.id))
      .where(eq(apologistExpertise.userId, userId));

    res.json(expertise);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/apologists/:userId/expertise
 * Add expertise to an apologist
 * Body: { areaId: number, tagId?: number, level: 'primary' | 'secondary' }
 */
router.post('/apologists/:userId/expertise', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { areaId, tagId, level = 'primary' } = req.body;

    if (!areaId || typeof areaId !== 'number') {
      return res.status(400).json({ error: 'areaId is required and must be a number' });
    }

    if (level !== 'primary' && level !== 'secondary') {
      return res.status(400).json({ error: 'level must be "primary" or "secondary"' });
    }

    // Verify area exists
    const area = await db.select().from(qaAreas).where(eq(qaAreas.id, areaId));
    if (area.length === 0) {
      return res.status(404).json({ error: 'Area not found' });
    }

    // Verify tag exists if provided
    if (tagId) {
      const tag = await db.select().from(qaTags).where(eq(qaTags.id, tagId));
      if (tag.length === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }
    }

    // Check if expertise already exists
    const existing = await db
      .select()
      .from(apologistExpertise)
      .where(and(
        eq(apologistExpertise.userId, userId),
        eq(apologistExpertise.areaId, areaId),
        tagId ? eq(apologistExpertise.tagId, tagId) : eq(apologistExpertise.tagId, null as any)
      ));

    let result;
    if (existing.length > 0) {
      // Update level if different
      [result] = await db
        .update(apologistExpertise)
        .set({ level })
        .where(eq(apologistExpertise.id, existing[0].id))
        .returning();
    } else {
      // Create new expertise
      [result] = await db.insert(apologistExpertise).values({
        userId,
        areaId,
        tagId: tagId || null,
        level,
      } as any).returning();
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /admin/apologists/:userId/expertise/:expertiseId
 * Remove expertise from an apologist
 */
router.delete('/apologists/:userId/expertise/:expertiseId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const expertiseId = parseInt(req.params.expertiseId);

    if (isNaN(userId) || isNaN(expertiseId)) {
      return res.status(400).json({ error: 'Invalid user ID or expertise ID' });
    }

    // Verify the expertise belongs to this user
    const existing = await db
      .select()
      .from(apologistExpertise)
      .where(and(
        eq(apologistExpertise.id, expertiseId),
        eq(apologistExpertise.userId, userId)
      ));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expertise not found' });
    }

    await db
      .delete(apologistExpertise)
      .where(eq(apologistExpertise.id, expertiseId));

    res.json({ message: 'Expertise removed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /admin/apologists/:userId/profile
 * Update apologist profile (title, credentials, inbox enabled)
 */
router.patch('/apologists/:userId/profile', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { title, credentialsShort, bioLong, inboxEnabled } = req.body;

    const existing = await db
      .select()
      .from(apologistProfiles)
      .where(eq(apologistProfiles.userId, userId));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Apologist profile not found. Run setup first.' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (credentialsShort !== undefined) updateData.credentialsShort = credentialsShort;
    if (bioLong !== undefined) updateData.bioLong = bioLong;
    if (inboxEnabled !== undefined) updateData.inboxEnabled = inboxEnabled;

    const [result] = await db
      .update(apologistProfiles)
      .set(updateData)
      .where(eq(apologistProfiles.userId, userId))
      .returning();

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN USER MANAGEMENT
// ============================================================================

/**
 * GET /admin/admin-users
 * Get all users who are admins, moderators, or have elevated permissions
 */
router.get('/admin-users', async (req, res, next) => {
  try {
    const adminUsers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.isAdmin, true));

    // Transform to include role info
    const result = adminUsers.map(user => ({
      id: user.id,
      name: user.displayName || user.username,
      email: user.email,
      role: 'admin' as const,
      lastActive: user.lastLoginAt
        ? new Date(user.lastLoginAt).toISOString()
        : 'Never',
      isAdmin: user.isAdmin,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /admin/users/:id/role
 * Update a user's admin status
 */
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { isAdmin: newAdminStatus } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (typeof newAdminStatus !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin must be a boolean' });
    }

    // Don't allow admins to demote themselves
    const currentUserId = getSessionUserId(req);
    if (userId === currentUserId && !newAdminStatus) {
      return res.status(400).json({ error: 'You cannot remove your own admin status' });
    }

    // Update user's admin status
    const [updated] = await db
      .update(users)
      .set({ isAdmin: newAdminStatus })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: newAdminStatus ? 'User promoted to admin' : 'Admin privileges removed',
      user: {
        id: updated.id,
        username: updated.username,
        isAdmin: updated.isAdmin,
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/invite
 * Invite a new admin user (creates account or promotes existing)
 */
router.post('/invite', async (req, res, next) => {
  try {
    const { email, name, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      // User exists - promote to admin
      const [updated] = await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.email, email))
        .returning();

      return res.json({
        message: 'Existing user promoted to admin',
        user: {
          id: updated.id,
          email: updated.email,
          isAdmin: updated.isAdmin,
        }
      });
    }

    // User doesn't exist - return info for invitation
    // In a real system, you'd send an invitation email here
    res.json({
      message: 'Invitation would be sent to ' + email,
      note: 'User must register first, then can be promoted to admin',
      email,
      name,
      role,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
