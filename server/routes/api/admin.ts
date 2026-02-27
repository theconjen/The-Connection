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
  qaTags,
  communities,
  communityMembers,
  microblogs,
  events,
  prayerRequests,
  messages,
  platformSettings,
  apologeticsResources,
  sentryAlerts
} from '@shared/schema';
import { eq, and, count, gte, sql, desc } from 'drizzle-orm';

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

// ============================================================================
// PLATFORM STATISTICS
// ============================================================================

/**
 * GET /admin/platform-stats
 * Get platform-wide statistics for analytics dashboard
 */
router.get('/platform-stats', async (req, res, next) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User stats
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [newUsersWeek] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, oneWeekAgo));
    const [newUsersMonth] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, oneMonthAgo));

    // Community stats
    const [totalCommunities] = await db.select({ count: count() }).from(communities);
    const [totalMemberships] = await db.select({ count: count() }).from(communityMembers);

    // Content stats
    const [totalMicroblogs] = await db.select({ count: count() }).from(microblogs);
    const [totalEvents] = await db.select({ count: count() }).from(events);
    const [totalPrayers] = await db.select({ count: count() }).from(prayerRequests);

    // Engagement stats
    const [messagesWeek] = await db.select({ count: count() }).from(messages).where(gte(messages.createdAt, oneWeekAgo));
    const [eventsMonth] = await db.select({ count: count() }).from(events).where(gte(events.createdAt, oneMonthAgo));

    res.json({
      users: {
        total: totalUsers?.count || 0,
        newThisWeek: newUsersWeek?.count || 0,
        newThisMonth: newUsersMonth?.count || 0,
        active: newUsersWeek?.count || 0, // Approximation
      },
      communities: {
        total: totalCommunities?.count || 0,
        members: totalMemberships?.count || 0,
      },
      content: {
        microblogs: totalMicroblogs?.count || 0,
        events: totalEvents?.count || 0,
        prayerRequests: totalPrayers?.count || 0,
        apologeticsArticles: 0, // Would need library posts table
      },
      engagement: {
        messagesThisWeek: messagesWeek?.count || 0,
        eventsThisMonth: eventsMonth?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

const defaultSettings = {
  onboarding: true,
  contentModeration: true,
  emailFrom: "support@theconnection.app",
  announcement: "",
  supportLink: "https://theconnection.app/support",
  dailyDigest: true,
  safetyAlerts: true,
  healthUpdates: false,
};

// Ensure platform_settings table exists
async function ensurePlatformSettingsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER REFERENCES users(id)
      )
    `);
  } catch (e) {
    // Table might already exist, that's fine
  }
}

// Run on startup
ensurePlatformSettingsTable();

/**
 * GET /admin/settings
 * Get platform settings from database
 */
router.get('/settings', async (req, res, next) => {
  try {
    const result = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, 'platform_config'));

    if (result.length > 0) {
      res.json({ ...defaultSettings, ...(result[0].value as object) });
    } else {
      res.json(defaultSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    res.json(defaultSettings);
  }
});

/**
 * PUT /admin/settings
 * Save platform settings to database
 */
router.put('/settings', async (req, res, next) => {
  try {
    const currentUserId = getSessionUserId(req);
    const newSettings = { ...defaultSettings, ...req.body };

    // Upsert the settings
    const existing = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, 'platform_config'));

    if (existing.length > 0) {
      await db
        .update(platformSettings)
        .set({
          value: newSettings,
          updatedAt: new Date(),
          updatedBy: currentUserId
        })
        .where(eq(platformSettings.key, 'platform_config'));
    } else {
      await db.insert(platformSettings).values({
        key: 'platform_config',
        value: newSettings,
        updatedBy: currentUserId
      });
    }

    res.json(newSettings);
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ============================================================================
// APOLOGETICS RESOURCES
// ============================================================================

/**
 * GET /admin/apologetics-resources
 * Get all apologetics resources from database
 */
router.get('/apologetics-resources', async (req, res, next) => {
  try {
    const resources = await db
      .select()
      .from(apologeticsResources)
      .orderBy(apologeticsResources.createdAt);
    res.json(resources);
  } catch (error) {
    console.error('Error loading resources:', error);
    res.json([]);
  }
});

/**
 * POST /admin/apologetics-resources
 * Add a new apologetics resource to database
 */
router.post('/apologetics-resources', async (req, res, next) => {
  try {
    const { title, description, type, url } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({ error: 'Title, description, and type are required' });
    }

    // Map type to icon
    const iconMap: Record<string, string> = {
      book: 'BookOpen',
      video: 'Video',
      podcast: 'Headphones'
    };

    const [newResource] = await db
      .insert(apologeticsResources)
      .values({
        title,
        description,
        type,
        iconName: iconMap[type] || 'BookOpen',
        url: url || null
      } as any)
      .returning();

    res.status(201).json(newResource);
  } catch (error) {
    console.error('Error saving resource:', error);
    res.status(500).json({ error: 'Failed to save resource' });
  }
});

/**
 * DELETE /admin/apologetics-resources/:id
 * Delete an apologetics resource from database
 */
router.delete('/apologetics-resources/:id', async (req, res, next) => {
  try {
    const resourceId = parseInt(req.params.id);

    if (isNaN(resourceId)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const result = await db
      .delete(apologeticsResources)
      .where(eq(apologeticsResources.id, resourceId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ============================================================================
// SENTRY ALERTS
// ============================================================================

/**
 * GET /admin/sentry-alerts
 * List sentry alerts with optional filters and pagination
 * Query params: dismissed (boolean), resource (string), limit (number), offset (number)
 */
router.get('/sentry-alerts', async (req, res, next) => {
  try {
    const dismissed = req.query.dismissed === 'true';
    const resource = req.query.resource as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const conditions = [eq(sentryAlerts.isDismissed, dismissed)];
    if (resource) {
      conditions.push(eq(sentryAlerts.resource, resource));
    }

    const alerts = await db
      .select()
      .from(sentryAlerts)
      .where(and(...conditions))
      .orderBy(desc(sentryAlerts.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/sentry-alerts/stats
 * Get summary stats: active count, last 24h count
 */
router.get('/sentry-alerts/stats', async (req, res, next) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [activeResult] = await db
      .select({ count: count() })
      .from(sentryAlerts)
      .where(eq(sentryAlerts.isDismissed, false));

    const [last24hResult] = await db
      .select({ count: count() })
      .from(sentryAlerts)
      .where(gte(sentryAlerts.createdAt, oneDayAgo));

    res.json({
      activeCount: activeResult?.count ?? 0,
      last24hCount: last24hResult?.count ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /admin/sentry-alerts/:id/dismiss
 * Dismiss a single alert
 */
router.patch('/sentry-alerts/:id/dismiss', async (req, res, next) => {
  try {
    const alertId = parseInt(req.params.id);
    if (isNaN(alertId)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const adminId = getSessionUserId(req);

    const [updated] = await db
      .update(sentryAlerts)
      .set({
        isDismissed: true,
        dismissedBy: adminId,
        dismissedAt: new Date(),
      })
      .where(eq(sentryAlerts.id, alertId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/sentry-alerts/dismiss-all
 * Bulk dismiss all active alerts
 */
router.post('/sentry-alerts/dismiss-all', async (req, res, next) => {
  try {
    const adminId = getSessionUserId(req);

    const result = await db
      .update(sentryAlerts)
      .set({
        isDismissed: true,
        dismissedBy: adminId,
        dismissedAt: new Date(),
      })
      .where(eq(sentryAlerts.isDismissed, false))
      .returning({ id: sentryAlerts.id });

    res.json({ dismissed: result.length });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// BAN / SUSPENSION SYSTEM
// ============================================================================

import { userSuspensions, contentReports } from '@shared/schema';

// Suspend/ban a user
router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const adminId = getSessionUserId(req);
    if (!adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (targetUserId === adminId) {
      return res.status(400).json({ message: 'You cannot suspend yourself' });
    }

    const { reason, type, durationHours } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ message: 'Reason is required' });
    }
    if (!type || !['warn', 'suspend', 'ban'].includes(type)) {
      return res.status(400).json({ message: 'Type must be warn, suspend, or ban' });
    }

    // Calculate expiry
    let expiresAt: Date | null = null;
    if (type === 'suspend' && durationHours) {
      expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    }
    // bans are permanent (expiresAt = null), warns have no expiry effect

    const [suspension] = await db.insert(userSuspensions).values({
      userId: targetUserId,
      adminId,
      reason,
      type,
      expiresAt,
    } as any).returning();

    res.status(201).json(suspension);
  } catch (error) {
    next(error);
  }
});

// List all suspensions (with optional filters)
router.get('/suspensions', async (req, res, next) => {
  try {
    const { status, type } = req.query;

    let query = db.select({
      suspension: userSuspensions,
      username: users.username,
      displayName: users.displayName,
    })
    .from(userSuspensions)
    .innerJoin(users, eq(userSuspensions.userId, users.id))
    .orderBy(desc(userSuspensions.createdAt));

    const results = await query;

    let filtered = results;

    // Filter by active/expired
    if (status === 'active') {
      const now = new Date();
      filtered = results.filter(r => {
        const s = r.suspension;
        return s.type === 'ban' || !s.expiresAt || s.expiresAt > now;
      });
    }

    // Filter by type
    if (type && ['warn', 'suspend', 'ban'].includes(type as string)) {
      filtered = filtered.filter(r => r.suspension.type === type);
    }

    res.json(filtered.map(r => ({
      ...r.suspension,
      username: r.username,
      displayName: r.displayName,
    })));
  } catch (error) {
    next(error);
  }
});

// Review an appeal
router.patch('/suspensions/:id/appeal', async (req, res, next) => {
  try {
    const suspensionId = parseInt(req.params.id);
    if (isNaN(suspensionId)) {
      return res.status(400).json({ message: 'Invalid suspension ID' });
    }

    const { decision } = req.body;
    if (!decision || !['approved', 'denied'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or denied' });
    }

    const existing = await db.select().from(userSuspensions).where(eq(userSuspensions.id, suspensionId));
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Suspension not found' });
    }
    if (existing[0].appealStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending appeal for this suspension' });
    }

    const updates: any = { appealStatus: decision };

    // If approved, lift the suspension by setting expiresAt to now
    if (decision === 'approved') {
      updates.expiresAt = new Date();
    }

    const [updated] = await db
      .update(userSuspensions)
      .set(updates)
      .where(eq(userSuspensions.id, suspensionId))
      .returning();

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CONTENT MODERATION QUEUE
// ============================================================================

// Get moderation queue (content reports)
router.get('/reports', async (req, res, next) => {
  try {
    const { status: filterStatus, contentType } = req.query;

    let results = await db
      .select({
        report: contentReports,
        reporterUsername: users.username,
      })
      .from(contentReports)
      .innerJoin(users, eq(contentReports.reporterId, users.id))
      .orderBy(desc(contentReports.createdAt))
      .limit(100);

    if (filterStatus && typeof filterStatus === 'string') {
      results = results.filter(r => r.report.status === filterStatus);
    }
    if (contentType && typeof contentType === 'string') {
      results = results.filter(r => r.report.contentType === contentType);
    }

    res.json(results.map(r => ({
      ...r.report,
      reporterUsername: r.reporterUsername,
    })));
  } catch (error) {
    next(error);
  }
});

// Take action on a report
router.patch('/reports/:id', async (req, res, next) => {
  try {
    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }

    const adminId = getSessionUserId(req);
    const { action, moderatorNotes } = req.body;

    if (!action || !['reviewed', 'actioned', 'dismissed'].includes(action)) {
      return res.status(400).json({ message: 'Action must be reviewed, actioned, or dismissed' });
    }

    const [updated] = await db
      .update(contentReports)
      .set({
        status: action,
        moderatorId: adminId,
        moderatorNotes: moderatorNotes || null,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contentReports.id, reportId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ADMIN ANALYTICS DASHBOARD
// ============================================================================

// Overview metrics
router.get('/analytics/overview', async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      totalCommunities,
      totalEvents,
      totalMicroblogs,
      totalPrayers,
      recentReports,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
      db.select({ count: count() }).from(communities),
      db.select({ count: count() }).from(events),
      db.select({ count: count() }).from(microblogs),
      db.select({ count: count() }).from(prayerRequests),
      db.select({ count: count() }).from(contentReports).where(eq(contentReports.status, 'pending')),
    ]);

    // Try to get active user counts from analytics events
    let activeUsers = { dau: 0, wau: 0, mau: 0 };
    try {
      const { getActiveUserCounts } = await import('../../services/analyticsService');
      activeUsers = await getActiveUserCounts();
    } catch {
      // Analytics service not available yet, skip
    }

    res.json({
      totalUsers: Number(totalUsers[0]?.count ?? 0),
      newUsersThisMonth: Number(newUsersThisMonth[0]?.count ?? 0),
      totalCommunities: Number(totalCommunities[0]?.count ?? 0),
      totalEvents: Number(totalEvents[0]?.count ?? 0),
      totalMicroblogs: Number(totalMicroblogs[0]?.count ?? 0),
      totalPrayers: Number(totalPrayers[0]?.count ?? 0),
      pendingReports: Number(recentReports[0]?.count ?? 0),
      activeUsers,
    });
  } catch (error) {
    next(error);
  }
});

// User signup/retention trends
router.get('/analytics/users', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const signupTrend = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, since))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`)
      .orderBy(sql`date_trunc('day', ${users.createdAt})`);

    res.json({
      signupTrend: signupTrend.map(r => ({ date: r.date, count: Number(r.count) })),
    });
  } catch (error) {
    next(error);
  }
});

// Content creation trends
router.get('/analytics/content', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [microblogTrend, eventTrend] = await Promise.all([
      db.select({
        date: sql<string>`to_char(date_trunc('day', ${microblogs.createdAt}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(microblogs)
      .where(gte(microblogs.createdAt, since))
      .groupBy(sql`date_trunc('day', ${microblogs.createdAt})`)
      .orderBy(sql`date_trunc('day', ${microblogs.createdAt})`),

      db.select({
        date: sql<string>`to_char(date_trunc('day', ${events.createdAt}), 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(events)
      .where(gte(events.createdAt, since))
      .groupBy(sql`date_trunc('day', ${events.createdAt})`)
      .orderBy(sql`date_trunc('day', ${events.createdAt})`),
    ]);

    res.json({
      microblogTrend: microblogTrend.map(r => ({ date: r.date, count: Number(r.count) })),
      eventTrend: eventTrend.map(r => ({ date: r.date, count: Number(r.count) })),
    });
  } catch (error) {
    next(error);
  }
});

// Moderation analytics
router.get('/analytics/moderation', async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [reportsByStatus, reportsByReason, suspensionsByType] = await Promise.all([
      db.select({
        status: contentReports.status,
        count: count(),
      })
      .from(contentReports)
      .where(gte(contentReports.createdAt, thirtyDaysAgo))
      .groupBy(contentReports.status),

      db.select({
        reason: contentReports.reason,
        count: count(),
      })
      .from(contentReports)
      .where(gte(contentReports.createdAt, thirtyDaysAgo))
      .groupBy(contentReports.reason)
      .orderBy(desc(count())),

      db.select({
        type: userSuspensions.type,
        count: count(),
      })
      .from(userSuspensions)
      .where(gte(userSuspensions.createdAt, thirtyDaysAgo))
      .groupBy(userSuspensions.type),
    ]);

    res.json({
      reportsByStatus: reportsByStatus.map(r => ({ status: r.status, count: Number(r.count) })),
      reportsByReason: reportsByReason.map(r => ({ reason: r.reason, count: Number(r.count) })),
      suspensionsByType: suspensionsByType.map(r => ({ type: r.type, count: Number(r.count) })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
