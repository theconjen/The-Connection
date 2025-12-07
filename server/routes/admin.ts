import { Router } from 'express';
import { isAdmin } from '../auth';
import { storage } from '../storage-optimized';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Apply admin middleware to all routes in this file
router.use(isAdmin);

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get all livestreamer applications
router.get('/applications/livestreamer', async (req, res, next) => {
  try {
    const applications = await storage.getAllLivestreamerApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get apologist scholar applications
router.get('/apologist-scholar-applications', async (req, res, next) => {
  try {
    const applications = await storage.getAllApologistScholarApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get livestreamer application statistics
router.get('/livestreamer-applications/stats', async (req, res, next) => {
  try {
    const stats = await storage.getLivestreamerApplicationStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Update livestreamer application status
router.patch('/applications/livestreamer/:id', async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    const applicationId = parseInt(req.params.id);
    
    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }
    
    const updatedApplication = await storage.updateLivestreamerApplicationStatus(
      applicationId,
      status,
      reviewNotes
    );
    
    res.json(updatedApplication);
  } catch (error) {
    next(error);
  }
});

// Moderation report management (canonical admin endpoints)
router.get('/reports', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = Math.min(1000, parseInt(String(req.query.limit || '50')) || 50);

    const rows = await storage.getReports?.({ status, limit });
    res.json(rows || []);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error listing reports', error));
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Invalid id' });
    const row = await storage.getReportById?.(id);
    if (!row) return res.status(404).json({ message: 'Report not found' });
    res.json(row);
  } catch (error) {
    res.status(500).json(buildErrorResponse('Error getting report', error));
  }
});

router.patch('/reports/:id', async (req, res) => {
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
    res.status(500).json(buildErrorResponse('Error updating report', error));
  }
});

// Delete user (for admin use only)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Don't allow admins to delete themselves
    const sessionUserId = typeof req.session?.userId === 'string'
      ? parseInt(req.session!.userId as any, 10)
      : (req.session?.userId as number | undefined);

    if (sessionUserId !== undefined && userId === sessionUserId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await storage.deleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;