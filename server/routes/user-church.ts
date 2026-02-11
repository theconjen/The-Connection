/**
 * User Church Affiliation Routes
 *
 * Allows users to set their church affiliation (attending/member)
 * and request churches to join the platform.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/user/church-affiliation - Get current user's church affiliation
 */
router.get('/church-affiliation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const affiliation = await storage.getUserChurchAffiliation(userId);

    if (!affiliation) {
      return res.json({ affiliation: null });
    }

    // If affiliated with an org on platform, include org details
    let organization = null;
    if (affiliation.organizationId) {
      const org = await storage.getOrganization(affiliation.organizationId);
      if (org) {
        organization = {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logoUrl: org.logoUrl,
          city: org.city,
          state: org.state,
          denomination: org.denomination,
        };
      }
    }

    res.json({
      affiliation: {
        id: affiliation.id,
        affiliationType: affiliation.affiliationType,
        organizationId: affiliation.organizationId,
        customChurchName: affiliation.customChurchName,
        customChurchCity: affiliation.customChurchCity,
        customChurchState: affiliation.customChurchState,
        startedAt: affiliation.startedAt,
        organization,
      },
    });
  } catch (error) {
    console.error('Error fetching church affiliation:', error);
    res.status(500).json({ error: 'Failed to fetch church affiliation' });
  }
});

/**
 * PUT /api/user/church-affiliation - Set or update church affiliation
 */
router.put('/church-affiliation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const schema = z.object({
      // Either organizationId (for churches on platform) or custom church info
      organizationId: z.number().optional().nullable(),
      customChurchName: z.string().max(200).optional().nullable(),
      customChurchCity: z.string().max(100).optional().nullable(),
      customChurchState: z.string().max(50).optional().nullable(),
      affiliationType: z.enum(['attending', 'member']).default('attending'),
      startedAt: z.string().optional().nullable(), // ISO date string
    });

    const data = schema.parse(req.body);

    // Validate that either organizationId or customChurchName is provided
    if (!data.organizationId && !data.customChurchName) {
      return res.status(400).json({
        error: 'Either organizationId or customChurchName is required',
      });
    }

    // If organizationId provided, verify the org exists
    if (data.organizationId) {
      const org = await storage.getOrganization(data.organizationId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    }

    const affiliation = await storage.updateUserChurchAffiliation(userId, {
      organizationId: data.organizationId || null,
      customChurchName: data.organizationId ? null : data.customChurchName,
      customChurchCity: data.organizationId ? null : data.customChurchCity,
      customChurchState: data.organizationId ? null : data.customChurchState,
      affiliationType: data.affiliationType,
      startedAt: data.startedAt ? new Date(data.startedAt) : null,
    });

    res.json({ affiliation });
  } catch (error) {
    console.error('Error updating church affiliation:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update church affiliation' });
  }
});

/**
 * DELETE /api/user/church-affiliation - Remove church affiliation
 */
router.delete('/church-affiliation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const affiliation = await storage.getUserChurchAffiliation(userId);

    if (!affiliation) {
      return res.status(404).json({ error: 'No church affiliation found' });
    }

    await storage.removeUserChurchAffiliation(userId, affiliation.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing church affiliation:', error);
    res.status(500).json({ error: 'Failed to remove church affiliation' });
  }
});

/**
 * POST /api/user/request-church-invitation - Request a church to join the platform
 */
router.post('/request-church-invitation', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const schema = z.object({
      churchName: z.string().min(2).max(200),
      churchEmail: z.string().email(),
      churchCity: z.string().max(100).optional(),
      churchState: z.string().max(50).optional(),
      churchWebsite: z.string().url().optional().or(z.literal('')),
    });

    const data = schema.parse(req.body);

    // Check if a request for this email already exists
    const existing = await storage.getChurchInvitationRequestByEmail(data.churchEmail);
    if (existing && existing.status === 'pending') {
      return res.status(400).json({
        error: 'An invitation request for this church is already pending',
      });
    }

    // Create the invitation request
    const request = await storage.createChurchInvitationRequest({
      requesterId: userId,
      churchName: data.churchName,
      churchEmail: data.churchEmail.toLowerCase(),
      churchCity: data.churchCity || null,
      churchState: data.churchState || null,
      churchWebsite: data.churchWebsite || null,
      status: 'pending',
    });

    // TODO: Send email to the church (implement in email service)
    // For now, just mark as pending and an admin will process it

    res.json({
      success: true,
      message: 'Your request has been submitted. We will reach out to the church on your behalf.',
      request: {
        id: request.id,
        churchName: request.churchName,
        status: request.status,
      },
    });
  } catch (error) {
    console.error('Error creating church invitation request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

/**
 * GET /api/user/church-invitation-requests - Get user's church invitation requests
 */
router.get('/church-invitation-requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const requests = await storage.getChurchInvitationRequestsByUser(userId);

    res.json({
      requests: requests.map((r) => ({
        id: r.id,
        churchName: r.churchName,
        churchCity: r.churchCity,
        churchState: r.churchState,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching church invitation requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

/**
 * GET /api/user/church-bulletin - Get church bulletin data for user's affiliated church
 * Returns church info, upcoming events, and recent sermons for the home screen bulletin section
 */
router.get('/church-bulletin', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const affiliation = await storage.getUserChurchAffiliation(userId);

    if (!affiliation?.organizationId) {
      return res.json({ hasBulletin: false });
    }

    const org = await storage.getOrganization(affiliation.organizationId);
    if (!org) {
      return res.json({ hasBulletin: false });
    }

    // Check if user is a member of the org (for sermon visibility)
    const isMember = await storage.isOrganizationMember(org.id, userId);

    const [upcomingEvents, recentSermons] = await Promise.all([
      storage.getUpcomingOrgEvents(affiliation.organizationId, 5),
      storage.getPublicOrgSermons(affiliation.organizationId, isMember),
    ]);

    res.json({
      hasBulletin: true,
      church: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        serviceTimes: org.serviceTimes,
      },
      upcomingEvents: upcomingEvents.slice(0, 3).map((e) => ({
        id: e.id,
        title: e.title,
        eventDate: e.eventDate,
        startTime: e.startTime,
        location: e.location,
      })),
      recentSermons: recentSermons.slice(0, 3).map((s) => ({
        id: s.id,
        title: s.title,
        speaker: s.speaker,
        thumbnailUrl: s.thumbnailUrl,
        sermonDate: s.sermonDate,
      })),
    });
  } catch (error) {
    console.error('Error fetching church bulletin:', error);
    res.status(500).json({ error: 'Failed to fetch church bulletin' });
  }
});

export default router;
