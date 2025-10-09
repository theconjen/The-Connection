import express from 'express';
import { isAuthenticated, isAdmin } from '../auth';
import { storage } from '../storage-optimized';
import { db } from '../db';
import { contentReports } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Public endpoints (authenticated users)
router.post('/moderation/report', isAuthenticated, async (req: any, res) => {
  try {
    const reporterId = req.session?.userId;
    const { contentType, contentId, reason, description } = req.body;
    if (!reporterId) return res.status(401).json({ message: 'Not authenticated' });
    if (!contentType || !contentId) return res.status(400).json({ message: 'Missing contentType or contentId' });

    const report = await storage.createContentReport({
      reporterId,
      contentType,
      contentId: parseInt(contentId as any) || contentId,
      reason: reason || 'other',
      description: description || null
    } as any);

    res.json({ ok: true, report });
  } catch (error) {
    console.error('Error creating moderation report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
});

router.post('/moderation/block', isAuthenticated, async (req: any, res) => {
  try {
    const blockerId = req.session?.userId;
    const { userId, reason } = req.body;
    if (!blockerId) return res.status(401).json({ message: 'Not authenticated' });
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
    res.status(500).json({ message: 'Error creating block' });
  }
});

router.get('/moderation/blocked-users', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const blockedIds = await storage.getBlockedUserIdsFor(userId);
    const blockedUsers = await Promise.all((blockedIds || []).map(async (id: number) => {
      const u = await storage.getUser(id);
      if (!u) return null;
      const { password, ...rest } = u as any;
      return { blockedUser: rest, createdAt: null };
    }));

    res.json(blockedUsers.filter(Boolean));
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ message: 'Error fetching blocked users' });
  }
});

// Admin moderation endpoints
// List reports with optional status filter and limit
router.get('/moderation/admin/reports', isAdmin, async (req: any, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = Math.min(1000, parseInt(String(req.query.limit || '50')) || 50);

    const rows = await storage.getReports?.({ status, limit });
    res.json(rows || []);
  } catch (error) {
    console.error('Error listing reports:', error);
    res.status(500).json({ message: 'Error listing reports' });
  }
});

router.get('/moderation/admin/reports/:id', isAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const row = await storage.getReportById?.(id);
    if (!row) return res.status(404).json({ message: 'Report not found' });
    res.json(row);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ message: 'Error getting report' });
  }
});

// Patch report - update status and optionally add moderator notes and record moderatorId
router.patch('/moderation/admin/reports/:id', isAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;
    const moderatorId = req.session?.userId;
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    if (!status || !['pending', 'resolved', 'dismissed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const update = {
      status,
      moderatorId: moderatorId || null,
      moderatorNotes: notes || null,
      resolvedAt: status === 'pending' ? null : new Date()
    } as any;

    const updated = await storage.updateReport?.(id, update);
    res.json(updated);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
});

export default router;
