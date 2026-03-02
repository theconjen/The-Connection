import { db } from '../db';
import { storage } from '../storage-optimized';
import { notifyUserWithPreferences, truncateText } from './notificationHelper';
import { apologeticsQuestions, apologeticsAnswers, users } from '@shared/schema';
import { and, eq, gte, desc, gt } from 'drizzle-orm';
import { wasNotificationSent } from './notificationDedup';

/**
 * Apologetics Notification Service
 *
 * Sends notifications about newly answered apologetics questions
 * to users whose interests include 'Apologetics' or 'Theology'.
 * Runs every 12 hours.
 */

// Track which questions we've already notified about
const notifiedQuestions = new Set<number>();

/**
 * Get the best recently answered question from the last 24 hours
 */
async function getBestRecentQuestion(): Promise<any | null> {
  if (!db) return null;

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find questions answered in the last 24 hours with verified answers
    // Prioritize questions with verified answers, then most answers
    const recentQuestions = await db
      .select()
      .from(apologeticsQuestions)
      .where(
        and(
          eq(apologeticsQuestions.status, 'answered'),
          gte(apologeticsQuestions.createdAt, oneDayAgo),
          gt(apologeticsQuestions.answerCount, 0)
        )
      )
      .orderBy(desc(apologeticsQuestions.answerCount))
      .limit(5);

    if (recentQuestions.length === 0) return null;

    // Find one with a verified answer first
    for (const question of recentQuestions) {
      if (notifiedQuestions.has(question.id)) continue;

      const verifiedAnswers = await db
        .select()
        .from(apologeticsAnswers)
        .where(
          and(
            eq(apologeticsAnswers.questionId, question.id),
            eq(apologeticsAnswers.isVerifiedAnswer, true)
          )
        )
        .limit(1);

      if (verifiedAnswers.length > 0) return question;
    }

    // Fall back to first non-notified question
    return recentQuestions.find(q => !notifiedQuestions.has(q.id)) || null;
  } catch (error) {
    console.error('[ApologeticsNotif] Error fetching recent questions:', error);
    return null;
  }
}

/**
 * Get users interested in apologetics/theology
 */
async function getInterestedUsers(): Promise<any[]> {
  try {
    const allUsers = await storage.getAllUsers();
    return allUsers.filter((user: any) => {
      if (!user.interests || user.deletedAt) return false;
      const interests = (user.interests as string).toLowerCase();
      return interests.includes('apologetics') || interests.includes('theology');
    });
  } catch (error) {
    console.error('[ApologeticsNotif] Error fetching interested users:', error);
    return [];
  }
}

/**
 * Check and send apologetics notifications
 */
export async function checkAndSendApologeticsNotifications(): Promise<void> {
  if (!db) return;

  try {
    console.info('[ApologeticsNotif] Checking for new answered apologetics questions...');

    const bestQuestion = await getBestRecentQuestion();
    if (!bestQuestion) {
      console.info('[ApologeticsNotif] No new answered questions to notify about');
      return;
    }

    // DB fallback: survives server restarts (48h window)
    const dedupKey = `${bestQuestion.id}`;
    if (await wasNotificationSent('apologetics_question', dedupKey, 48)) {
      notifiedQuestions.add(bestQuestion.id); // Warm cache
      console.info(`[ApologeticsNotif] Question ${bestQuestion.id} already notified (DB dedup)`);
      return;
    }

    const interestedUsers = await getInterestedUsers();
    if (interestedUsers.length === 0) {
      console.info('[ApologeticsNotif] No users interested in apologetics');
      notifiedQuestions.add(bestQuestion.id);
      return;
    }

    console.info(`[ApologeticsNotif] Notifying ${interestedUsers.length} users about question ${bestQuestion.id}`);
    let sentCount = 0;

    for (const user of interestedUsers) {
      // Don't notify the question author
      if (user.id === bestQuestion.authorId) continue;

      try {
        await notifyUserWithPreferences(user.id, {
          title: 'New in Apologetics',
          body: truncateText(bestQuestion.title, 100),
          data: {
            type: 'apologetics_question',
            questionId: bestQuestion.id,
            dedupKey,
          },
          category: 'feed',
        });
        sentCount++;
      } catch (err) {
        console.error(`[ApologeticsNotif] Error notifying user ${user.id}:`, err);
      }
    }

    notifiedQuestions.add(bestQuestion.id);
    console.info(`[ApologeticsNotif] Sent ${sentCount} apologetics notifications for question ${bestQuestion.id}`);
  } catch (error) {
    console.error('[ApologeticsNotif] Error during notification check:', error);
  }
}

/**
 * Start the apologetics notification scheduler
 * Checks every 12 hours
 */
export function startApologeticsNotificationScheduler(): NodeJS.Timeout {
  console.info('[ApologeticsNotif] Starting apologetics notification scheduler (checks every 12 hours)');

  // Delay first check by 10 minutes to let server fully start
  setTimeout(() => checkAndSendApologeticsNotifications(), 10 * 60 * 1000);

  const intervalId = setInterval(() => {
    checkAndSendApologeticsNotifications();
  }, 12 * 60 * 60 * 1000); // Every 12 hours

  return intervalId;
}
