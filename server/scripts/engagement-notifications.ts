/**
 * Engagement Notifications Service
 *
 * Sends strategic push notifications to drive user engagement with REAL content.
 *
 * Strategy:
 * - Only notify about verified, real content (not bots or spam)
 * - Respect user cooldowns to prevent notification fatigue
 * - Spread notifications across the day (morning, afternoon, evening)
 * - Keep batches small to maintain quality over quantity
 *
 * Notification Types:
 * 1. Active Community: "[Community Name] is active!" (verified 5+ real posts)
 * 2. Seeking Advice: "Someone needs advice" (real questions needing answers)
 * 3. Popular Event: "Event is trending!" (verified 20+ RSVPs)
 * 4. Featured Apologetics: Highlight REAL answered questions
 * 5. Admin Alerts: "You have Community requests" (admins only)
 *
 * Schedule (via render.yaml cron):
 * - Morning (10am ET):   --community --advice
 * - Afternoon (2pm ET):  --events --apologetics
 * - Daily (9am ET):      --admin
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { notifyMultipleUsers, truncateText } from '../services/notificationHelper';

// ============================================================================
// CONFIGURATION - Conservative settings to prevent notification fatigue
// ============================================================================

const CONFIG = {
  // Minimum REAL posts (not from bots) to consider community "active"
  COMMUNITY_ACTIVITY_THRESHOLD: 5,
  // Minimum community members to be considered for notification
  COMMUNITY_MIN_MEMBERS: 10,
  // Minimum RSVPs for "popular event" notification
  EVENT_RSVP_THRESHOLD: 20,
  // Max users to notify per notification type per run
  MAX_USERS_COMMUNITY: 15,
  MAX_USERS_ADVICE: 10,
  MAX_USERS_EVENT: 20,
  MAX_USERS_APOLOGETICS: 15,
  // Hours between same notification type per user
  COOLDOWN_COMMUNITY: 48,    // 2 days between community notifications
  COOLDOWN_ADVICE: 24,       // 1 day between advice notifications
  COOLDOWN_EVENT: 72,        // 3 days between event notifications
  COOLDOWN_APOLOGETICS: 96,  // 4 days between apologetics prompts
  COOLDOWN_ADMIN: 24,        // 1 day between admin notifications
  // Minimum content length to be considered "real" question
  MIN_ADVICE_LENGTH: 50,
};

// Bot user IDs to exclude from "real" activity checks
const BOT_USER_IDS = [1, 2, 3, 4, 5]; // Adjust based on your bot users

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get users who haven't received this notification type recently
 * and who are active (logged in within 30 days)
 */
async function getEligibleUsers(
  notificationType: string,
  cooldownHours: number,
  limit: number,
  excludeIds: number[] = []
): Promise<number[]> {
  const excludeList = [...BOT_USER_IDS, ...excludeIds];
  const excludeClause = excludeList.length > 0
    ? sql`AND u.id NOT IN (${sql.join(excludeList.map(id => sql`${id}`), sql`, `)})`
    : sql``;

  const result = await db.execute(sql`
    SELECT u.id FROM users u
    WHERE u.deleted_at IS NULL
    -- Only active users (logged in within 30 days)
    AND (u.last_login_at IS NULL OR u.last_login_at > NOW() - INTERVAL '30 days')
    -- Not recently notified with this type
    AND u.id NOT IN (
      SELECT DISTINCT n.user_id FROM notifications n
      WHERE n.data->>'notificationType' = ${notificationType}
      AND n.created_at > NOW() - INTERVAL '${sql.raw(String(cooldownHours))} hours'
    )
    ${excludeClause}
    ORDER BY RANDOM()
    LIMIT ${limit}
  `);
  return (result.rows || []).map((r: any) => r.id);
}

/**
 * Check if we've already notified about this specific content
 */
async function hasNotifiedAboutContent(
  notificationType: string,
  contentId: number,
  contentIdField: string
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM notifications
    WHERE data->>'notificationType' = ${notificationType}
    AND (data->>'${sql.raw(contentIdField)}')::int = ${contentId}
    AND created_at > NOW() - INTERVAL '7 days'
  `);
  const count = (result.rows?.[0] as any)?.count || 0;
  return parseInt(count) > 0;
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * 1. Active Community Notifications
 * Only notifies about communities with REAL activity (not bots)
 */
async function sendActiveCommunityNotifications(): Promise<number> {
  console.info('\n📢 Checking for genuinely active communities...');

  // Find communities with REAL activity in last 48 hours
  // Excludes bot posts and requires minimum member count
  const botExclusion = BOT_USER_IDS.length > 0
    ? sql`AND p.user_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})`
    : sql``;

  const activeCommunities = await db.execute(sql`
    SELECT
      c.id,
      c.name,
      COUNT(DISTINCT p.id) as post_count,
      COUNT(DISTINCT cm.user_id) as member_count
    FROM communities c
    LEFT JOIN posts p ON p.community_id = c.id
      AND p.created_at > NOW() - INTERVAL '48 hours'
      AND p.deleted_at IS NULL
      ${botExclusion}
    LEFT JOIN community_members cm ON cm.community_id = c.id
      AND cm.status = 'accepted'
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name
    HAVING COUNT(DISTINCT p.id) >= ${CONFIG.COMMUNITY_ACTIVITY_THRESHOLD}
       AND COUNT(DISTINCT cm.user_id) >= ${CONFIG.COMMUNITY_MIN_MEMBERS}
    ORDER BY COUNT(DISTINCT p.id) DESC
    LIMIT 1
  `);

  const communities = (activeCommunities.rows || []) as any[];
  let notificationsSent = 0;

  if (communities.length === 0) {
    console.info('   No communities meet activity threshold');
    return 0;
  }

  const community = communities[0];

  // Check if we already notified about this community recently
  const alreadyNotified = await hasNotifiedAboutContent('active_community', community.id, 'communityId');
  if (alreadyNotified) {
    console.info(`   Already notified about "${community.name}" recently, skipping`);
    return 0;
  }

  // Get users who are NOT members but might be interested
  const nonMemberUsers = await db.execute(sql`
    SELECT u.id FROM users u
    WHERE u.deleted_at IS NULL
    AND u.id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
    AND u.id NOT IN (
      SELECT user_id FROM community_members WHERE community_id = ${community.id}
    )
    AND u.id NOT IN (
      SELECT DISTINCT n.user_id FROM notifications n
      WHERE n.data->>'notificationType' = 'active_community'
      AND n.created_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.COOLDOWN_COMMUNITY))} hours'
    )
    ORDER BY RANDOM()
    LIMIT ${CONFIG.MAX_USERS_COMMUNITY}
  `);

  const userIds = (nonMemberUsers.rows || []).map((r: any) => r.id);

  if (userIds.length > 0) {
    await notifyMultipleUsers(userIds, {
      title: `${community.name} is active!`,
      body: `${community.post_count} new posts from ${community.member_count} members. Join the conversation!`,
      data: {
        notificationType: 'active_community',
        communityId: community.id,
        screen: 'community',
        params: { id: community.id },
      },
      category: 'community',
    });
    notificationsSent = userIds.length;
    console.info(`   ✅ Notified ${userIds.length} users about "${community.name}"`);
  }

  return notificationsSent;
}

/**
 * 2. Seeking Advice Notifications
 * Only notifies about REAL questions with substantive content that need answers
 */
async function sendSeekingAdviceNotifications(): Promise<number> {
  console.info('\n💬 Checking for real advice questions needing answers...');

  // Find recent advice posts that:
  // 1. Have substantive content (50+ chars)
  // 2. Have NO replies yet (need answers)
  // 3. Not from bots
  // 4. Not already notified about
  const botExclusion = BOT_USER_IDS.length > 0
    ? sql`AND m.author_id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})`
    : sql``;

  const advicePosts = await db.execute(sql`
    SELECT
      m.id,
      m.content,
      m.anonymous_nickname,
      m.author_id,
      m.created_at
    FROM microblogs m
    WHERE m.topic = 'QUESTION'
      AND m.parent_id IS NULL
      AND m.created_at > NOW() - INTERVAL '24 hours'
      AND m.deleted_at IS NULL
      AND LENGTH(m.content) >= ${CONFIG.MIN_ADVICE_LENGTH}
      ${botExclusion}
      -- Has no replies yet
      AND NOT EXISTS (
        SELECT 1 FROM microblogs r
        WHERE r.parent_id = m.id AND r.deleted_at IS NULL
      )
    ORDER BY m.created_at DESC
    LIMIT 1
  `);

  const posts = (advicePosts.rows || []) as any[];
  let notificationsSent = 0;

  if (posts.length === 0) {
    console.info('   No qualifying advice posts found');
    return 0;
  }

  const post = posts[0];

  // Check if we already notified about this post
  const alreadyNotified = await hasNotifiedAboutContent('seeking_advice', post.id, 'microblogId');
  if (alreadyNotified) {
    console.info(`   Already notified about this post, skipping`);
    return 0;
  }

  // Get eligible users
  const userIds = await getEligibleUsers(
    'seeking_advice',
    CONFIG.COOLDOWN_ADVICE,
    CONFIG.MAX_USERS_ADVICE,
    [post.author_id]
  );

  if (userIds.length > 0) {
    const truncatedContent = truncateText(post.content, 80);
    const authorName = post.anonymous_nickname || 'Someone';

    await notifyMultipleUsers(userIds, {
      title: `${authorName} needs advice`,
      body: `"${truncatedContent}"`,
      data: {
        notificationType: 'seeking_advice',
        microblogId: post.id,
        screen: 'advice',
        params: { id: post.id },
      },
      category: 'feed',
    });

    notificationsSent = userIds.length;
    console.info(`   ✅ Notified ${userIds.length} users about advice question`);
  }

  return notificationsSent;
}

/**
 * 3. Popular Event Notifications
 * Only notifies about events with verified 20+ RSVPs
 */
async function sendPopularEventNotifications(): Promise<number> {
  console.info('\n🎉 Checking for genuinely popular events...');

  // Find events with 20+ RSVPs that are upcoming
  const popularEvents = await db.execute(sql`
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
      AND e.start_time < NOW() + INTERVAL '14 days'
    GROUP BY e.id, e.title, e.start_time, e.community_id, c.name
    HAVING COUNT(er.id) >= ${CONFIG.EVENT_RSVP_THRESHOLD}
    ORDER BY e.start_time ASC
    LIMIT 1
  `);

  const events = (popularEvents.rows || []) as any[];
  let notificationsSent = 0;

  if (events.length === 0) {
    console.info('   No events meet RSVP threshold');
    return 0;
  }

  const event = events[0];

  // Check if we already notified about this event
  const alreadyNotified = await hasNotifiedAboutContent('popular_event', event.id, 'eventId');
  if (alreadyNotified) {
    console.info(`   Already notified about "${event.title}", skipping`);
    return 0;
  }

  // Get users who haven't RSVPed yet
  const nonRsvpUsers = await db.execute(sql`
    SELECT u.id FROM users u
    WHERE u.deleted_at IS NULL
    AND u.id NOT IN (${sql.join(BOT_USER_IDS.map(id => sql`${id}`), sql`, `)})
    AND u.id NOT IN (
      SELECT user_id FROM event_rsvps WHERE event_id = ${event.id}
    )
    AND u.id NOT IN (
      SELECT DISTINCT n.user_id FROM notifications n
      WHERE n.data->>'notificationType' = 'popular_event'
      AND n.created_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.COOLDOWN_EVENT))} hours'
    )
    ORDER BY RANDOM()
    LIMIT ${CONFIG.MAX_USERS_EVENT}
  `);

  const userIds = (nonRsvpUsers.rows || []).map((r: any) => r.id);

  if (userIds.length > 0) {
    const communityInfo = event.community_name ? ` in ${event.community_name}` : '';

    await notifyMultipleUsers(userIds, {
      title: `${event.title} is trending!`,
      body: `${event.rsvp_count} people going${communityInfo}. Don't miss out!`,
      data: {
        notificationType: 'popular_event',
        eventId: event.id,
        screen: 'event',
        params: { id: event.id },
      },
      category: 'event',
    });

    notificationsSent = userIds.length;
    console.info(`   ✅ Notified ${userIds.length} users about "${event.title}"`);
  }

  return notificationsSent;
}

/**
 * 4. Featured Apologetics Notifications
 * Highlights REAL answered questions instead of generic prompts
 */
async function sendApologeticsNotifications(): Promise<number> {
  console.info('\n📖 Checking for featured apologetics content...');

  // Find recently answered apologetics questions with quality answers
  const featuredQuestions = await db.execute(sql`
    SELECT
      q.id,
      q.question,
      a.content as answer_preview,
      u.display_name as answerer_name
    FROM user_questions q
    JOIN user_question_messages a ON a.question_id = q.id AND a.sender_role = 'apologist'
    JOIN users u ON u.id = a.sender_id
    WHERE q.status = 'answered'
      AND a.created_at > NOW() - INTERVAL '7 days'
      AND LENGTH(a.content) >= 100
    ORDER BY a.created_at DESC
    LIMIT 1
  `);

  const questions = (featuredQuestions.rows || []) as any[];
  let notificationsSent = 0;

  if (questions.length === 0) {
    // Fall back to simple prompt only if no featured content
    console.info('   No featured apologetics content, sending simple prompt');

    const userIds = await getEligibleUsers(
      'apologetics_prompt',
      CONFIG.COOLDOWN_APOLOGETICS,
      CONFIG.MAX_USERS_APOLOGETICS
    );

    if (userIds.length > 0) {
      await notifyMultipleUsers(userIds, {
        title: 'Have a faith question?',
        body: 'Our apologists are ready to help you find answers.',
        data: {
          notificationType: 'apologetics_prompt',
          screen: 'apologetics',
        },
        category: 'feed',
      });

      notificationsSent = userIds.length;
      console.info(`   ✅ Sent prompt to ${userIds.length} users`);
    }
    return notificationsSent;
  }

  const question = questions[0];

  // Check if we already notified about this question
  const alreadyNotified = await hasNotifiedAboutContent('apologetics_featured', question.id, 'questionId');
  if (alreadyNotified) {
    console.info(`   Already featured this question, skipping`);
    return 0;
  }

  const userIds = await getEligibleUsers(
    'apologetics_featured',
    CONFIG.COOLDOWN_APOLOGETICS,
    CONFIG.MAX_USERS_APOLOGETICS
  );

  if (userIds.length > 0) {
    const truncatedQuestion = truncateText(question.question, 60);

    await notifyMultipleUsers(userIds, {
      title: 'Featured Q&A',
      body: `"${truncatedQuestion}" - answered by ${question.answerer_name}`,
      data: {
        notificationType: 'apologetics_featured',
        questionId: question.id,
        screen: 'apologetics',
        params: { questionId: question.id },
      },
      category: 'feed',
    });

    notificationsSent = userIds.length;
    console.info(`   ✅ Notified ${userIds.length} users about featured Q&A`);
  }

  return notificationsSent;
}

/**
 * 5. Admin Community Request Notifications
 * Notifies admins about REAL pending community join requests
 */
async function sendAdminCommunityRequestNotifications(): Promise<number> {
  console.info('\n👑 Checking for pending community requests...');

  // Find communities with pending join requests
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

  if (requests.length === 0) {
    console.info('   No pending community requests');
    return 0;
  }

  for (const req of requests) {
    // Get community admins who haven't been notified recently
    const admins = await db.execute(sql`
      SELECT cm.user_id FROM community_members cm
      WHERE cm.community_id = ${req.community_id}
      AND cm.role IN ('owner', 'admin')
      AND cm.user_id NOT IN (
        SELECT DISTINCT n.user_id FROM notifications n
        WHERE n.data->>'notificationType' = 'admin_community_requests'
        AND (n.data->>'communityId')::int = ${req.community_id}
        AND n.created_at > NOW() - INTERVAL '${sql.raw(String(CONFIG.COOLDOWN_ADMIN))} hours'
      )
    `);

    const adminIds = (admins.rows || []).map((r: any) => r.user_id);

    // Also include the community creator if not in list
    if (req.owner_id && !adminIds.includes(req.owner_id)) {
      adminIds.push(req.owner_id);
    }

    if (adminIds.length > 0) {
      await notifyMultipleUsers(adminIds, {
        title: 'Requests pending',
        body: `${req.community_name}: ${req.pending_count} member${req.pending_count > 1 ? 's' : ''} waiting to join`,
        data: {
          notificationType: 'admin_community_requests',
          communityId: req.community_id,
          screen: 'community',
          params: { id: req.community_id, tab: 'members' },
        },
        category: 'community',
      });

      notificationsSent += adminIds.length;
      console.info(`   ✅ Notified ${adminIds.length} admins about "${req.community_name}"`);
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
  const sendCommunity = sendAll || args.includes('--community');
  const sendAdvice = sendAll || args.includes('--advice');
  const sendEvents = sendAll || args.includes('--events');
  const sendApologetics = sendAll || args.includes('--apologetics');
  const sendAdmin = sendAll || args.includes('--admin');

  console.info('='.repeat(60));
  console.info('📱 Engagement Notifications Service');
  console.info('='.repeat(60));
  console.info(`📅 ${new Date().toISOString()}`);
  console.info('Strategy: Quality over quantity - real content only');
  console.info('='.repeat(60));

  let totalSent = 0;

  try {
    if (sendCommunity) {
      totalSent += await sendActiveCommunityNotifications();
    }

    if (sendAdvice) {
      totalSent += await sendSeekingAdviceNotifications();
    }

    if (sendEvents) {
      totalSent += await sendPopularEventNotifications();
    }

    if (sendApologetics) {
      totalSent += await sendApologeticsNotifications();
    }

    if (sendAdmin) {
      totalSent += await sendAdminCommunityRequestNotifications();
    }

    console.info('\n' + '='.repeat(60));
    console.info(`✨ Complete! Sent ${totalSent} notifications`);
    console.info('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
