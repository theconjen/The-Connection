/**
 * Membership Request Routes
 *
 * Allows attendees to request formal membership in an organization.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId, getSessionUserId } from '../utils/session';
import { computeOrgCapabilities } from '../services/orgTierService';

const router = Router();

/**
 * GET /api/orgs/:slug/membership-status - Get user's membership status
 */
router.get('/:slug/membership-status', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = getSessionUserId(req);

    const org = await storage.getOrganizationBySlug(slug);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!userId) {
      return res.json({
        userRole: 'visitor',
        hasPendingRequest: false,
        canRequestMembership: false,
      });
    }

    const capabilities = await computeOrgCapabilities({
      orgId: org.id,
      viewerUserId: userId,
    });

    res.json({
      userRole: capabilities.userRole,
      hasPendingRequest: capabilities.hasPendingMembershipRequest,
      canRequestMembership: capabilities.canRequestMembership,
    });
  } catch (error) {
    console.error('Error fetching membership status:', error);
    res.status(500).json({ error: 'Failed to fetch membership status' });
  }
});

/**
 * POST /api/orgs/:slug/request-membership - Request membership
 */
router.post('/:slug/request-membership', requireAuth, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = requireSessionUserId(req);

    const org = await storage.getOrganizationBySlug(slug);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if user can request membership
    const capabilities = await computeOrgCapabilities({
      orgId: org.id,
      viewerUserId: userId,
    });

    if (!capabilities.canRequestMembership) {
      if (capabilities.hasPendingMembershipRequest) {
        return res.status(400).json({ error: 'You already have a pending membership request' });
      }
      if (['member', 'moderator', 'admin', 'owner'].includes(capabilities.userRole)) {
        return res.status(400).json({ error: 'You are already a member' });
      }
      if (capabilities.userRole === 'visitor') {
        return res.status(400).json({ error: 'You must first mark this as your church before requesting membership' });
      }
      return res.status(400).json({ error: 'Cannot request membership at this time' });
    }

    // Create the request
    const request = await storage.createMembershipRequest({
      organizationId: org.id,
      userId,
      status: 'pending',
      notes: req.body.notes || null,
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'membership.requested',
      targetType: 'user',
      targetId: userId,
      metadata: { requestId: request.id },
    });

    res.status(201).json({
      success: true,
      requestId: request.id,
    });
  } catch (error) {
    console.error('Error creating membership request:', error);
    res.status(500).json({ error: 'Failed to create membership request' });
  }
});

export default router;
