import { db } from '../db';
import { sql } from 'drizzle-orm';
import { notifyMultipleUsers } from './notificationHelper';
import { wasNotificationSent } from './notificationDedup';

/**
 * Community Milestone Notification Service
 *
 * Sends milestone notifications when communities hit member thresholds:
 * 10, 25, 50, 100, 250, 500, 1000
 *
 * Runs every 6 hours. Each milestone fires only once per community.
 */

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

function getMilestoneReached(memberCount: number): number | null {
  // Find the highest milestone this community has reached
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (memberCount >= MILESTONES[i]) {
      return MILESTONES[i];
    }
  }
  return null;
}

export async function checkAndSendMilestoneNotifications(): Promise<void> {
  if (!db) return;

  try {
    console.info('[Milestones] Checking for community milestones...');

    // Get communities with their member counts
    const communities = await db.execute(sql`
      SELECT
        c.id,
        c.name,
        COUNT(cm.id) as member_count
      FROM communities c
      JOIN community_members cm ON cm.community_id = c.id AND cm.status = 'accepted'
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.name
      HAVING COUNT(cm.id) >= 10
    `);

    const rows = (communities.rows || []) as any[];
    let sentCount = 0;

    for (const community of rows) {
      const milestone = getMilestoneReached(community.member_count);
      if (!milestone) continue;

      const dedupKey = `milestone-${community.id}-${milestone}`;

      // Each milestone fires only once (very long TTL)
      if (await wasNotificationSent('community_milestone', dedupKey, 8760)) { // 365 days
        continue;
      }

      // Get all members to notify
      const members = await db.execute(sql`
        SELECT user_id FROM community_members
        WHERE community_id = ${community.id}
          AND status = 'accepted'
      `);

      const userIds = (members.rows || []).map((r: any) => r.user_id);
      if (userIds.length === 0) continue;

      await notifyMultipleUsers(userIds, {
        title: `${community.name} hit ${milestone} members!`,
        body: `Your community is growing — celebrate and invite others!`,
        data: {
          type: 'community_milestone',
          communityId: community.id,
          milestone,
          dedupKey,
          screen: 'community',
          params: { id: community.id },
        },
        category: 'community',
      });

      sentCount++;
      console.info(`[Milestones] ${community.name} reached ${milestone} members (${userIds.length} notified)`);
    }

    console.info(`[Milestones] Sent ${sentCount} milestone notifications`);
  } catch (error) {
    console.error('[Milestones] Error:', error);
  }
}

export function startMilestoneScheduler(): NodeJS.Timeout {
  console.info('[Milestones] Starting community milestone scheduler (checks every 6 hours)');

  // Delay first check by 10 minutes
  setTimeout(() => checkAndSendMilestoneNotifications(), 10 * 60 * 1000);

  return setInterval(() => {
    checkAndSendMilestoneNotifications();
  }, 6 * 60 * 60 * 1000);
}
