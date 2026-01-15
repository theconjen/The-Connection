import { Router } from 'express';
import { IStorage } from '../storage';
import { getUserLanguagePreferences } from '../services/engagementTracking';
import { calculateLanguageMatchScore } from '../services/languageDetection';

const DEFAULT_FEED_LIMIT = 25;
const MAX_FEED_LIMIT = 50;
const MAX_FALLBACK_WINDOW = 500;

const parseLimit = (raw: unknown): number => {
  if (Array.isArray(raw)) raw = raw[0];
  const parsed = raw !== undefined ? parseInt(String(raw), 10) : DEFAULT_FEED_LIMIT;
  if (!Number.isFinite(parsed)) return DEFAULT_FEED_LIMIT;
  return Math.min(MAX_FEED_LIMIT, Math.max(1, parsed));
};

/**
 * Calculate feed score for a post based on recency and language match
 */
function calculateFeedScore(
  post: any,
  userLanguages: string[],
  now: number
): number {
  // Recency score (decays over time)
  const postTime = new Date(post.createdAt).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);
  let recencyScore = 100;
  if (ageInHours > 2) recencyScore = 90;
  if (ageInHours > 6) recencyScore = 70;
  if (ageInHours > 12) recencyScore = 50;
  if (ageInHours > 24) recencyScore = 30;
  if (ageInHours > 48) recencyScore = 10;

  // Language match score
  const languageScore = calculateLanguageMatchScore(
    post.detectedLanguage,
    userLanguages
  );

  // Engagement score
  const engagement =
    (post.upvotes || 0) * 2 +
    (post.commentCount || 0) * 3 +
    (post.likeCount || 0) * 1;
  const engagementScore = Math.min(100, engagement * 5);

  // Weighted final score (language is most important, then recency, then engagement)
  return (
    languageScore * 0.5 +
    recencyScore * 0.3 +
    engagementScore * 0.2
  );
}

export default function createFeedRouter(storage: IStorage, opts?: { useDb?: boolean }) {
  const router = Router();

  // GET /api/feed (cursor paginated; newest-first assumed by storage.getAllPosts())
  router.get('/feed', async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const limit = parseLimit(req.query.limit);
      const cursor = (req.query.cursor as string | undefined) || null;

      const respondWithStorageFallback = async () => {
        let allPosts = await storage.getAllPosts();
        allPosts = allPosts.slice(0, MAX_FALLBACK_WINDOW);

        // Get user's language preferences
        let userLanguages = ['en']; // Default to English
        if (userId) {
          try {
            userLanguages = await getUserLanguagePreferences(userId);
          } catch (error) {
            console.error('Error getting user language preferences:', error);
          }

          const blockedIds = await storage.getBlockedUserIdsFor(userId);
          if (blockedIds?.length) {
            allPosts = allPosts.filter((p: any) => !blockedIds.includes(p.authorId));
          }
        }

        // Filter out posts from private accounts (unless it's the user's own post)
        allPosts = allPosts.filter((p: any) => {
          // User can see their own posts
          if (userId && p.authorId === userId) return true;
          // Hide posts from private accounts
          if (p.author?.profileVisibility === 'private') return false;
          return true;
        });

        // Score and sort posts by language match, recency, and engagement
        const now = Date.now();
        const scoredPosts = allPosts.map((post: any) => ({
          ...post,
          feedScore: calculateFeedScore(post, userLanguages, now),
        }));

        // Sort by feed score (descending)
        scoredPosts.sort((a: any, b: any) => b.feedScore - a.feedScore);

        let startIndex = 0;
        if (cursor) {
          const idx = scoredPosts.findIndex((p: any) => String(p.id) === cursor);
          if (idx === -1) {
            return res.status(400).json({ message: 'Invalid cursor' });
          }
          startIndex = idx + 1;
        }

        const slice = scoredPosts.slice(startIndex, startIndex + limit);
        const nextCursor = slice.length === limit ? String(slice[slice.length - 1].id) : null;

        return res.json({ items: slice, nextCursor });
      };

      // If DB-backed feed is requested via opts.useDb and not available we fall back
      // to storage-based feed. The server wiring decides whether to pass a DB-backed
      // storage instance or not.
      return respondWithStorageFallback();
    } catch (err) {
      console.error('Error fetching feed:', err);
      res.status(500).json({ message: 'Error fetching feed' });
    }
  });

  return router;
}
