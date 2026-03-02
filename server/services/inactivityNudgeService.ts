import { db } from '../db';
import { storage } from '../storage-optimized';
import { notifyUserWithPreferences } from './notificationHelper';
import { users, prayerRequests } from '@shared/schema';
import { and, gte, lte, isNull, eq, count } from 'drizzle-orm';
import { wasNotificationSent } from './notificationDedup';

/**
 * Inactivity Nudge Service
 *
 * Sends a gentle nudge notification to users who haven't logged in for 5-30 days.
 * Runs every 6 hours to check for inactive users.
 * Maximum 1 nudge per user per week.
 */

// Track nudged users: "userId-isoWeek"
const nudgedUsers = new Set<string>();

/**
 * Get ISO week string for a date
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
 * Get count of new prayer requests across a user's communities in the past week
 */
async function getRecentPrayerCount(userId: number): Promise<number> {
  if (!db) return 0;

  try {
    const userCommunities = await storage.getUserCommunities(userId);
    if (!userCommunities.length) return 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let total = 0;

    for (const community of userCommunities) {
      const [result] = await db
        .select({ count: count() })
        .from(prayerRequests)
        .where(and(eq(prayerRequests.communityId, community.id), gte(prayerRequests.createdAt, oneWeekAgo)));
      total += result?.count ?? 0;
    }

    return total;
  } catch (error) {
    console.error(`[InactivityNudge] Error getting prayer count for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Check and send inactivity nudges
 */
export async function checkAndSendInactivityNudges(): Promise<void> {
  if (!db) return;

  try {
    console.info('[InactivityNudge] Checking for inactive users...');
    const weekKey = getISOWeekKey(new Date());

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query users inactive 5-30 days, with onboarding completed
    const inactiveUsers = await db
      .select({
        id: users.id,
        lastLoginAt: users.lastLoginAt,
        displayName: users.displayName,
        username: users.username,
      })
      .from(users)
      .where(
        and(
          eq(users.onboardingCompleted, true),
          isNull(users.deletedAt),
          lte(users.lastLoginAt, fiveDaysAgo),
          gte(users.lastLoginAt, thirtyDaysAgo)
        )
      );

    console.info(`[InactivityNudge] Found ${inactiveUsers.length} inactive users (5-30 days)`);
    let sentCount = 0;

    for (const user of inactiveUsers) {
      const nudgeKey = `${user.id}-${weekKey}`;

      // Fast path: in-memory cache
      if (nudgedUsers.has(nudgeKey)) continue;

      // DB fallback: survives server restarts (168h = 1 week)
      if (await wasNotificationSent('inactivity_nudge', nudgeKey, 168)) {
        nudgedUsers.add(nudgeKey); // Warm cache
        continue;
      }

      try {
        const prayerCount = await getRecentPrayerCount(user.id);

        const body = prayerCount > 0
          ? `Your community misses you — ${prayerCount} new prayer request${prayerCount !== 1 ? 's' : ''} this week`
          : 'Your community misses you — check in and see what\'s new';

        await notifyUserWithPreferences(user.id, {
          title: 'We miss you!',
          body,
          data: {
            type: 'inactivity_nudge',
            dedupKey: nudgeKey,
          },
          category: 'community',
        });

        nudgedUsers.add(nudgeKey);
        sentCount++;
      } catch (err) {
        console.error(`[InactivityNudge] Error sending nudge to user ${user.id}:`, err);
      }
    }

    console.info(`[InactivityNudge] Sent ${sentCount} inactivity nudges`);
  } catch (error) {
    console.error('[InactivityNudge] Error during nudge check:', error);
  }
}

/**
 * Start the inactivity nudge scheduler
 * Checks every 6 hours
 */
export function startInactivityNudgeScheduler(): NodeJS.Timeout {
  console.info('[InactivityNudge] Starting inactivity nudge scheduler (checks every 6 hours)');

  // Delay first check by 5 minutes to let server fully start
  setTimeout(() => checkAndSendInactivityNudges(), 5 * 60 * 1000);

  const intervalId = setInterval(() => {
    checkAndSendInactivityNudges();
  }, 6 * 60 * 60 * 1000); // Every 6 hours

  return intervalId;
}
