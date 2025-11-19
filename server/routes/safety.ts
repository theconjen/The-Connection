import express from 'express';
import { isAuthenticated } from '../auth';
import { storage } from '../storage-optimized';
import { buildErrorResponse } from '../utils/errors';

const router = express.Router();

// POST /reports - report content
router.post('/reports', isAuthenticated, async (req: any, res) => {
  try {
    const reporterId = req.session?.userId;
    const { subjectType, subjectId, reason, description } = req.body;

    if (!reporterId) return res.status(401).json({ message: 'Not authenticated' });
    if (!subjectType || !subjectId) return res.status(400).json({ message: 'Missing subjectType or subjectId' });

    const allowed = ['post', 'community', 'event'];
    if (!allowed.includes(String(subjectType))) return res.status(400).json({ message: 'Invalid subjectType' });

    const report = await storage.createContentReport({
      reporterId: reporterId,
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
router.post('/blocks', isAuthenticated, async (req: any, res) => {
  try {
    const blockerId = req.session?.userId;
    const { userId, reason } = req.body;

    if (!blockerId) return res.status(401).json({ message: 'Not authenticated' });
    const blockedUserId = parseInt(userId as any);
    if (!blockedUserId || blockedUserId === blockerId) return res.status(400).json({ message: 'Invalid userId' });

    const block = await storage.createUserBlock({
      blockerId: blockerId,
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
router.get('/blocked-users', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

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
router.delete('/blocks/:userId', isAuthenticated, async (req: any, res) => {
  try {
    const blockerId = req.session?.userId;
    const blockedUserId = parseInt(req.params.userId);

    if (!blockerId) return res.status(401).json({ message: 'Not authenticated' });
    if (!blockedUserId || isNaN(blockedUserId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    await storage.removeUserBlock(blockerId, blockedUserId);
    res.json({ ok: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error removing block:', error);
    res.status(500).json(buildErrorResponse('Error removing block', error));
  }
});

export default router;
