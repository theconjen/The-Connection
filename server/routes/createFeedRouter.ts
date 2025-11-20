import { Router } from 'express';
import { IStorage } from '../storage';

const DEFAULT_FEED_LIMIT = 25;
const MAX_FEED_LIMIT = 50;
const MAX_FALLBACK_WINDOW = 500;

const parseLimit = (raw: unknown): number => {
  if (Array.isArray(raw)) raw = raw[0];
  const parsed = raw !== undefined ? parseInt(String(raw), 10) : DEFAULT_FEED_LIMIT;
  if (!Number.isFinite(parsed)) return DEFAULT_FEED_LIMIT;
  return Math.min(MAX_FEED_LIMIT, Math.max(1, parsed));
};

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

        if (userId) {
          const blockedIds = await storage.getBlockedUserIdsFor(userId);
          if (blockedIds?.length) {
            allPosts = allPosts.filter((p: any) => !blockedIds.includes(p.authorId));
          }
        }

        let startIndex = 0;
        if (cursor) {
          const idx = allPosts.findIndex((p: any) => String(p.id) === cursor);
          if (idx === -1) {
            return res.status(400).json({ message: 'Invalid cursor' });
          }
          startIndex = idx + 1;
        }

        const slice = allPosts.slice(startIndex, startIndex + limit);
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
