import { Router } from 'express';
import { insertCommentSchema, insertMicroblogSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage as defaultStorage } from '../storage-optimized';
import { contentCreationLimiter, messageCreationLimiter } from '../rate-limiters';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

export function createMicroblogsRouter(storage = defaultStorage) {
  const router = Router();

  router.get('/api/microblogs', async (_req, res) => {
    try {
      const microblogs = await storage.getAllMicroblogs();
      res.json(microblogs);
    } catch (error) {
      console.error('Error fetching microblogs:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblogs', error));
    }
  });

  router.get('/api/microblogs/:id', async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog || (microblog as any).deletedAt) {
        return res.status(404).json({ message: 'Microblog not found' });
      }
      res.json(microblog);
    } catch (error) {
      console.error('Error fetching microblog:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblog', error));
    }
  });

  router.post('/api/microblogs', contentCreationLimiter, requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const validatedData = insertMicroblogSchema.parse({
        ...req.body,
        authorId: userId,
      });
      const microblog = await storage.createMicroblog(validatedData);
      res.status(201).json(microblog);
    } catch (error) {
      console.error('Error creating microblog:', error);
      res.status(500).json(buildErrorResponse('Error creating microblog', error));
    }
  });

  router.post('/api/microblogs/:id/like', requireAuth, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = requireSessionUserId(req);
      const like = await storage.likeMicroblog(microblogId, userId);
      res.status(201).json(like);
    } catch (error) {
      console.error('Error liking microblog:', error);
      res.status(500).json(buildErrorResponse('Error liking microblog', error));
    }
  });

  router.delete('/api/microblogs/:id/like', requireAuth, async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const userId = requireSessionUserId(req);
      await storage.unlikeMicroblog(microblogId, userId);
      res.json({ message: 'Microblog unliked successfully' });
    } catch (error) {
      console.error('Error unliking microblog:', error);
      res.status(500).json(buildErrorResponse('Error unliking microblog', error));
    }
  });

  router.delete('/api/microblogs/:id', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogId = parseInt(req.params.id);
      if (!Number.isFinite(microblogId)) {
        return res.status(400).json({ message: 'Invalid microblog ID' });
      }

      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog || (microblog as any).deletedAt) {
        return res.status(404).json({ message: 'Microblog not found' });
      }
      if (microblog.authorId !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this microblog' });
      }

      await storage.deleteMicroblog(microblogId);
      res.json({ ok: true, message: 'Microblog deleted successfully' });
    } catch (error) {
      console.error('Error deleting microblog:', error);
      res.status(500).json(buildErrorResponse('Error deleting microblog', error));
    }
  });

  router.post('/api/microblogs/:id/comments', messageCreationLimiter, requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog || (microblog as any).deletedAt) {
        return res.status(404).json({ message: 'Microblog not found' });
      }

      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: microblogId,
        authorId: userId,
      });
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating microblog comment:', error);
      res.status(500).json(buildErrorResponse('Error creating microblog comment', error));
    }
  });

  return router;
}

export default createMicroblogsRouter();
