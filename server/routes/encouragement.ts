/**
 * Encouragement Drop Routes
 *
 * Anonymous encouragement between users. Each user can send one per day
 * to a randomly selected recipient.
 *
 * POST /api/encouragement/send     - Send anonymous encouragement
 * GET  /api/encouragement/received  - Check if user received encouragement today
 * GET  /api/encouragement/status    - Check if user already sent today
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { db, sql } from '../db';
import { encouragements } from '@shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

const router = Router();

/** Get start of today (midnight UTC) */
function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// ============================================================================
// POST /api/encouragement/send — Send anonymous encouragement to a random user
// ============================================================================

router.post('/send', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!db || !sql) return res.status(503).json({ error: 'Database unavailable' });

    const todayStart = startOfTodayUTC();

    // Check if already sent today (server-side enforcement)
    const existing = await db
      .select({ id: encouragements.id })
      .from(encouragements)
      .where(
        and(
          eq(encouragements.senderId, userId),
          gte(encouragements.createdAt, todayStart)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(429).json({ error: 'Already sent encouragement today', alreadySent: true });
    }

    // Pick a random active recipient (exclude sender, deleted, and banned users)
    const randomUsers = await sql`
      SELECT id FROM users
      WHERE id != ${userId}
        AND deleted_at IS NULL
      ORDER BY random()
      LIMIT 1
    `;

    if (!randomUsers || randomUsers.length === 0) {
      return res.status(404).json({ error: 'No recipients available' });
    }

    const recipientId = randomUsers[0].id as number;

    // Create the encouragement record
    const [created] = await db
      .insert(encouragements)
      .values({
        senderId: userId,
        recipientId,
        message: req.body?.message || null,
      })
      .returning();

    return res.status(201).json({ ok: true, id: created.id });
  } catch (err: any) {
    // Don't mask auth errors from requireSessionUserId
    if (err?.status === 401) throw err;
    console.error('[ENCOURAGEMENT] Error sending:', err);
    return res.status(500).json({ error: 'Failed to send encouragement' });
  }
});

// ============================================================================
// GET /api/encouragement/received — Check if user received encouragement today
// ============================================================================

router.get('/received', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const todayStart = startOfTodayUTC();

    const received = await db
      .select({
        id: encouragements.id,
        message: encouragements.message,
        createdAt: encouragements.createdAt,
      })
      .from(encouragements)
      .where(
        and(
          eq(encouragements.recipientId, userId),
          gte(encouragements.createdAt, todayStart)
        )
      )
      .orderBy(desc(encouragements.createdAt))
      .limit(1);

    if (received.length === 0) {
      return res.json({ received: false });
    }

    return res.json({
      received: true,
      message: received[0].message || 'A fellow believer is thinking of you today',
      createdAt: received[0].createdAt,
    });
  } catch (err: any) {
    if (err?.status === 401) throw err;
    console.error('[ENCOURAGEMENT] Error checking received:', err);
    return res.status(500).json({ error: 'Failed to check encouragement' });
  }
});

// ============================================================================
// GET /api/encouragement/status — Check if user already sent today
// ============================================================================

router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!db) return res.status(503).json({ error: 'Database unavailable' });

    const todayStart = startOfTodayUTC();

    const sent = await db
      .select({ id: encouragements.id })
      .from(encouragements)
      .where(
        and(
          eq(encouragements.senderId, userId),
          gte(encouragements.createdAt, todayStart)
        )
      )
      .limit(1);

    return res.json({ alreadySent: sent.length > 0 });
  } catch (err: any) {
    if (err?.status === 401) throw err;
    console.error('[ENCOURAGEMENT] Error checking status:', err);
    return res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
