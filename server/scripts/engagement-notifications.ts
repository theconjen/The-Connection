/**
 * Strategic Engagement Notifications Service
 *
 * High-conversion notification types (ranked by return rate):
 * 1. PERSONAL/RELATIONAL (highest pull):
 *    - "Your prayer request was prayed for X times today"
 *    - "Someone replied to your advice question"
 *    - "A new member joined [community] — say hi!"
 *
 * 2. GROUP ACTIVITY:
 *    - "[Community] posted something new — check it out!"
 *    - "[Community] has a new event this week"
 *
 * 3. SPIRITUAL MICRO-DOSE (habit building):
 *    - "Quick truth for today" from Apologetics
 *    - Featured answered Q&A
 *
 * 4. RE-ENGAGEMENT (7-14 day inactive users):
 *    - "We miss you — someone in your area just joined a group you might like"
 *
 * Best Practices Applied:
 * - Rich notifications with emoji, preview text, deep links
 * - Smart timing: 7-9 AM or 6-8 PM windows
 * - Rate limit: Max 1/day for engagement notifications per user
 * - Content-based deduplication
 * - Respect user notification preferences
 *
 * Schedule (via render.yaml cron):
 * - Morning (8am ET):  --personal --spiritual
 * - Afternoon (2pm ET): --group --events
 * - Evening (8pm ET):   --reengagement
 * - Daily (9am ET):     --admin
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { notifyMultipleUsers, notifyUserWithPreferences, truncateText } from '../services/notificationHelper';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Rate limits per user
  MAX_ENGAGEMENT_NOTIFICATIONS_PER_DAY: 1,
  // Cooldowns (hours)
  COOLDOWN_PERSONAL: 24,
  COOLDOWN_GROUP: 48,
  COOLDOWN_SPIRITUAL: 24,
  COOLDOWN_REENGAGEMENT: 168, // 7 days
  COOLDOWN_ADMIN: 24,
  // Thresholds
  PRAYER_COUNT_THRESHOLD: 3,     // Min prayers to notify
  COMMUNITY_ACTIVITY_THRESHOLD: 3, // Min posts for "active" community
  COMMUNITY_MIN_MEMBERS: 5,
  EVENT_RSVP_THRESHOLD: 10,
  INACTIVE_DAYS_MIN: 7,
  INACTIVE_DAYS_MAX: 30,
  // Batch sizes (keep small for quality)
  MAX_USERS_PERSONAL: 50,
  MAX_USERS_GROUP: 20,
  MAX_USERS_SPIRITUAL: 30,
  MAX_USERS_REENGAGEMENT: 25,
};

// Bot user IDs to exclude
const BOT_USER_IDS = [1, 2, 3, 4, 5];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user has already received an engagement notification today
 */
async function hasReceivedEngagementToday(userId: number): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ${userId}
    AND data->>'isEngagement' = 'true'
    AND created_at > NOW() - INTERVAL '24 hours'
  `);
  const count = parseInt((result.rows?.[0] as any)?.count || '0');
  return count >= CONFIG.MAX_ENGAGEMENT_NOTIFICATIONS_PER_DAY;
}

/**
 * Get users eligible for a notification type (respects cooldowns & daily limit)
 */
async function getEligibleUsers(
  notificationType: string,
  cooldownHours: number,
  limit: number,
  additionalCondition?: string
): Promise<number[]> {
  const botExclusion = BOT_USER_IDS.length > 0
    ? sql`AND u.id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})`
    : sql``;

  const additionalWhere = additionalCondition ? sql.raw(additionalCondition) : sql``;

  const result = await db.execute(sql`
    SELECT u.id FROM users u
    WHERE u.deleted_at IS NULL
    ${botExclusion}
    -- Not received this notification type recently
    AND u.id NOT IN (
      SELECT DISTINCT n.user_id FROM notifications n
      WHERE n.data->>'notificationType' = ${notificationType}
      AND n.created_at > NOW() - INTERVAL '${sql.raw(String(cooldownHours))} hours'
    )
    -- Not received ANY engagement notification today (max 1/day)
    AND u.id NOT IN (
      SELECT DISTINCT n.user_id FROM notifications n
      WHERE n.data->>'isEngagement' = 'true'
      AND n.created_at > NOW() - INTERVAL '24 hours'
    )
    ${additionalWhere}
    ORDER BY RANDOM()
    LIMIT ${limit}
  `);
  return (result.rows || []).map((r: any) => r.id);
}

/**
 * Check if content was already notified about
 */
async function wasContentNotified(
  notificationType: string,
  contentField: string,
  contentId: number
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM notifications
    WHERE data->>'notificationType' = ${notificationType}
    AND (data->>'${sql.raw(contentField)}')::int = ${contentId}
    AND created_at > NOW() - INTERVAL '7 days'
  `);
  return parseInt((result.rows?.[0] as any)?.count || '0') > 0;
}

// ============================================================================
// 1. PERSONAL/RELATIONAL NOTIFICATIONS (Highest Conversion)
// ============================================================================

/**
 * Notify users when their prayer requests are prayed for
 * "Your prayer request was prayed for 3 times today"
 */
async function sendPrayerNotifications(): Promise<number> {
  console.info('\n🙏 Checking for prayer request activity...');

  // Find prayer requests that received prayers today
  const prayedRequests = await db.execute(sql`
    SELECT
      pr.id,
      pr.user_id,
      pr.content,
      COUNT(pp.id) as prayer_count
    FROM prayer_requests pr
    JOIN prayer_prayers pp ON pp.request_id = pr.id
      AND pp.created_at > NOW() - INTERVAL '24 hours'
    WHERE pr.deleted_at IS NULL
      AND pr.user_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
    GROUP BY pr.id, pr.user_id, pr.content
    HAVING COUNT(pp.id) >= ${CONFIG.PRAYER_COUNT_THRESHOLD}
    LIMIT 20
  `);

  const requests = (prayedRequests.rows || []) as any[];
  let notificationsSent = 0;

  for (const req of requests) {
    // Check if already notified about this today
    if (await wasContentNotified('prayer_support', 'prayerRequestId', req.id)) {
      continue;
    }

    // Check daily limit
    if (await hasReceivedEngagementToday(req.user_id)) {
      continue;
    }

    await notifyUserWithPreferences(req.user_id, {
      title: 'Your prayer request touched hearts',
      body: `${req.prayer_count} people prayed for you today 🙏`,
      data: {
        notificationType: 'prayer_support',
        isEngagement: 'true',
        prayerRequestId: req.id,
        screen: 'prayer',
        params: { id: req.id },
      },
      category: 'community',
    });

    notificationsSent++;
    console.info(`   ✅ Notified user ${req.user_id} about ${req.prayer_count} prayers`);
  }

  return notificationsSent;
}

/**
 * Notify users about replies to their advice questions
 * "Someone replied to your question in Seeking Advice"
 */
async function sendAdviceReplyNotifications(): Promise<number> {
  console.info('\n💬 Checking for advice replies...');

  // Find advice questions that got replies today
  const questionsWithReplies = await db.execute(sql`
    SELECT DISTINCT
      m.id as question_id,
      m.author_id,
      m.content as question_content,
      r.content as reply_preview,
      r.anonymous_nickname as replier_name
    FROM microblogs m
    JOIN microblogs r ON r.parent_id = m.id
      AND r.created_at > NOW() - INTERVAL '24 hours'
      AND r.deleted_at IS NULL
    WHERE m.topic = 'QUESTION'
      AND m.parent_id IS NULL
      AND m.deleted_at IS NULL
      AND m.author_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
    ORDER BY r.created_at DESC
    LIMIT 20
  `);

  const questions = (questionsWithReplies.rows || []) as any[];
  let notificationsSent = 0;

  for (const q of questions) {
    if (await hasReceivedEngagementToday(q.author_id)) {
      continue;
    }

    const replierDisplay = q.replier_name || 'Someone';
    const replyPreview = truncateText(q.reply_preview, 50);

    await notifyUserWithPreferences(q.author_id, {
      title: `${replierDisplay} replied to your question`,
      body: `"${replyPreview}"`,
      data: {
        notificationType: 'advice_reply',
        isEngagement: 'true',
        microblogId: q.question_id,
        screen: 'advice',
        params: { id: q.question_id },
      },
      category: 'feed',
    });

    notificationsSent++;
    console.info(`   ✅ Notified user ${q.author_id} about reply`);
  }

  return notificationsSent;
}

/**
 * Notify community members about new members
 * "A new member joined [Community] — say hi!"
 */
async function sendNewMemberNotifications(): Promise<number> {
  console.info('\n👋 Checking for new community members...');

  // Find communities that got new members today
  const newMembers = await db.execute(sql`
    SELECT
      c.id as community_id,
      c.name as community_name,
      u.display_name as new_member_name,
      u.id as new_member_id,
      cm.joined_at
    FROM community_members cm
    JOIN communities c ON c.id = cm.community_id
    JOIN users u ON u.id = cm.user_id
    WHERE cm.joined_at > NOW() - INTERVAL '24 hours'
      AND cm.status = 'accepted'
      AND c.deleted_at IS NULL
      AND u.id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
    ORDER BY cm.joined_at DESC
    LIMIT 10
  `);

  const members = (newMembers.rows || []) as any[];
  let notificationsSent = 0;

  for (const member of members) {
    // Get a few existing members to notify (admins/active)
    const existingMembers = await db.execute(sql`
      SELECT cm.user_id FROM community_members cm
      WHERE cm.community_id = ${member.community_id}
        AND cm.user_id != ${member.new_member_id}
        AND cm.status = 'accepted'
        AND cm.role IN ('owner', 'admin', 'moderator')
      LIMIT 5
    `);

    const memberIds = (existingMembers.rows || []).map((r: any) => r.user_id);

    for (const userId of memberIds) {
      if (await hasReceivedEngagementToday(userId)) {
        continue;
      }

      await notifyUserWithPreferences(userId, {
        title: `${member.community_name} is growing!`,
        body: `${member.new_member_name || 'Someone new'} just joined — welcome them! 👋`,
        data: {
          notificationType: 'new_member',
          isEngagement: 'true',
          communityId: member.community_id,
          newMemberId: member.new_member_id,
          screen: 'community',
          params: { id: member.community_id },
        },
        category: 'community',
      });

      notificationsSent++;
    }
  }

  console.info(`   ✅ Sent ${notificationsSent} new member notifications`);
  return notificationsSent;
}

// ============================================================================
// 2. GROUP ACTIVITY NOTIFICATIONS
// ============================================================================

/**
 * Notify members about active community posts
 * "[Community] posted something new — check it out!"
 */
async function sendCommunityActivityNotifications(): Promise<number> {
  console.info('\n📢 Checking for community activity...');

  // Find communities with recent activity
  const activeCommunities = await db.execute(sql`
    SELECT
      c.id,
      c.name,
      COUNT(DISTINCT p.id) as post_count,
      MAX(p.title) as latest_post_title
    FROM communities c
    JOIN posts p ON p.community_id = c.id
      AND p.created_at > NOW() - INTERVAL '24 hours'
      AND p.deleted_at IS NULL
      AND p.user_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name
    HAVING COUNT(DISTINCT p.id) >= ${CONFIG.COMMUNITY_ACTIVITY_THRESHOLD}
    ORDER BY COUNT(DISTINCT p.id) DESC
    LIMIT 3
  `);

  const communities = (activeCommunities.rows || []) as any[];
  let notificationsSent = 0;

  for (const community of communities) {
    // Get members who haven't visited recently
    const membersToNotify = await db.execute(sql`
      SELECT cm.user_id FROM community_members cm
      WHERE cm.community_id = ${community.id}
        AND cm.status = 'accepted'
        AND cm.user_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
        AND cm.user_id NOT IN (
          SELECT DISTINCT n.user_id FROM notifications n
          WHERE n.data->>'notificationType' = 'community_activity'
          AND n.created_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.COOLDOWN_GROUP))} hours'
        )
        AND cm.user_id NOT IN (
          SELECT DISTINCT n.user_id FROM notifications n
          WHERE n.data->>'isEngagement' = 'true'
          AND n.created_at > NOW() - INTERVAL '24 hours'
        )
      ORDER BY RANDOM()
      LIMIT ${CONFIG.MAX_USERS_GROUP}
    `);

    const userIds = (membersToNotify.rows || []).map((r: any) => r.user_id);

    if (userIds.length > 0) {
      await notifyMultipleUsers(userIds, {
        title: `${community.name} is buzzing!`,
        body: `${community.post_count} new posts today — see what's happening 💬`,
        data: {
          notificationType: 'community_activity',
          isEngagement: 'true',
          communityId: community.id,
          screen: 'community',
          params: { id: community.id },
        },
        category: 'community',
      });

      notificationsSent += userIds.length;
      console.info(`   ✅ Notified ${userIds.length} members of "${community.name}"`);
    }
  }

  return notificationsSent;
}

/**
 * Notify members about upcoming community events
 * "[Community] has a new event this week"
 */
async function sendUpcomingEventNotifications(): Promise<number> {
  console.info('\n📅 Checking for upcoming events...');

  // Find events happening in the next 7 days
  const upcomingEvents = await db.execute(sql`
    SELECT
      e.id,
      e.title,
      e.start_time,
      e.community_id,
      c.name as community_name,
      COUNT(er.id) as rsvp_count
    FROM events e
    LEFT JOIN communities c ON c.id = e.community_id
    LEFT JOIN event_rsvps er ON er.event_id = e.id AND er.status = 'going'
    WHERE e.deleted_at IS NULL
      AND e.start_time > NOW()
      AND e.start_time < NOW() + INTERVAL '7 days'
    GROUP BY e.id, e.title, e.start_time, e.community_id, c.name
    HAVING COUNT(er.id) >= ${CONFIG.EVENT_RSVP_THRESHOLD}
    ORDER BY e.start_time ASC
    LIMIT 2
  `);

  const events = (upcomingEvents.rows || []) as any[];
  let notificationsSent = 0;

  for (const event of events) {
    if (await wasContentNotified('upcoming_event', 'eventId', event.id)) {
      continue;
    }

    // Get community members who haven't RSVPed
    const membersToNotify = await db.execute(sql`
      SELECT cm.user_id FROM community_members cm
      WHERE cm.community_id = ${event.community_id}
        AND cm.status = 'accepted'
        AND cm.user_id NOT IN (
          SELECT user_id FROM event_rsvps WHERE event_id = ${event.id}
        )
        AND cm.user_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
        AND cm.user_id NOT IN (
          SELECT DISTINCT n.user_id FROM notifications n
          WHERE n.data->>'isEngagement' = 'true'
          AND n.created_at > NOW() - INTERVAL '24 hours'
        )
      ORDER BY RANDOM()
      LIMIT 15
    `);

    const userIds = (membersToNotify.rows || []).map((r: any) => r.user_id);

    if (userIds.length > 0) {
      const daysUntil = Math.ceil((new Date(event.start_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const timeText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

      await notifyMultipleUsers(userIds, {
        title: `${event.community_name || 'Community'} Event ${timeText}!`,
        body: `${event.title} — ${event.rsvp_count} people going 🎉`,
        data: {
          notificationType: 'upcoming_event',
          isEngagement: 'true',
          eventId: event.id,
          screen: 'event',
          params: { id: event.id },
        },
        category: 'event',
      });

      notificationsSent += userIds.length;
      console.info(`   ✅ Notified ${userIds.length} about "${event.title}"`);
    }
  }

  return notificationsSent;
}

// ============================================================================
// 3. SPIRITUAL MICRO-DOSE NOTIFICATIONS (Habit Building)
// ============================================================================

/**
 * Send featured apologetics Q&A
 * "Quick truth for today" highlighting real answered questions
 */
async function sendSpiritualNudgeNotifications(): Promise<number> {
  console.info('\n📖 Preparing spiritual nudge...');

  // Find a recently answered apologetics question with a quality answer
  const featuredQA = await db.execute(sql`
    SELECT
      q.id,
      q.question,
      a.content as answer,
      u.display_name as answerer_name,
      t.name as topic_name
    FROM user_questions q
    JOIN user_question_messages a ON a.question_id = q.id AND a.sender_role = 'apologist'
    JOIN users u ON u.id = a.sender_id
    LEFT JOIN apologetics_topics t ON t.id = q.topic_id
    WHERE q.status IN ('answered', 'published')
      AND a.created_at > NOW() - INTERVAL '14 days'
      AND LENGTH(a.content) >= 150
    ORDER BY a.created_at DESC
    LIMIT 1
  `);

  const questions = (featuredQA.rows || []) as any[];
  let notificationsSent = 0;

  if (questions.length === 0) {
    console.info('   No featured Q&A available');
    return 0;
  }

  const qa = questions[0];

  if (await wasContentNotified('spiritual_nudge', 'questionId', qa.id)) {
    console.info('   Already featured this Q&A');
    return 0;
  }

  // Get eligible users
  const userIds = await getEligibleUsers(
    'spiritual_nudge',
    CONFIG.COOLDOWN_SPIRITUAL,
    CONFIG.MAX_USERS_SPIRITUAL
  );

  if (userIds.length > 0) {
    const questionPreview = truncateText(qa.question, 50);
    const topicLabel = qa.topic_name || 'Faith';

    await notifyMultipleUsers(userIds, {
      title: `Quick truth: ${topicLabel}`,
      body: `"${questionPreview}" — answered by ${qa.answerer_name} 📚`,
      data: {
        notificationType: 'spiritual_nudge',
        isEngagement: 'true',
        questionId: qa.id,
        screen: 'apologetics',
        params: { questionId: qa.id },
      },
      category: 'feed',
    });

    notificationsSent = userIds.length;
    console.info(`   ✅ Sent spiritual nudge to ${userIds.length} users`);
  }

  return notificationsSent;
}

// ============================================================================
// 4. RE-ENGAGEMENT NOTIFICATIONS (Inactive Users)
// ============================================================================

/**
 * Re-engage users who haven't been active in 7-14 days
 * "We miss you — check out what's new in your communities"
 */
async function sendReengagementNotifications(): Promise<number> {
  console.info('\n💭 Checking for inactive users to re-engage...');

  // Find users who were active but haven't logged in for 7-30 days
  const inactiveUsers = await db.execute(sql`
    SELECT
      u.id,
      u.display_name,
      u.last_login_at,
      (
        SELECT c.name FROM communities c
        JOIN community_members cm ON cm.community_id = c.id
        WHERE cm.user_id = u.id AND cm.status = 'accepted'
        ORDER BY cm.joined_at DESC
        LIMIT 1
      ) as favorite_community
    FROM users u
    WHERE u.deleted_at IS NULL
      AND u.last_login_at IS NOT NULL
      AND u.last_login_at < NOW() - INTERVAL '${sql.raw(String(CONFIG.INACTIVE_DAYS_MIN))} days'
      AND u.last_login_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.INACTIVE_DAYS_MAX))} days'
      AND u.id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
      AND u.id NOT IN (
        SELECT DISTINCT n.user_id FROM notifications n
        WHERE n.data->>'notificationType' = 'reengagement'
        AND n.created_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.COOLDOWN_REENGAGEMENT))} hours'
      )
    ORDER BY u.last_login_at DESC
    LIMIT ${CONFIG.MAX_USERS_REENGAGEMENT}
  `);

  const users = (inactiveUsers.rows || []) as any[];
  let notificationsSent = 0;

  for (const user of users) {
    const message = user.favorite_community
      ? `${user.favorite_community} has been active — come see what's new! 💫`
      : `Your community friends have been sharing — come catch up! 💫`;

    await notifyUserWithPreferences(user.id, {
      title: `We miss you, ${user.display_name || 'friend'}!`,
      body: message,
      data: {
        notificationType: 'reengagement',
        isEngagement: 'true',
        screen: 'home',
      },
      category: 'feed',
    });

    notificationsSent++;
  }

  console.info(`   ✅ Sent ${notificationsSent} re-engagement notifications`);
  return notificationsSent;
}

// ============================================================================
// 5. ADMIN NOTIFICATIONS
// ============================================================================

/**
 * Notify admins about pending community requests
 */
async function sendAdminNotifications(): Promise<number> {
  console.info('\n👑 Checking for admin tasks...');

  const pendingRequests = await db.execute(sql`
    SELECT
      c.id as community_id,
      c.name as community_name,
      c.created_by as owner_id,
      COUNT(cm.id) as pending_count
    FROM communities c
    JOIN community_members cm ON cm.community_id = c.id
      AND cm.status = 'pending'
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.created_by
    HAVING COUNT(cm.id) > 0
    ORDER BY COUNT(cm.id) DESC
    LIMIT 5
  `);

  const requests = (pendingRequests.rows || []) as any[];
  let notificationsSent = 0;

  for (const req of requests) {
    const admins = await db.execute(sql`
      SELECT cm.user_id FROM community_members cm
      WHERE cm.community_id = ${req.community_id}
        AND cm.role IN ('owner', 'admin')
        AND cm.user_id NOT IN (
          SELECT DISTINCT n.user_id FROM notifications n
          WHERE n.data->>'notificationType' = 'admin_pending'
          AND (n.data->>'communityId')::int = ${req.community_id}
          AND n.created_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.COOLDOWN_ADMIN))} hours'
        )
    `);

    const adminIds = (admins.rows || []).map((r: any) => r.user_id);

    if (adminIds.length > 0) {
      await notifyMultipleUsers(adminIds, {
        title: 'Action needed',
        body: `${req.community_name}: ${req.pending_count} member${req.pending_count > 1 ? 's' : ''} waiting to join`,
        data: {
          notificationType: 'admin_pending',
          communityId: req.community_id,
          screen: 'community',
          params: { id: req.community_id, tab: 'members' },
        },
        category: 'community',
      });

      notificationsSent += adminIds.length;
      console.info(`   ✅ Notified ${adminIds.length} admins of "${req.community_name}"`);
    }
  }

  return notificationsSent;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse which notifications to send
  const sendAll = args.length === 0 || args.includes('--all');
  const sendPersonal = sendAll || args.includes('--personal');
  const sendGroup = sendAll || args.includes('--group');
  const sendSpiritual = sendAll || args.includes('--spiritual');
  const sendEvents = sendAll || args.includes('--events');
  const sendReengagement = sendAll || args.includes('--reengagement');
  const sendAdmin = args.includes('--admin'); // Admin is explicit only

  console.info('='.repeat(60));
  console.info('📱 Strategic Engagement Notifications');
  console.info('='.repeat(60));
  console.info(`📅 ${new Date().toISOString()}`);
  console.info('Strategy: Personal > Group > Spiritual > Re-engagement');
  console.info('Max 1 engagement notification per user per day');
  console.info('='.repeat(60));

  let totalSent = 0;

  try {
    // 1. PERSONAL (highest conversion)
    if (sendPersonal) {
      console.info('\n--- PERSONAL/RELATIONAL ---');
      totalSent += await sendPrayerNotifications();
      totalSent += await sendAdviceReplyNotifications();
      totalSent += await sendNewMemberNotifications();
    }

    // 2. GROUP ACTIVITY
    if (sendGroup) {
      console.info('\n--- GROUP ACTIVITY ---');
      totalSent += await sendCommunityActivityNotifications();
    }

    if (sendEvents) {
      totalSent += await sendUpcomingEventNotifications();
    }

    // 3. SPIRITUAL MICRO-DOSE
    if (sendSpiritual) {
      console.info('\n--- SPIRITUAL NUDGE ---');
      totalSent += await sendSpiritualNudgeNotifications();
    }

    // 4. RE-ENGAGEMENT
    if (sendReengagement) {
      console.info('\n--- RE-ENGAGEMENT ---');
      totalSent += await sendReengagementNotifications();
    }

    // 5. ADMIN
    if (sendAdmin) {
      console.info('\n--- ADMIN ---');
      totalSent += await sendAdminNotifications();
    }

    console.info('\n' + '='.repeat(60));
    console.info(`✨ Complete! Sent ${totalSent} strategic notifications`);
    console.info('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
