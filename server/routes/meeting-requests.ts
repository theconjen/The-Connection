/**
 * Meeting Request Routes
 *
 * Allows members/attendees to request pastoral care meetings.
 * Tier-gated: requires org.pastoral.appointmentRequests feature.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { computeOrgCapabilities, requireOrgFeature, isWithinOrgLimit } from '../services/orgTierService';
import { z } from 'zod/v4';

const router = Router();

/**
 * POST /api/orgs/:slug/request-meeting - Request a pastoral meeting
 */
router.post('/:slug/request-meeting', requireAuth, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = requireSessionUserId(req);

    // Validate request body
    const schema = z.object({
      reason: z.string().min(10).max(2000),
    });
    const { reason } = schema.parse(req.body);

    // Get organization
    const org = await storage.getOrganizationBySlug(slug);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if org has pastoral appointments feature
    const hasFeature = await requireOrgFeature(org.id, 'org.pastoral.appointmentRequests');
    if (!hasFeature) {
      // Don't reveal that the feature is tier-gated
      return res.status(404).json({ error: 'Meeting requests are not available for this organization' });
    }

    // Check if user can request meeting
    const capabilities = await computeOrgCapabilities({
      orgId: org.id,
      viewerUserId: userId,
    });

    if (!capabilities.canRequestMeeting) {
      if (capabilities.userRole === 'visitor') {
        return res.status(400).json({ error: 'You must be affiliated with this church to request a meeting' });
      }
      // Could be over limit - don't reveal exact reason
      return res.status(400).json({ error: 'Cannot request a meeting at this time. Please try again later.' });
    }

    // Double-check monthly limit
    const currentCount = await storage.countOrgMeetingRequestsThisMonth(org.id);
    const withinLimit = await isWithinOrgLimit(org.id, 'meetingRequestsPerMonth', currentCount);
    if (!withinLimit) {
      return res.status(400).json({ error: 'Cannot request a meeting at this time. Please try again later.' });
    }

    // Create the meeting request
    const request = await storage.createMeetingRequest({
      organizationId: org.id,
      requesterId: userId,
      reason,
      status: 'new',
    });

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'meeting.requested',
      targetType: 'meeting_request',
      targetId: request.id,
      metadata: null, // Don't log the reason for privacy
    });

    res.status(201).json({
      success: true,
      requestId: request.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error creating meeting request:', error);
    res.status(500).json({ error: 'Failed to create meeting request' });
  }
});

export default router;
