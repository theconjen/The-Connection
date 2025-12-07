import express from 'express';
import { moderationReportLimiter } from '../rate-limiters';

const router = express.Router();

const redirect = (targetPath: string) => (req: any, res: any) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', `<${targetPath}>; rel="successor-version"`);
  res.redirect(307, targetPath);
};

// Legacy aliases that now redirect to canonical safety routes
router.post('/moderation/report', moderationReportLimiter, redirect('/api/reports'));
router.post('/moderation/block', redirect('/api/blocks'));
router.get('/moderation/blocked-users', redirect('/api/blocked-users'));
router.delete('/moderation/block/:userId', redirect('/api/blocks/:userId'));

// Admin moderation endpoints now live under /api/admin/reports
router.get('/moderation/admin/reports', redirect('/api/admin/reports'));
router.get('/moderation/admin/reports/:id', redirect('/api/admin/reports/:id'));
router.patch('/moderation/admin/reports/:id', redirect('/api/admin/reports/:id'));

export default router;
