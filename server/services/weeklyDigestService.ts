import { db } from '../db';
import { storage } from '../storage-optimized';
import { notifyUserWithPreferences } from './notificationHelper';
import { posts, prayerRequests, events, communityMembers, users } from '@shared/schema';
import { eq, gte, and, sql, count } from 'drizzle-orm';
import { wasNotificationSent } from './notificationDedup';

/**
 * Weekly Digest Service
 *
 * Sends a summary notification to users every Sunday evening (6-7 PM UTC)
 * with activity highlights from their communities over the past week.
 */

// Track sent digests to prevent duplicates: "userId-isoWeek"
const sentDigests = new Set<string>();

/**
 * Get ISO week string for a date (e.g., "2026-W09")
 */
function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Check if now is Sunday 6-7 PM UTC
 */
function isSundayEveningUTC(): boolean {
  const now = new Date();
  return now.getUTCDay() === 0 && now.getUTCHours() >= 18 && now.getUTCHours() < 19;
}

/**
 * Get community activity counts for the past week
 */
async function getCommunityWeeklyActivity(communityId: number, since: Date): Promise<{
  newPosts: number;
  newPrayerRequests: number;
  upcomingEvents: number;
}> {
  if (!db) return { newPosts: 0, newPrayerRequests: 0, upcomingEvents: 0 };

  try {
    const [postCount] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.communityId, communityId), gte(posts.createdAt, since)));

    const [prayerCount] = await db
      .select({ count: count() })
      .from(prayerRequests)
      .where(and(eq(prayerRequests.communityId, communityId), gte(prayerRequests.createdAt, since)));

    const [eventCount] = await db
      .select({ count: count() })
      .from(events)
      .where(and(eq(events.communityId, communityId), gte(events.createdAt, since)));

    return {
      newPosts: postCount?.count ?? 0,
      newPrayerRequests: prayerCount?.count ?? 0,
      upcomingEvents: eventCount?.count ?? 0,
    };
  } catch (error) {
    console.error(`[WeeklyDigest] Error getting activity for community ${communityId}:`, error);
    return { newPosts: 0, newPrayerRequests: 0, upcomingEvents: 0 };
  }
}

/**
 * Check and send weekly digests
 */
export async function checkAndSendWeeklyDigest(): Promise<void> {
  if (!isSundayEveningUTC()) return;

  try {
    console.info('[WeeklyDigest] Starting weekly digest send...');
    const weekKey = getISOWeekKey(new Date());
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get all users with onboarding completed and community notifications enabled
    const allUsers = await storage.getAllUsers();
    const eligibleUsers = allUsers.filter(
      (u: any) => u.onboardingCompleted && u.notifyCommunities !== false && !u.deletedAt
    );

    console.info(`[WeeklyDigest] Processing ${eligibleUsers.length} eligible users`);
    let sentCount = 0;

    for (const user of eligibleUsers) {
      const digestKey = `${user.id}-${weekKey}`;

      // Fast path: in-memory cache
      if (sentDigests.has(digestKey)) continue;

      // DB fallback: survives server restarts (168h = 1 week)
      if (await wasNotificationSent('weekly_digest', digestKey, 168)) {
        sentDigests.add(digestKey); // Warm cache
        continue;
      }

      try {
        // Get user's communities
        const userCommunities = await storage.getUserCommunities(user.id);
        if (!userCommunities || userCommunities.length === 0) continue;

        // Aggregate activity across all communities
        let totalPosts = 0;
        let totalPrayers = 0;
        let totalEvents = 0;

        for (const community of userCommunities) {
          const activity = await getCommunityWeeklyActivity(community.id, oneWeekAgo);
          totalPosts += activity.newPosts;
          totalPrayers += activity.newPrayerRequests;
          totalEvents += activity.upcomingEvents;
        }

        // Skip users with zero activity
        const totalActivity = totalPosts + totalPrayers + totalEvents;
        if (totalActivity === 0) {
          sentDigests.add(digestKey);
          continue;
        }

        // Build summary
        const parts: string[] = [];
        if (totalPosts > 0) parts.push(`${totalPosts} new post${totalPosts !== 1 ? 's' : ''}`);
        if (totalPrayers > 0) parts.push(`${totalPrayers} prayer request${totalPrayers !== 1 ? 's' : ''}`);
        if (totalEvents > 0) parts.push(`${totalEvents} new event${totalEvents !== 1 ? 's' : ''}`);

        const body = `This week: ${parts.join(', ')} across your communities`;

        await notifyUserWithPreferences(user.id, {
          title: 'Your Weekly Community Digest',
          body,
          data: {
            type: 'weekly_digest',
            weekKey,
            dedupKey: digestKey,
          },
          category: 'community',
        });

        sentDigests.add(digestKey);
        sentCount++;
      } catch (err) {
        console.error(`[WeeklyDigest] Error sending digest to user ${user.id}:`, err);
      }
    }

    console.info(`[WeeklyDigest] Sent ${sentCount} weekly digests`);
  } catch (error) {
    console.error('[WeeklyDigest] Error during weekly digest check:', error);
  }
}

/**
 * Start the weekly digest scheduler
 * Checks every hour; only sends on Sunday 6-7 PM UTC
 */
export function startWeeklyDigestScheduler(): NodeJS.Timeout {
  console.info('[WeeklyDigest] Starting weekly digest scheduler (checks every hour)');

  // Run check immediately on startup
  checkAndSendWeeklyDigest();

  const intervalId = setInterval(() => {
    checkAndSendWeeklyDigest();
  }, 60 * 60 * 1000); // Every hour

  return intervalId;
}
