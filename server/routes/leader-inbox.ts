/**
 * Leader Inbox Routes
 *
 * Allows org leaders (owner/admin/moderator) to manage:
 * - Membership requests
 * - Meeting requests (if org has pastoral appointments feature)
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { requireOrgFeature, getUserLeaderOrgs } from '../services/orgTierService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/leader-inbox/memberships - Get pending membership requests for user's orgs
 */
router.get('/memberships', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const leaderOrgs = await getUserLeaderOrgs(userId);
    if (leaderOrgs.length === 0) {
      return res.json([]);
    }

    // Get pending requests for all leader orgs
    const allRequests: any[] = [];
    for (const orgId of leaderOrgs) {
      const requests = await storage.getMembershipRequests(orgId);
      const pending = requests.filter(r => r.status === 'pending');

      // Enrich with user and org info
      for (const request of pending) {
        const user = await storage.getUser(request.userId);
        const org = await storage.getOrganization(request.organizationId);
        allRequests.push({
          ...request,
          user: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          } : null,
          organization: org ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
          } : null,
        });
      }
    }

    // Sort by requested date, newest first
    allRequests.sort((a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    res.json(allRequests);
  } catch (error) {
    console.error('Error fetching membership requests:', error);
    res.status(500).json({ error: 'Failed to fetch membership requests' });
  }
});

/**
 * POST /api/leader-inbox/memberships/:id/approve - Approve membership request
 */
router.post('/memberships/:id/approve', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const requestId = parseInt(req.params.id, 10);

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Verify user is a leader of the org
    const leaderOrgs = await getUserLeaderOrgs(userId);
    const requests = await Promise.all(
      leaderOrgs.map(orgId => storage.getMembershipRequests(orgId))
    );
    const allRequests = requests.flat();
    const request = allRequests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    await storage.approveMembershipRequest(requestId, userId);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: request.organizationId,
      actorId: userId,
      action: 'membership.approved',
      targetType: 'user',
      targetId: request.userId,
      metadata: { requestId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error approving membership request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

/**
 * POST /api/leader-inbox/memberships/:id/decline - Decline membership request
 */
router.post('/memberships/:id/decline', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const requestId = parseInt(req.params.id, 10);

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    // Verify user is a leader of the org
    const leaderOrgs = await getUserLeaderOrgs(userId);
    const requests = await Promise.all(
      leaderOrgs.map(orgId => storage.getMembershipRequests(orgId))
    );
    const allRequests = requests.flat();
    const request = allRequests.find(r => r.id === requestId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    await storage.declineMembershipRequest(requestId, userId);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: request.organizationId,
      actorId: userId,
      action: 'membership.declined',
      targetType: 'user',
      targetId: request.userId,
      metadata: { requestId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error declining membership request:', error);
    res.status(500).json({ error: 'Failed to decline request' });
  }
});

/**
 * GET /api/leader-inbox/meetings - Get meeting requests for user's orgs
 * Only returns results for orgs with pastoral appointments feature
 */
router.get('/meetings', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const leaderOrgs = await getUserLeaderOrgs(userId);
    if (leaderOrgs.length === 0) {
      return res.json([]);
    }

    // Get meeting requests for orgs with the pastoral feature
    const allRequests: any[] = [];
    for (const orgId of leaderOrgs) {
      const hasFeature = await requireOrgFeature(orgId, 'org.pastoral.appointmentRequests');
      if (!hasFeature) continue;

      const requests = await storage.getMeetingRequests(orgId);

      // Enrich with requester and org info
      for (const request of requests) {
        const user = await storage.getUser(request.requesterId);
        const org = await storage.getOrganization(request.organizationId);
        allRequests.push({
          ...request,
          requester: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          } : null,
          organization: org ? {
            id: org.id,
            name: org.name,
            slug: org.slug,
          } : null,
        });
      }
    }

    // Sort by created date, newest first
    allRequests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(allRequests);
  } catch (error) {
    console.error('Error fetching meeting requests:', error);
    res.status(500).json({ error: 'Failed to fetch meeting requests' });
  }
});

/**
 * PATCH /api/leader-inbox/meetings/:id - Update meeting request status
 */
router.patch('/meetings/:id', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const requestId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const validStatuses = ['new', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify user is a leader of the org and org has pastoral feature
    const leaderOrgs = await getUserLeaderOrgs(userId);
    let foundRequest: any = null;

    for (const orgId of leaderOrgs) {
      const hasFeature = await requireOrgFeature(orgId, 'org.pastoral.appointmentRequests');
      if (!hasFeature) continue;

      const requests = await storage.getMeetingRequests(orgId);
      foundRequest = requests.find(r => r.id === requestId);
      if (foundRequest) break;
    }

    if (!foundRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await storage.updateMeetingRequestStatus(
      requestId,
      status,
      status === 'closed' ? userId : undefined
    );

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: foundRequest.organizationId,
      actorId: userId,
      action: `meeting.${status}`,
      targetType: 'meeting_request',
      targetId: requestId,
      metadata: null,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating meeting request:', error);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

export default router;
