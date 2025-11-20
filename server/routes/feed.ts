import { Router } from 'express';
import { storage } from '../storage-optimized';
import { db } from '../db';
import { posts, userBlocks } from '@shared/schema';
import { and, desc, inArray, lt, not, eq } from 'drizzle-orm';
import { getSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

const DEFAULT_FEED_LIMIT = 25;
const MAX_FEED_LIMIT = 50;
const MAX_FALLBACK_WINDOW = 500;

const envFeedFlag = process.env.FEED_USE_DB;
const defaultDbFeed = process.env.NODE_ENV !== 'test' && process.env.USE_DB === 'true';
const USE_DB_FEED = envFeedFlag ? envFeedFlag === 'true' : defaultDbFeed;
let warnedMissingDb = false;

const parseLimit = (raw: unknown): number => {
  if (Array.isArray(raw)) raw = raw[0];
  const parsed = raw !== undefined ? parseInt(String(raw), 10) : DEFAULT_FEED_LIMIT;
  if (!Number.isFinite(parsed)) return DEFAULT_FEED_LIMIT;
  return Math.min(MAX_FEED_LIMIT, Math.max(1, parsed));
};

// GET /api/feed (cursor paginated; newest-first assumed by storage.getAllPosts())
// Response shape: { items: Post[], nextCursor: string | null }
router.get('/feed', async (req, res) => {
  try {
    const userId = getSessionUserId(req);
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

    const dbAvailable = Boolean(db);
    if (USE_DB_FEED && !dbAvailable && !warnedMissingDb) {
      console.warn('[feed] USE_DB_FEED enabled but database client unavailable; using storage fallback');
      warnedMissingDb = true;
    }

    if (USE_DB_FEED && dbAvailable) {
      try {
        let blockedIds: number[] = [];
        if (userId) {
          const rows = await db!
            .select({ blockedId: userBlocks.blockedId })
            .from(userBlocks)
            .where(eq(userBlocks.blockerId, userId as number));
          blockedIds = rows.map(r => r.blockedId).filter((v): v is number => typeof v === 'number');
        }

        const whereClauses = [] as any[];
        if (cursor) {
          const cursorNum = Number(cursor);
          if (!Number.isFinite(cursorNum)) {
            return res.status(400).json({ message: 'Invalid cursor' });
          }
          whereClauses.push(lt(posts.id, cursorNum));
        }
        if (blockedIds.length) {
          whereClauses.push(not(inArray(posts.authorId, blockedIds)));
        }

        const rows = await db!
          .select()
          .from(posts)
          .where(whereClauses.length ? and(...whereClauses) : undefined)
          .orderBy(desc(posts.id))
          .limit(limit + 1);

        const items = rows.slice(0, limit);
        if (items.length || cursor === null) {
          const nextCursor = rows.length > limit ? String(rows[limit].id) : null;
          return res.json({ items, nextCursor });
        }
        // No rows returned (e.g., DB empty) -> fall back
        return respondWithStorageFallback();
      } catch (dbErr) {
        console.warn('DB feed query failed, falling back to storage-based feed:', dbErr);
      }
    }

    return respondWithStorageFallback();
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).json(buildErrorResponse('Error fetching feed', err));
  }
});

export default router;
