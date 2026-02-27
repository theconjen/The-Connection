/**
 * Analytics Event Tracking Service
 * Lightweight event tracking for platform analytics (DAU/WAU/MAU, trends, etc.)
 */

import { db } from '../db';
import { analyticsEvents } from '@shared/schema';
import { eq, and, gte, sql, count, desc } from 'drizzle-orm';

export type AnalyticsEventType =
  | 'page_view'
  | 'login'
  | 'signup'
  | 'post_created'
  | 'microblog_created'
  | 'event_created'
  | 'event_rsvp'
  | 'community_join'
  | 'community_leave'
  | 'search'
  | 'message_sent'
  | 'prayer_created'
  | 'report_filed';

/**
 * Track an analytics event (fire-and-forget)
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  userId?: number | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      eventType,
      userId: userId ?? undefined,
      metadata: metadata ?? undefined,
    });
  } catch (error) {
    // Fire-and-forget: don't let analytics failures break the app
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Get active user counts for different time periods
 */
export async function getActiveUserCounts() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dau, wau, mau] = await Promise.all([
    db.select({ count: sql<number>`count(distinct ${analyticsEvents.userId})` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, oneDayAgo)),
    db.select({ count: sql<number>`count(distinct ${analyticsEvents.userId})` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, sevenDaysAgo)),
    db.select({ count: sql<number>`count(distinct ${analyticsEvents.userId})` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, thirtyDaysAgo)),
  ]);

  return {
    dau: Number(dau[0]?.count ?? 0),
    wau: Number(wau[0]?.count ?? 0),
    mau: Number(mau[0]?.count ?? 0),
  };
}

/**
 * Get event counts grouped by type for a time period
 */
export async function getEventCountsByType(since: Date) {
  const results = await db
    .select({
      eventType: analyticsEvents.eventType,
      count: count(),
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.eventType)
    .orderBy(desc(count()));

  return results;
}

/**
 * Get signup trend (daily signups for last N days)
 */
export async function getSignupTrend(days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      date: sql<string>`date(${analyticsEvents.createdAt})`,
      count: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, 'signup'),
        gte(analyticsEvents.createdAt, since)
      )
    )
    .groupBy(sql`date(${analyticsEvents.createdAt})`)
    .orderBy(sql`date(${analyticsEvents.createdAt})`);

  return results;
}
