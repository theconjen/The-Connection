import { Router } from 'express';
import { storage } from '../storage-optimized';
import { db } from '../db';
import { posts, userBlocks } from '@shared/schema';
import { and, desc, inArray, lt, not, eq } from 'drizzle-orm';
import { getSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';

const router = Router();

// Prefer DB-backed pagination when explicitly enabled
const USE_DB_FEED = process.env.FEED_USE_DB === 'true';
if (!USE_DB_FEED && process.env.NODE_ENV !== 'test') {
  console.warn('[feed] FEED_USE_DB not set, using in-memory fallback');
}

// GET /api/feed (cursor paginated; newest-first assumed by storage.getAllPosts())
// Response shape: { items: Post[], nextCursor: string | null }
router.get('/feed', async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const limit = 25; // page size
    const cursor = (req.query.cursor as string | undefined) || null;

    const respondWithStorageFallback = async () => {
      let allPosts = await storage.getAllPosts();
      // Hard cap window for performance safety
      allPosts = allPosts.slice(0, 500);

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
        startIndex = idx + 1; // start after the cursor item
      }

      const slice = allPosts.slice(startIndex, startIndex + limit);
      const nextCursor = slice.length === limit ? String(slice[slice.length - 1].id) : null;

      return res.json({ items: slice, nextCursor });
    };

    if (USE_DB_FEED) {
      try {
        // Determine blocked author IDs if user is logged in
        let blockedIds: number[] = [];
        if (userId) {
          const rows = await db
            .select({ blockedId: userBlocks.blockedId })
            .from(userBlocks)
            .where(eq(userBlocks.blockerId, userId as number));
          blockedIds = rows.map(r => r.blockedId).filter((v): v is number => typeof v === 'number');
        }

        const whereClauses = [] as any[];
        // Use numeric ID cursor with descending id ordering
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

        const rows = await db
          .select()
          .from(posts)
          .where(whereClauses.length ? and(...whereClauses) : undefined)
          .orderBy(desc(posts.id))
          .limit(limit + 1);

        if (rows.length === 0) {
          return respondWithStorageFallback();
        }

        const items = rows.slice(0, limit);
        const nextCursor = rows.length > limit ? String(rows[limit].id) : null;
        return res.json({ items, nextCursor });
      } catch (dbErr) {
        // Fall through to storage-based implementation on DB errors
        console.warn('DB feed query failed, falling back to storage-based feed:', dbErr);
      }
    }

    return respondWithStorageFallback();
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).json(buildErrorResponse('Error fetching feed', error));
  }
});

export default router;
