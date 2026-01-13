import express from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { buildErrorResponse } from '../utils/errors';
import { requireSessionUserId } from '../utils/session';
import { moderationReportLimiter } from '../rate-limiters';

const router = express.Router();

// POST /reports - report content
router.post('/reports', moderationReportLimiter, requireAuth, async (req: Request, res) => {
  try {
    const reporterId = requireSessionUserId(req);
    const { subjectType, subjectId, reason, description } = req.body;

    if (!subjectType || !subjectId) return res.status(400).json({ message: 'Missing subjectType or subjectId' });

    const allowed = ['post', 'community', 'event', 'microblog'];
    if (!allowed.includes(String(subjectType))) return res.status(400).json({ message: 'Invalid subjectType' });

    const report = await storage.createContentReport({
      reporterId,
      contentType: subjectType,
      contentId: parseInt(subjectId as any) || subjectId,
      reason: reason || 'other',
      description: description || null
    } as any);

    res.json({ ok: true, report });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json(buildErrorResponse('Error creating report', error));
  }
});

// POST /blocks - block a user
router.post('/blocks', requireAuth, async (req: Request, res) => {
  try {
    const blockerId = requireSessionUserId(req);
    const { userId, reason } = req.body;

    const blockedUserId = parseInt(userId as any);
    if (!blockedUserId || blockedUserId === blockerId) return res.status(400).json({ message: 'Invalid userId' });

    const block = await storage.createUserBlock({
      blockerId,
      blockedId: blockedUserId,
      reason: reason || null
    } as any);

    res.json({ ok: true, block });
  } catch (error) {
    console.error('Error creating block:', error);
    res.status(500).json(buildErrorResponse('Error creating block', error));
  }
});

// GET /blocked-users - return list of users the current user has blocked
router.get('/blocked-users', requireAuth, async (req: Request, res) => {
  try {
    const userId = requireSessionUserId(req);

    const blockedIds = await storage.getBlockedUserIdsFor(userId);
    // Optionally return minimal user info for each blocked id
    const blockedUsers = await Promise.all((blockedIds || []).map(async (id) => {
      const u = await storage.getUser(id);
      if (!u) return null;
      const { password, ...rest } = u as any;
      return { blockedUser: rest, createdAt: null };
    }));

    res.json(blockedUsers.filter(Boolean));
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json(buildErrorResponse('Error fetching blocked users', error));
  }
});

// DELETE /blocks/:userId - unblock a user
const unblockUserHandler = async (req: Request, res: Response) => {
  try {
    const blockerId = requireSessionUserId(req);

    const blockedUserId = parseInt(req.params.userId);
    if (!Number.isFinite(blockedUserId) || blockedUserId <= 0) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    await storage.removeUserBlock(blockerId, blockedUserId);
    res.json({ ok: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error removing block:', error);
    res.status(500).json(buildErrorResponse('Error removing block', error));
  }
};

router.delete('/blocks/:userId', requireAuth, unblockUserHandler);
router.delete('/safety/block/:userId', requireAuth, unblockUserHandler);

// POST /user-reports - report a user
router.post('/user-reports', moderationReportLimiter, requireAuth, async (req: Request, res) => {
  try {
    const reporterId = requireSessionUserId(req);
    const { userId, reason, description } = req.body;

    const reportedUserId = parseInt(userId as any);
    if (!reportedUserId || reportedUserId === reporterId) {
      return res.status(400).json({ message: 'Invalid userId or cannot report yourself' });
    }

    // Check if user has already reported this user (prevent duplicate reports)
    const existingReport = await storage.getUserReportByReporterAndReported(reporterId, reportedUserId);
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this user' });
    }

    // Create the report
    const report = await storage.createUserReport({
      reporterId,
      reportedUserId,
      reason: reason || 'other',
      description: description || null,
      status: 'pending'
    } as any);

    // Increment report count on the user
    await storage.incrementUserReportCount(reportedUserId);

    // Check if user has reached 10 reports - auto-suspend
    const reportCount = await storage.getUserReportCount(reportedUserId);
    if (reportCount >= 10) {
      await storage.suspendUser(reportedUserId, 'Automatically suspended after receiving 10 user reports');
    }

    res.json({ ok: true, report });
  } catch (error) {
    console.error('Error creating user report:', error);
    res.status(500).json(buildErrorResponse('Error creating user report', error));
  }
});

export default router;
