import { Router } from 'express';
import { insertCommentSchema, insertMicroblogSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage as defaultStorage } from '../storage-optimized';
import { contentCreationLimiter, messageCreationLimiter } from '../rate-limiters';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

export function createMicroblogsRouter(storage = defaultStorage) {
  const router = Router();

  router.get('/microblogs', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const microblogs = await storage.getAllMicroblogs();

      // Enrich microblogs with author data and user engagement status
      const enrichedMicroblogs = await Promise.all(
        microblogs.map(async (microblog) => {
          const author = await storage.getUser(microblog.authorId);
          const isLiked = userId ? await storage.hasUserLikedMicroblog(microblog.id, userId) : false;
          const isReposted = userId ? await storage.hasUserRepostedMicroblog(microblog.id, userId) : false;
          const isBookmarked = userId ? await storage.hasUserBookmarkedMicroblog(microblog.id, userId) : false;

          return {
            ...microblog,
            author: author ? {
              id: author.id,
              username: author.username,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
            } : undefined,
            isLiked,
            isReposted,
            isBookmarked,
          };
        })
      );

      res.json(enrichedMicroblogs);
    } catch (error) {
      console.error('Error fetching microblogs:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblogs', error));
    }
  });

  router.get('/microblogs/:id', async (req, res) => {
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

  router.post('/microblogs', contentCreationLimiter, requireAuth, async (req, res) => {
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

  router.post('/microblogs/:id/like', requireAuth, async (req, res) => {
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

  router.delete('/microblogs/:id/like', requireAuth, async (req, res) => {
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

  router.delete('/microblogs/:id', requireAuth, async (req, res) => {
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

  // Get comments for a microblog
  router.get('/microblogs/:id/comments', async (req, res) => {
    try {
      const microblogId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPostId(microblogId);

      // Enrich comments with author data
      const enrichedComments = await Promise.all(
        comments.map(async (comment: any) => {
          const author = await storage.getUser(comment.authorId);
          return {
            ...comment,
            author: author ? {
              id: author.id,
              username: author.username,
              displayName: author.displayName,
              profileImageUrl: author.profileImageUrl,
            } : undefined,
          };
        })
      );

      res.json(enrichedComments);
    } catch (error) {
      console.error('Error fetching microblog comments:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblog comments', error));
    }
  });

  router.post('/microblogs/:id/comments', messageCreationLimiter, requireAuth, async (req, res) => {
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

  router.post('/microblogs/:id/repost', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog || (microblog as any).deletedAt) {
        return res.status(404).json({ message: 'Microblog not found' });
      }

      const repost = await storage.repostMicroblog(microblogId, userId);
      res.status(201).json(repost);
    } catch (error: any) {
      if (error.message === 'Already reposted') {
        return res.status(400).json({ message: 'Already reposted' });
      }
      console.error('Error reposting microblog:', error);
      res.status(500).json(buildErrorResponse('Error reposting microblog', error));
    }
  });

  router.delete('/microblogs/:id/repost', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogId = parseInt(req.params.id);
      const success = await storage.unrepostMicroblog(microblogId, userId);
      if (!success) {
        return res.status(404).json({ message: 'Repost not found' });
      }
      res.json({ message: 'Microblog unreposted successfully' });
    } catch (error) {
      console.error('Error unreposting microblog:', error);
      res.status(500).json(buildErrorResponse('Error unreposting microblog', error));
    }
  });

  router.post('/microblogs/:id/bookmark', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogId = parseInt(req.params.id);
      const microblog = await storage.getMicroblog(microblogId);
      if (!microblog || (microblog as any).deletedAt) {
        return res.status(404).json({ message: 'Microblog not found' });
      }

      const bookmark = await storage.bookmarkMicroblog(microblogId, userId);
      res.status(201).json(bookmark);
    } catch (error: any) {
      if (error.message === 'Already bookmarked') {
        return res.status(400).json({ message: 'Already bookmarked' });
      }
      console.error('Error bookmarking microblog:', error);
      res.status(500).json(buildErrorResponse('Error bookmarking microblog', error));
    }
  });

  router.delete('/microblogs/:id/bookmark', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogId = parseInt(req.params.id);
      const success = await storage.unbookmarkMicroblog(microblogId, userId);
      if (!success) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      res.json({ message: 'Microblog unbookmarked successfully' });
    } catch (error) {
      console.error('Error unbookmarking microblog:', error);
      res.status(500).json(buildErrorResponse('Error unbookmarking microblog', error));
    }
  });

  return router;
}

export default createMicroblogsRouter();
