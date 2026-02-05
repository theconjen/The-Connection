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
import { requireOrgFeature, getOrgLimit } from '../services/orgTierService';
import { z } from 'zod/v4';

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

export default router;
