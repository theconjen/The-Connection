import { Router } from 'express';
import { insertCommentSchema, insertMicroblogSchema, MICROBLOG_TOPICS, MICROBLOG_TYPES } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage as defaultStorage } from '../storage-optimized';
import { contentCreationLimiter, messageCreationLimiter } from '../rate-limiters';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { sortByFeedScore } from '../algorithms/christianFeedScoring';
import { detectLanguage } from '../services/languageDetection';
import { trackEngagement } from '../services/engagementTracking';
import { notifyUserWithPreferences, truncateText, getUserDisplayName } from '../services/notificationHelper';

// Ranking configuration for explore feed (easy to tune later)
const RANKING_CONFIG = {
  weights: {
    bookmarks: 5.0,        // Heavy weight on bookmarks
    uniqueRepliers: 4.0,   // Heavy weight on unique repliers
    pollVotes: 3.0,        // Heavy weight on poll votes
    reposts: 2.0,          // Medium weight on reposts
    likes: 0.5,            // Tiny weight on likes (avoid like farming)
    comments: 1.5,         // Medium weight on comments
  },
  decay: {
    halfLifeHours: 48,     // Score halves every 48 hours
  },
  eligibility: {
    minPollVotes: 10,      // Polls need 10+ votes to be "popular eligible"
    minUniqueRepliers: 2,  // OR 2+ unique repliers
    minBookmarks: 2,       // OR 2+ bookmarks
    hasSourceUrl: true,    // OR has sourceUrl (NEWS posts)
  },
};

// Calculate popularity score with time decay
function calculatePopularityScore(microblog: any): number {
  const { weights, decay } = RANKING_CONFIG;

  // Raw engagement score
  const rawScore =
    (microblog.bookmarkCount || 0) * weights.bookmarks +
    (microblog.uniqueReplierCount || 0) * weights.uniqueRepliers +
    (microblog.pollVoteCount || 0) * weights.pollVotes +
    (microblog.repostCount || 0) * weights.reposts +
    (microblog.likeCount || 0) * weights.likes +
    (microblog.replyCount || 0) * weights.comments;

  // Apply time decay
  const ageHours = (Date.now() - new Date(microblog.createdAt).getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.pow(0.5, ageHours / decay.halfLifeHours);

  return rawScore * decayFactor;
}

// Check if microblog is eligible for "popular" tab
function isPopularEligible(microblog: any): boolean {
  const { eligibility } = RANKING_CONFIG;

  // Poll posts eligible if enough votes
  if (microblog.postType === 'POLL' && (microblog.pollVoteCount || 0) >= eligibility.minPollVotes) {
    return true;
  }

  // Check engagement thresholds
  if ((microblog.uniqueReplierCount || 0) >= eligibility.minUniqueRepliers) return true;
  if ((microblog.bookmarkCount || 0) >= eligibility.minBookmarks) return true;

  // News/external link posts are eligible
  if (eligibility.hasSourceUrl && microblog.sourceUrl) return true;

  return false;
}

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
      const { poll, ...microblogData } = req.body;

      // Validate topic if provided
      if (microblogData.topic && !MICROBLOG_TOPICS.includes(microblogData.topic)) {
        return res.status(400).json({ message: `Invalid topic. Must be one of: ${MICROBLOG_TOPICS.join(', ')}` });
      }

      // Validate postType if provided
      if (microblogData.postType && !MICROBLOG_TYPES.includes(microblogData.postType)) {
        return res.status(400).json({ message: `Invalid postType. Must be one of: ${MICROBLOG_TYPES.join(', ')}` });
      }

      let pollId: number | null = null;

      // If this is a POLL type post, create the poll first
      if (microblogData.postType === 'POLL') {
        if (!poll || !poll.question || !Array.isArray(poll.options) || poll.options.length < 2) {
          return res.status(400).json({
            message: 'Poll posts require a poll object with question and at least 2 options',
          });
        }

        // Create the poll
        const createdPoll = await storage.createPoll({
          question: poll.question,
          endsAt: poll.endsAt ? new Date(poll.endsAt) : null,
          allowMultiple: poll.allowMultiple || false,
        });

        // Create poll options
        for (let i = 0; i < poll.options.length; i++) {
          await storage.createPollOption({
            pollId: createdPoll.id,
            text: poll.options[i],
            orderIndex: i,
          });
        }

        pollId = createdPoll.id;
      }

      const validatedData = insertMicroblogSchema.parse({
        ...microblogData,
        authorId: userId,
        pollId,
        topic: microblogData.topic || 'OTHER',
        postType: microblogData.postType || 'STANDARD',
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

      // If poll was created, include poll data in response
      let responseData: any = microblog;
      if (pollId) {
        const pollWithOptions = await storage.getPollWithOptions(pollId);
        responseData = { ...microblog, poll: pollWithOptions };
      }

      res.status(201).json(responseData);
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

      // Notify author about the like (async, don't block response)
      const microblog = await storage.getMicroblog(microblogId);
      if (microblog && microblog.authorId !== userId) {
        getUserDisplayName(userId).then(async (likerName) => {
          await notifyUserWithPreferences(microblog.authorId, {
            title: `${likerName} liked your post`,
            body: truncateText(microblog.content, 80),
            data: {
              type: 'microblog_like',
              microblogId: microblog.id,
              userId: userId,
            },
            category: 'feed',
          });
        }).catch(error => console.error('[Microblogs] Error sending like notification:', error));
      }

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

      // Notify microblog author about the comment (async, don't block response)
      if (microblog.authorId !== userId) {
        getUserDisplayName(userId).then(async (commenterName) => {
          await notifyUserWithPreferences(microblog.authorId, {
            title: `${commenterName} commented on your post`,
            body: truncateText(validatedData.content, 80),
            data: {
              type: 'microblog_comment',
              microblogId: microblog.id,
              commentId: comment.id,
              userId: userId,
            },
            category: 'feed',
          });
        }).catch(error => console.error('[Microblogs] Error sending comment notification:', error));
      }

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

      // Notify microblog author about the repost (async, don't block response)
      if (microblog.authorId !== userId) {
        getUserDisplayName(userId).then(async (reposterName) => {
          await notifyUserWithPreferences(microblog.authorId, {
            title: `${reposterName} reposted your post`,
            body: truncateText(microblog.content, 80),
            data: {
              type: 'microblog_repost',
              microblogId: microblog.id,
              userId: userId,
            },
            category: 'feed',
          });
        }).catch(error => console.error('[Microblogs] Error sending repost notification:', error));
      }

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

  // ============================================================================
  // POLLS ENDPOINTS
  // ============================================================================

  // Vote on a poll
  router.post('/polls/:pollId/vote', requireAuth, async (req, res) => {
    try {
      const userId = requireSessionUserId(req);
      const pollId = parseInt(req.params.pollId);
      const { optionId, optionIds } = req.body;

      if (!Number.isFinite(pollId)) {
        return res.status(400).json({ message: 'Invalid poll ID' });
      }

      // Get poll to check if it exists and if voting is allowed
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }

      // Check if poll has ended
      if (poll.endsAt && new Date(poll.endsAt) < new Date()) {
        return res.status(400).json({ message: 'This poll has ended' });
      }

      // Handle single or multiple option voting
      let selectedOptionIds: number[] = [];
      if (poll.allowMultiple && Array.isArray(optionIds)) {
        selectedOptionIds = optionIds.filter((id: any) => Number.isFinite(id));
      } else if (Number.isFinite(optionId)) {
        selectedOptionIds = [optionId];
      } else {
        return res.status(400).json({ message: 'Please provide optionId or optionIds' });
      }

      if (selectedOptionIds.length === 0) {
        return res.status(400).json({ message: 'At least one option must be selected' });
      }

      // Validate all options belong to this poll
      const pollOptions = await storage.getPollOptions(pollId);
      const validOptionIds = new Set(pollOptions.map(o => o.id));
      for (const id of selectedOptionIds) {
        if (!validOptionIds.has(id)) {
          return res.status(400).json({ message: `Option ${id} does not belong to this poll` });
        }
      }

      // For single-vote polls, remove existing votes first
      if (!poll.allowMultiple) {
        await storage.removeUserPollVotes(pollId, userId);
      }

      // Cast votes
      const votes = await storage.castPollVotes(pollId, userId, selectedOptionIds);

      // Get updated poll with results
      const updatedPoll = await storage.getPollWithOptions(pollId, userId);

      res.status(201).json({
        message: 'Vote recorded successfully',
        poll: updatedPoll,
      });
    } catch (error: any) {
      if (error.message === 'Already voted for this option') {
        return res.status(400).json({ message: error.message });
      }
      console.error('Error voting on poll:', error);
      res.status(500).json(buildErrorResponse('Error voting on poll', error));
    }
  });

  // Get poll results
  router.get('/polls/:pollId', async (req, res) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const userId = getSessionUserId(req);

      if (!Number.isFinite(pollId)) {
        return res.status(400).json({ message: 'Invalid poll ID' });
      }

      const poll = await storage.getPollWithOptions(pollId, userId || undefined);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }

      res.json(poll);
    } catch (error) {
      console.error('Error fetching poll:', error);
      res.status(500).json(buildErrorResponse('Error fetching poll', error));
    }
  });

  // ============================================================================
  // EXPLORE FEED ENDPOINT
  // ============================================================================

  // GET /api/feed/explore?tab=latest|popular&topic=&type=&cursor=
  router.get('/feed/explore', async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      const tab = (req.query.tab as string) || 'latest';
      const topic = req.query.topic as string; // Filter by topic
      const postType = req.query.type as string; // Filter by post type (STANDARD, POLL)
      const cursor = req.query.cursor as string; // Pagination cursor (ISO timestamp)
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      // Validate tab
      if (!['latest', 'popular'].includes(tab)) {
        return res.status(400).json({ message: 'Invalid tab. Must be "latest" or "popular"' });
      }

      // Validate topic if provided
      if (topic && !MICROBLOG_TOPICS.includes(topic as any)) {
        return res.status(400).json({ message: `Invalid topic. Must be one of: ${MICROBLOG_TOPICS.join(', ')}` });
      }

      // Validate postType if provided
      if (postType && !MICROBLOG_TYPES.includes(postType as any)) {
        return res.status(400).json({ message: `Invalid type. Must be one of: ${MICROBLOG_TYPES.join(', ')}` });
      }

      // Fetch microblogs with filters
      let microblogs = await storage.getExploreFeedMicroblogs({
        topic: topic || undefined,
        postType: postType || undefined,
        cursor: cursor ? new Date(cursor) : undefined,
        limit: limit + 1, // Fetch one extra to determine if there are more
      });

      // Determine if there's a next page
      const hasMore = microblogs.length > limit;
      if (hasMore) {
        microblogs = microblogs.slice(0, limit);
      }

      // For popular tab, filter by eligibility and sort by score
      if (tab === 'popular') {
        microblogs = microblogs
          .filter(isPopularEligible)
          .map(m => ({ ...m, popularityScore: calculatePopularityScore(m) }))
          .sort((a, b) => (b as any).popularityScore - (a as any).popularityScore);
      }

      // Enrich microblogs with author data and user engagement status
      const enrichedMicroblogs = await Promise.all(
        microblogs.map(async (microblog) => {
          const author = await storage.getUser(microblog.authorId);
          const isLiked = userId ? await storage.hasUserLikedMicroblog(microblog.id, userId) : false;
          const isReposted = userId ? await storage.hasUserRepostedMicroblog(microblog.id, userId) : false;
          const isBookmarked = userId ? await storage.hasUserBookmarkedMicroblog(microblog.id, userId) : false;

          // Include poll data if this is a poll post
          let pollData = null;
          if (microblog.postType === 'POLL' && microblog.pollId) {
            pollData = await storage.getPollWithOptions(microblog.pollId, userId || undefined);
          }

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
            poll: pollData,
          };
        })
      );

      // Calculate next cursor
      const nextCursor = hasMore && enrichedMicroblogs.length > 0
        ? enrichedMicroblogs[enrichedMicroblogs.length - 1].createdAt
        : null;

      res.json({
        microblogs: enrichedMicroblogs,
        hasMore,
        nextCursor,
      });
    } catch (error) {
      console.error('Error fetching explore feed:', error);
      res.status(500).json(buildErrorResponse('Error fetching explore feed', error));
    }
  });

  // Get available topics for filtering
  router.get('/feed/topics', async (_req, res) => {
    try {
      res.json({
        topics: MICROBLOG_TOPICS,
        types: MICROBLOG_TYPES,
      });
    } catch (error) {
      console.error('Error fetching topics:', error);
      res.status(500).json(buildErrorResponse('Error fetching topics', error));
    }
  });

  return router;
}

export default createMicroblogsRouter();
