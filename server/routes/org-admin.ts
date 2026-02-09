/**
 * Organization Admin Routes (Steward Console)
 *
 * Web-only admin interface for organization management.
 * All routes use requireOrgAdminOr404 middleware.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireOrgAdminOr404, requireOrgModeratorOr404 } from '../middleware/org-admin';
import { requireSessionUserId } from '../utils/session';
import { requireOrgFeature, getOrgLimit, getOrgSermonPolicy } from '../services/orgTierService';
import { createDirectUpload, getUploadStatus } from '../services/muxService';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/org-admin/:orgId - Get organization admin dashboard data
 */
router.get('/:orgId', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;

    // Get counts
    const members = await storage.getOrganizationMembers(org.id);
    const pendingMemberships = (await storage.getMembershipRequests(org.id))
      .filter(r => r.status === 'pending');

    const features = {
      hasPastoralAppointments: await requireOrgFeature(org.id, 'org.pastoral.appointmentRequests'),
      hasPrivateWall: await requireOrgFeature(org.id, 'org.wall.private'),
      hasPrivateCommunities: await requireOrgFeature(org.id, 'org.communities.private'),
      hasOrdinations: await requireOrgFeature(org.id, 'org.ordinations'),
    };
    const entitlements = {
      canManageOrdinations: features.hasOrdinations,
    };

    const organization = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      adminUserId: org.adminUserId,
      website: org.website,
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city,
      state: org.state,
      zipCode: org.zipCode,
      denomination: org.denomination,
      mission: org.mission,
      serviceTimes: org.serviceTimes,
      socialMedia: org.socialMedia,
      foundedDate: org.foundedDate,
      congregationSize: org.congregationSize,
      logoUrl: org.logoUrl,
      showPhone: org.showPhone,
      showAddress: org.showAddress,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };

    res.json({
      organization,
      features,
      entitlements,
      stats: {
        memberCount: members.length,
        pendingMembershipCount: pendingMemberships.length,
      },
    });
  } catch (error) {
    console.error('Error fetching org admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * PATCH /api/org-admin/:orgId - Update organization settings
 */
router.patch('/:orgId', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      website: z.string().url().optional().nullable(),
      email: z.string().email().optional().nullable(),
      phone: z.string().max(20).optional().nullable(),
      address: z.string().max(500).optional().nullable(),
      city: z.string().max(100).optional().nullable(),
      state: z.string().max(100).optional().nullable(),
      zipCode: z.string().max(20).optional().nullable(),
      denomination: z.string().max(100).optional().nullable(),
      mission: z.string().max(2000).optional().nullable(),
      serviceTimes: z.string().max(1000).optional().nullable(),
      socialMedia: z.string().max(1000).optional().nullable(),
      congregationSize: z.number().min(0).optional().nullable(),
      showPhone: z.boolean().optional(),
      showAddress: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const updated = await storage.updateOrganization(org.id, data);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'settings.updated',
      targetType: 'organization',
      targetId: org.id,
      metadata: { fields: Object.keys(data) },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error updating organization:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

/**
 * GET /api/org-admin/:orgId/members - Get organization members
 */
router.get('/:orgId/members', requireOrgModeratorOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;

    const members = await storage.getOrganizationMembers(org.id);

    res.json(members.map(m => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: {
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      },
    })));
  } catch (error) {
    console.error('Error fetching organization members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

/**
 * PATCH /api/org-admin/:orgId/members/:userId - Update member role
 */
router.patch('/:orgId/members/:userId', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const actorId = requireSessionUserId(req);
    const targetUserId = parseInt(req.params.userId, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const schema = z.object({
      role: z.enum(['owner', 'admin', 'moderator', 'member']),
    });

    const { role } = schema.parse(req.body);

    // Cannot change own role
    if (targetUserId === actorId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Check if target is a member
    const member = await storage.getOrganizationMember(org.id, targetUserId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cannot demote an owner unless you are owner
    const actorRole = (req as any).orgRole;
    if (member.role === 'owner' && actorRole !== 'owner') {
      return res.status(400).json({ error: 'Only the owner can change owner roles' });
    }

    // Update the role
    const updated = await storage.updateOrganizationMemberRole(org.id, targetUserId, role);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId,
      action: 'member.role_changed',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { oldRole: member.role, newRole: role },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

/**
 * DELETE /api/org-admin/:orgId/members/:userId - Remove member
 */
router.delete('/:orgId/members/:userId', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const actorId = requireSessionUserId(req);
    const targetUserId = parseInt(req.params.userId, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Cannot remove yourself
    if (targetUserId === actorId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Check if target is a member
    const member = await storage.getOrganizationMember(org.id, targetUserId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Cannot remove an owner
    if (member.role === 'owner') {
      return res.status(400).json({ error: 'Cannot remove the owner' });
    }

    await storage.removeOrganizationMember(org.id, targetUserId);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId,
      action: 'member.removed',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { role: member.role },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

/**
 * GET /api/org-admin/:orgId/activity - Get activity logs
 */
router.get('/:orgId/activity', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 100);

    const logs = await storage.getOrganizationActivityLogs(org.id, limit);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

/**
 * GET /api/org-admin/:orgId/ordination-programs - Get ordination programs
 */
router.get('/:orgId/ordination-programs', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;

    // Check if org has ordinations feature
    const hasFeature = await requireOrgFeature(org.id, 'org.ordinations');
    if (!hasFeature) {
      return res.json([]); // Return empty, don't reveal feature gate
    }

    const programs = await storage.getOrdinationPrograms(org.id);
    res.json(programs);
  } catch (error) {
    console.error('Error fetching ordination programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

/**
 * POST /api/org-admin/:orgId/ordination-programs - Create ordination program
 */
router.post('/:orgId/ordination-programs', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    // Check if org has ordinations feature
    const hasFeature = await requireOrgFeature(org.id, 'org.ordinations');
    if (!hasFeature) {
      return res.status(400).json({ error: 'Ordination programs are not available for your organization' });
    }

    // Check program limit
    const existingPrograms = await storage.getOrdinationPrograms(org.id);
    const programLimit = await getOrgLimit(org.id, 'ordinationPrograms');

    if (programLimit !== -1 && existingPrograms.length >= programLimit) {
      return res.status(400).json({ error: 'You have reached the maximum number of ordination programs' });
    }

    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      formSchema: z.any().optional(),
      enabled: z.boolean().optional().default(true),
    });

    const data = schema.parse(req.body);

    const program = await storage.createOrdinationProgram({
      organizationId: org.id,
      ...data,
      schemaVersion: 1,
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'ordination_program.created',
      targetType: 'ordination_program',
      targetId: program.id,
      metadata: { title: data.title },
    });

    res.status(201).json(program);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error creating ordination program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

/**
 * GET /api/org-admin/:orgId/ordination-applications - Get ordination applications
 */
router.get('/:orgId/ordination-applications', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;

    // Check if org has ordinations feature
    const hasFeature = await requireOrgFeature(org.id, 'org.ordinations');
    if (!hasFeature) {
      return res.json([]);
    }

    const applications = await storage.getOrdinationApplications(org.id);

    // Enrich with applicant info
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const user = await storage.getUser(app.userId);
        const program = await storage.getOrdinationProgram(app.programId);
        const reviews = await storage.getOrdinationReviews(app.id);

        return {
          ...app,
          applicant: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          } : null,
          program: program ? {
            id: program.id,
            title: program.title,
          } : null,
          reviews,
        };
      })
    );

    res.json(enrichedApplications);
  } catch (error) {
    console.error('Error fetching ordination applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * POST /api/org-admin/:orgId/ordination-applications/:appId/review - Review an application
 */
router.post('/:orgId/ordination-applications/:appId/review', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);
    const appId = parseInt(req.params.appId, 10);

    if (isNaN(appId)) {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    // Check if org has ordinations feature
    const hasFeature = await requireOrgFeature(org.id, 'org.ordinations');
    if (!hasFeature) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const schema = z.object({
      decision: z.enum(['approve', 'reject', 'request_info']),
      notes: z.string().max(2000).optional(),
    });

    const { decision, notes } = schema.parse(req.body);

    // Verify application belongs to this org
    const applications = await storage.getOrdinationApplications(org.id);
    const application = applications.find(a => a.id === appId);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const review = await storage.createOrdinationReview({
      applicationId: appId,
      reviewerUserId: userId,
      decision,
      notes,
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: `ordination.${decision}`,
      targetType: 'ordination_application',
      targetId: appId,
      metadata: null,
    });

    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error reviewing ordination application:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ============================================================================
// ORGANIZATION LEADERS (About / Leadership section)
// ============================================================================

/**
 * GET /api/org-admin/:orgId/leaders - Get all leaders for the organization
 */
router.get('/:orgId/leaders', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const leaders = await storage.getOrganizationLeaders(org.id);
    res.json(leaders);
  } catch (error) {
    console.error('Error fetching organization leaders:', error);
    res.status(500).json({ error: 'Failed to fetch leaders' });
  }
});

/**
 * POST /api/org-admin/:orgId/leaders - Create a new leader
 */
router.post('/:orgId/leaders', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    const schema = z.object({
      name: z.string().min(1).max(200),
      title: z.string().max(200).optional().nullable(),
      bio: z.string().max(2000).optional().nullable(),
      photoUrl: z.string().url().optional().nullable(),
      isPublic: z.boolean().optional().default(true),
      sortOrder: z.number().min(0).optional().default(0),
    });

    const data = schema.parse(req.body);

    const leader = await storage.createOrganizationLeader({
      organizationId: org.id,
      name: data.name,
      title: data.title || null,
      bio: data.bio || null,
      photoUrl: data.photoUrl || null,
      isPublic: data.isPublic,
      sortOrder: data.sortOrder,
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'leader.created',
      targetType: 'organization_leader',
      targetId: leader.id,
      metadata: { name: data.name },
    });

    res.status(201).json(leader);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error creating organization leader:', error);
    res.status(500).json({ error: 'Failed to create leader' });
  }
});

/**
 * PATCH /api/org-admin/:orgId/leaders/:id - Update a leader
 */
router.patch('/:orgId/leaders/:id', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);
    const leaderId = parseInt(req.params.id, 10);

    if (isNaN(leaderId)) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    // Check if leader exists and belongs to this org
    const existingLeader = await storage.getOrganizationLeader(leaderId);
    if (!existingLeader || existingLeader.organizationId !== org.id) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    const schema = z.object({
      name: z.string().min(1).max(200).optional(),
      title: z.string().max(200).optional().nullable(),
      bio: z.string().max(2000).optional().nullable(),
      photoUrl: z.string().url().optional().nullable(),
      isPublic: z.boolean().optional(),
      sortOrder: z.number().min(0).optional(),
    });

    const data = schema.parse(req.body);

    const updated = await storage.updateOrganizationLeader(leaderId, org.id, data);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'leader.updated',
      targetType: 'organization_leader',
      targetId: leaderId,
      metadata: { fields: Object.keys(data) },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error updating organization leader:', error);
    res.status(500).json({ error: 'Failed to update leader' });
  }
});

/**
 * DELETE /api/org-admin/:orgId/leaders/:id - Delete a leader
 */
router.delete('/:orgId/leaders/:id', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);
    const leaderId = parseInt(req.params.id, 10);

    if (isNaN(leaderId)) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    // Check if leader exists and belongs to this org
    const existingLeader = await storage.getOrganizationLeader(leaderId);
    if (!existingLeader || existingLeader.organizationId !== org.id) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    const deleted = await storage.deleteOrganizationLeader(leaderId, org.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'leader.deleted',
      targetType: 'organization_leader',
      targetId: leaderId,
      metadata: { name: existingLeader.name },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization leader:', error);
    res.status(500).json({ error: 'Failed to delete leader' });
  }
});

// ============================================================================
// SERMONS (Org Video Library with Mux)
// ============================================================================

/**
 * GET /api/org-admin/:orgId/sermons - Get all sermons for the organization
 */
router.get('/:orgId/sermons', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const sermons = await storage.listOrgSermons(org.id);
    res.json(sermons);
  } catch (error) {
    console.error('Error fetching organization sermons:', error);
    res.status(500).json({ error: 'Failed to fetch sermons' });
  }
});

/**
 * POST /api/org-admin/:orgId/sermons - Create a new sermon entry
 *
 * Gate: requires org.sermons feature enabled.
 * Returns 404 if feature not enabled (concealment pattern).
 */
router.post('/:orgId/sermons', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    // Gate: check if org has sermons feature enabled
    const hasSermonsFeature = await requireOrgFeature(org.id, 'org.sermons');
    if (!hasSermonsFeature) {
      // Return 404 to conceal feature existence (matches org-admin concealment pattern)
      return res.status(404).json({ error: 'Not found' });
    }

    // Check upload limit
    const policy = await getOrgSermonPolicy(org.id);
    if (policy.uploadLimit !== -1) {
      const currentCount = await storage.countOrgSermons(org.id);
      if (currentCount >= policy.uploadLimit) {
        return res.status(400).json({
          error: 'Sermon upload limit reached',
        });
      }
    }

    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(5000).optional(),
      speaker: z.string().max(200).optional(),
      sermonDate: z.string().optional(),
      series: z.string().max(200).optional(),
      privacyLevel: z.enum(['public', 'members', 'unlisted']).optional(),
    });

    const data = schema.parse(req.body);

    const sermon = await storage.createSermon({
      organizationId: org.id,
      creatorId: userId,
      title: data.title,
      description: data.description || null,
      speaker: data.speaker || null,
      sermonDate: data.sermonDate || null,
      series: data.series || null,
      privacyLevel: data.privacyLevel || 'public',
      status: 'pending',
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'sermon.created',
      targetType: 'sermon',
      targetId: sermon.id,
      metadata: { title: sermon.title },
    });

    res.status(201).json(sermon);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating sermon:', error);
    res.status(500).json({ error: 'Failed to create sermon' });
  }
});

/**
 * POST /api/org-admin/:orgId/sermons/:id/upload-url - Get Mux direct upload URL
 *
 * Gate: requires org.sermons feature enabled.
 * Returns 404 if feature not enabled (concealment pattern).
 */
router.post('/:orgId/sermons/:id/upload-url', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);
    const sermonId = parseInt(req.params.id, 10);

    if (isNaN(sermonId)) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Gate: check if org has sermons feature enabled
    const hasSermonsFeature = await requireOrgFeature(org.id, 'org.sermons');
    if (!hasSermonsFeature) {
      // Return 404 to conceal feature existence (matches org-admin concealment pattern)
      return res.status(404).json({ error: 'Not found' });
    }

    // Check if sermon exists and belongs to this org
    const sermon = await storage.getSermonById(sermonId);
    if (!sermon || sermon.organizationId !== org.id) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Create Mux direct upload
    const { uploadUrl, uploadId } = await createDirectUpload({
      orgId: org.id,
      title: sermon.title,
      creatorId: userId,
    });

    // Store upload ID on sermon
    await storage.updateSermon(sermonId, {
      muxUploadId: uploadId,
      status: 'pending',
    });

    res.json({ uploadUrl });
  } catch (error) {
    console.error('Error creating upload URL:', error);
    res.status(500).json({ error: 'Failed to create upload URL' });
  }
});

/**
 * GET /api/org-admin/:orgId/sermons/:id/status - Check upload/processing status
 */
router.get('/:orgId/sermons/:id/status', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const sermonId = parseInt(req.params.id, 10);

    if (isNaN(sermonId)) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const sermon = await storage.getSermonById(sermonId);
    if (!sermon || sermon.organizationId !== org.id) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // If we have an upload ID but no asset ID, check upload status
    if (sermon.muxUploadId && !sermon.muxAssetId) {
      try {
        const uploadStatus = await getUploadStatus(sermon.muxUploadId);
        if (uploadStatus.assetId && uploadStatus.status === 'asset_created') {
          // Update with asset ID
          await storage.updateSermon(sermonId, {
            muxAssetId: uploadStatus.assetId,
            status: 'processing',
          });
        }
      } catch {
        // Ignore status check errors
      }
    }

    // Return current status
    const updatedSermon = await storage.getSermonById(sermonId);
    res.json({
      status: updatedSermon?.status || 'pending',
      muxAssetId: updatedSermon?.muxAssetId,
      muxPlaybackId: updatedSermon?.muxPlaybackId,
      duration: updatedSermon?.duration,
      thumbnailUrl: updatedSermon?.thumbnailUrl,
    });
  } catch (error) {
    console.error('Error checking sermon status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * PATCH /api/org-admin/:orgId/sermons/:id - Update a sermon
 */
router.patch('/:orgId/sermons/:id', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);
    const sermonId = parseInt(req.params.id, 10);

    if (isNaN(sermonId)) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const sermon = await storage.getSermonById(sermonId);
    if (!sermon || sermon.organizationId !== org.id) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional().nullable(),
      speaker: z.string().max(200).optional().nullable(),
      sermonDate: z.string().optional().nullable(),
      series: z.string().max(200).optional().nullable(),
      privacyLevel: z.enum(['public', 'members', 'unlisted']).optional(),
      publishedAt: z.string().optional().nullable(),
    });

    const data = schema.parse(req.body);

    const updated = await storage.updateSermon(sermonId, data);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'sermon.updated',
      targetType: 'sermon',
      targetId: sermonId,
      metadata: { title: updated.title },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating sermon:', error);
    res.status(500).json({ error: 'Failed to update sermon' });
  }
});

/**
 * DELETE /api/org-admin/:orgId/sermons/:id - Soft delete a sermon
 */
router.delete('/:orgId/sermons/:id', requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);
    const sermonId = parseInt(req.params.id, 10);

    if (isNaN(sermonId)) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const sermon = await storage.getSermonById(sermonId);
    if (!sermon || sermon.organizationId !== org.id) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const deleted = await storage.softDeleteSermon(sermonId);
    if (!deleted) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'sermon.deleted',
      targetType: 'sermon',
      targetId: sermonId,
      metadata: { title: sermon.title },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting sermon:', error);
    res.status(500).json({ error: 'Failed to delete sermon' });
  }
});

export default router;
