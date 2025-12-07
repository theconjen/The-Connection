import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { db, sql } from '../db';
import { users, posts, communities, events } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { buildErrorResponse } from '../utils/errors';
import { requireSessionUserId } from '../utils/session';

const router = Router();

// DELETE /me - soft-delete account and owned content
router.delete('/me', requireAuth, async (req: any, res) => {
  try {
    const userId = requireSessionUserId(req);

    await db.transaction(async (tx) => {
      // Soft-delete the user
      await (tx.update(users as any) as any).set({ deletedAt: sql`NOW()` } as any).where(eq(users.id, userId));

      // Soft-delete user's posts
      await (tx.update(posts as any) as any).set({ deletedAt: sql`NOW()` } as any).where(eq(posts.authorId, userId));

      // Soft-delete communities created by the user
      await (tx.update(communities as any) as any).set({ deletedAt: sql`NOW()` } as any).where(eq(communities.createdBy, userId));

      // Soft-delete events created by the user
      await (tx.update(events as any) as any).set({ deletedAt: sql`NOW()` } as any).where(eq(events.creatorId, userId));
    });

    // Destroy the session server-side to be safe
    try {
      req.session.destroy(() => {});
    } catch (e) {
      // ignore
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting account:', err);
    return res.status(500).json(buildErrorResponse('Error deleting account', err));
  }
});

export default router;
