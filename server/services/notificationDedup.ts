import { db } from '../db';
import { notifications } from '@shared/schema';
import { and, gte, sql } from 'drizzle-orm';

/**
 * Notification Dedup Service
 *
 * Checks the notifications table to prevent duplicate notifications
 * after server restarts. Uses the `data` JSONB column which stores
 * `type` and `dedupKey` fields.
 *
 * In-memory Sets in each service act as a fast cache for the common case.
 * This DB check is the fallback that survives restarts.
 */

/**
 * Check if a notification of this type+key was already sent within a time window.
 *
 * @param type - Notification type (e.g., 'event_reminder', 'weekly_digest')
 * @param dedupKey - Unique key for this notification instance
 * @param windowHours - How far back to look (hours)
 * @returns True if already sent (should skip sending)
 */
export async function wasNotificationSent(
  type: string,
  dedupKey: string,
  windowHours: number
): Promise<boolean> {
  if (!db) return false;

  try {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          sql`${notifications.data}->>'type' = ${type}`,
          sql`${notifications.data}->>'dedupKey' = ${dedupKey}`,
          gte(notifications.createdAt, since)
        )
      )
      .limit(1);

    return (result?.count ?? 0) > 0;
  } catch (error) {
    console.error('[NotificationDedup] Error checking dedup:', error);
    // On error, allow sending (better to duplicate than miss)
    return false;
  }
}
