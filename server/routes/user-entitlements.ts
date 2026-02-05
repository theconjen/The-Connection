/**
 * User Entitlements Routes
 *
 * Returns boolean-only entitlements for the current user.
 * Used by mobile to determine which UI elements to show.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { computeInboxEntitlements } from '../services/orgTierService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/me/inbox-entitlements - Get leader inbox entitlements
 *
 * Returns boolean-only response indicating what inbox features the user has access to.
 * Mobile uses this to conditionally show the Leader Inbox.
 */
router.get('/inbox-entitlements', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const entitlements = await computeInboxEntitlements(userId);

    res.json(entitlements);
  } catch (error) {
    console.error('Error fetching inbox entitlements:', error);
    res.status(500).json({ error: 'Failed to fetch entitlements' });
  }
});

export default router;
