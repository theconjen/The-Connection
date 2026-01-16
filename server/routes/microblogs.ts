import { Router } from 'express';
import { insertCommentSchema, insertMicroblogSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage as defaultStorage } from '../storage-optimized';
import { contentCreationLimiter, messageCreationLimiter } from '../rate-limiters';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { sortByFeedScore } from '../algorithms/christianFeedScoring';
import { detectLanguage } from '../services/languageDetection';
import { trackEngagement } from '../services/engagementTracking';

export function createMicroblogsRouter(storage = defaultStorage) {
  const router = Router();

  // Get trending hashtags (MUST be before /microblogs/:id route)
  router.get('/microblogs/hashtags/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingHashtags(Math.min(limit, 20));
      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      res.status(500).json(buildErrorResponse('Error fetching trending hashtags', error));
    }
  });

  // Get microblogs by hashtag (MUST be before /microblogs/:id route)
  router.get('/microblogs/hashtags/:tag', async (req, res) => {
    try {
      const { tag } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = getSessionUserId(req);

      const microblogs = await storage.getMicroblogsByHashtag(tag, Math.min(limit, 50));

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
      console.error('Error fetching microblogs by hashtag:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblogs by hashtag', error));
    }
  });

  // Get trending keywords (MUST be before /microblogs/:id route)
  router.get('/microblogs/keywords/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await storage.getTrendingKeywords(Math.min(limit, 20));
      res.json(trending);
    } catch (error) {
      console.error('Error fetching trending keywords:', error);
      res.status(500).json(buildErrorResponse('Error fetching trending keywords', error));
    }
  });

  // Get microblogs by keyword (MUST be before /microblogs/:id route)
  router.get('/microblogs/keywords/:keyword', async (req, res) => {
    try {
      const { keyword } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const userId = getSessionUserId(req);

      const microblogs = await storage.getMicroblogsByKeyword(keyword, Math.min(limit, 50));

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
      console.error('Error fetching microblogs by keyword:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblogs by keyword', error));
    }
  });

  // Get combined trending (hashtags + keywords) (MUST be before /microblogs/:id route)
  router.get('/microblogs/trending/combined', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const halfLimit = Math.ceil(limit / 2);

      // Get top hashtags and keywords
      const [hashtags, keywords] = await Promise.all([
        storage.getTrendingHashtags(halfLimit),
        storage.getTrendingKeywords(halfLimit),
      ]);

      // Combine and sort by trending score
      const combined = [
        ...hashtags.map(h => ({ type: 'hashtag', ...h })),
        ...keywords.map(k => ({ type: 'keyword', ...k })),
      ].sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0))
        .slice(0, limit);

      res.json(combined);
    } catch (error) {
      console.error('Error fetching combined trending:', error);
      res.status(500).json(buildErrorResponse('Error fetching combined trending', error));
    }
  });

  router.get('/microblogs', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const filter = (req.query.filter as string) || 'recent'; // 'recent' or 'popular'

      let microblogs: any[] = [];

      if (userId) {
        if (filter === 'popular') {
          // Popular: mix of followed users' posts + most popular posts
          const [followingMicroblogs, allMicroblogs] = await Promise.all([
            storage.getFollowingMicroblogs(userId),
            storage.getAllMicroblogs()
          ]);

          if (followingMicroblogs.length === 0) {
            // Not following anyone: show all posts scored by algorithm
            microblogs = allMicroblogs;
          } else {
            // Combine followed posts + top popular posts
            const followingSet = new Set(followingMicroblogs.map(m => m.id));
            const popularMicroblogs = sortByFeedScore(allMicroblogs.filter(m => !followingSet.has(m.id))).slice(0, 20);
            microblogs = [...followingMicroblogs, ...popularMicroblogs];
          }
        } else {
          // Recent: show posts from followed users, or all posts if not following anyone
          const followingMicroblogs = await storage.getFollowingMicroblogs(userId);

          if (followingMicroblogs.length === 0) {
            // Not following anyone: show all posts
            microblogs = await storage.getAllMicroblogs();
          } else {
            microblogs = followingMicroblogs;
          }
        }
      } else {
        // Not logged in: show all microblogs
        microblogs = await storage.getAllMicroblogs();
      }

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

      // Apply final sorting
      let sortedMicroblogs = enrichedMicroblogs;
      if (filter === 'popular') {
        // Use Christian values + engagement feed algorithm
        sortedMicroblogs = sortByFeedScore(enrichedMicroblogs);
      } else {
        // Recent: sort by creation date (most recent first)
        sortedMicroblogs = enrichedMicroblogs.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      res.json(sortedMicroblogs);
    } catch (error) {
      console.error('Error fetching microblogs:', error);
      res.status(500).json(buildErrorResponse('Error fetching microblogs', error));
    }
  });

  // Get user's bookmarked microblogs (MUST come before /:id route)
  router.get('/microblogs/bookmarks', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const microblogs = await storage.getUserBookmarkedMicroblogs(userId);

      // Filter out any microblogs with invalid IDs
      const validMicroblogs = microblogs.filter(m => m && m.id != null && !isNaN(m.id));

      // Enrich microblogs with author data and engagement status
      const enrichedMicroblogs = await Promise.all(
        validMicroblogs.map(async (microblog) => {
          const author = await storage.getUser(microblog.authorId);
          const isLiked = await storage.hasUserLikedMicroblog(microblog.id, userId);
          const isReposted = await storage.hasUserRepostedMicroblog(microblog.id, userId);

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
            isBookmarked: true, // Always true for bookmarked microblogs
          };
        })
      );

      res.json(enrichedMicroblogs);
    } catch (error) {
      console.error('Error fetching bookmarked microblogs:', error);
      res.status(500).json(buildErrorResponse('Error fetching bookmarked microblogs', error));
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

      // Detect and update language asynchronously (don't block response)
      Promise.resolve().then(async () => {
        try {
          const detectedLanguage = detectLanguage(validatedData.content);
          await storage.updateMicroblog(microblog.id, { detectedLanguage } as any);
          console.info(`[Language] Detected ${detectedLanguage} for microblog ${microblog.id}`);
        } catch (error) {
          console.error('Error detecting language for microblog:', error);
        }
      });

      // Process hashtags asynchronously (don't block response)
      storage.processMicroblogHashtags(microblog.id, validatedData.content)
        .catch(error => console.error('Error processing hashtags:', error));

      // Process keywords asynchronously (don't block response)
      storage.processMicroblogKeywords(microblog.id, validatedData.content)
        .catch(error => console.error('Error processing keywords:', error));

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

      // Check if already liked
      const isLiked = await storage.hasUserLikedMicroblog(microblogId, userId);

      if (isLiked) {
        // Already liked - return success (idempotent)
        return res.status(200).json({ message: 'Microblog already liked', alreadyLiked: true });
      }

      const like = await storage.likeMicroblog(microblogId, userId);

      // Track engagement for language personalization (asynchronously)
      trackEngagement(userId, microblogId, 'microblog', 'like')
        .catch(error => console.error('Error tracking engagement:', error));

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

      // Check if already bookmarked
      const isBookmarked = await storage.hasUserBookmarkedMicroblog(microblogId, userId);

      if (isBookmarked) {
        // Already bookmarked - return success (idempotent)
        return res.status(200).json({ message: 'Microblog already bookmarked', alreadyBookmarked: true });
      }

      const bookmark = await storage.bookmarkMicroblog(microblogId, userId);
      res.status(201).json(bookmark);
    } catch (error: any) {
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
