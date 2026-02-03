/**
 * Advice Bot Wrapper
 *
 * Wraps the daily-advice-bot functionality for use with the scheduler.
 * This allows the bot to run without calling process.exit().
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import {
  getRandomQuestions,
  getRandomNickname,
  BOT_PERSONAS,
  getRandomScripture,
  getRandomCrossPromotion,
} from '../data/advice-questions';

// ============================================================================
// REPLY TEMPLATES
// ============================================================================

const SHORT_REPLIES = [
  "Praying for you! 🙏",
  "Praying for you sister!",
  "Praying for you brother!",
  "This is so relatable.",
  "Needed this today.",
  "Same here. You're not alone.",
  "Amen to this.",
  "Such a good question.",
  "Thank you for your honesty.",
  "Me too, friend. Me too.",
  "Right there with you.",
  "God sees you in this.",
  "You've got this!",
  "Lifting you up right now.",
  "So glad you asked this.",
  "Been there. It gets better.",
  "You're braver than you know for sharing this.",
  "This community is here for you.",
  "Walking with you in this.",
  "Grace upon grace for you today.",
];

const MEDIUM_REPLIES = [
  "What helped me was starting small - just 5 minutes a day and building from there. Consistency matters more than intensity.",
  "Have you tried journaling? It's been a game-changer for me in processing stuff like this.",
  "I'd recommend talking to a trusted friend or pastor about this. Don't go it alone.",
  "One thing that shifted my perspective: focus on progress, not perfection. God's not keeping score.",
  "For me, it was about reframing my thinking. Instead of 'I have to' it became 'I get to.'",
  "Community has been huge for me. Find your people and be honest with them.",
  "I learned to give myself grace in this area. We're all works in progress.",
  "What worked for me: accountability partner + specific goals + lots of prayer.",
  "Sometimes the answer is simpler than we think - just start. Imperfect action beats perfect inaction.",
  "My pastor gave me great advice on this: 'Don't compare your chapter 1 to someone else's chapter 20.'",
  "For me, the breakthrough came when I stopped trying to fix it myself and surrendered it fully.",
  "Something that helped: I stopped asking 'why' and started asking 'what now.' Changed everything.",
  "Have you considered talking to a Christian counselor? No shame in getting professional help.",
];

const LONG_REPLIES = [
  "I went through something really similar about two years ago. It felt like I'd never get through it. But looking back, I can see how God was working even when I couldn't see it. What helped most was being honest with a small group about what I was going through - the shame lost its power when I brought it into the light. DM me if you want to talk more.",
  "As someone 10 years down this road, I can tell you it does get easier - not because the situation changes, but because you change. You develop muscles you didn't know you had. The prayers you're praying now are shaping you in ways you can't see yet. Keep showing up. Keep trusting.",
  "I used to feel the exact same way. Here's what changed for me: I realized I was trying to earn something that was already freely given. It took a long time to really believe that grace isn't just a concept - it's my daily reality. You'll get there too.",
  "Coming from the other side of this struggle - there IS light at the end. I wish someone had told me that the darkest point often comes right before the breakthrough. God is faithful, even when our feelings tell us otherwise. Keep going.",
];

const SCRIPTURE_TEMPLATES = [
  "This verse has gotten me through hard seasons: '{verse}' - {reference}",
  "Something that's been anchoring me lately: '{verse}' ({reference})",
  "I keep coming back to {reference}: '{verse}'",
  "One of my favorites for times like this: '{verse}' - {reference}",
];

// ============================================================================
// CONTEXTUAL REPLIES
// ============================================================================

const CONTEXTUAL_REPLIES: Record<string, string[]> = {
  'love language': [
    "My husband is acts of service, I'm words of affirmation. What helped us was explicitly telling each other what we need.",
    "We read the 5 Love Languages book together and it was eye-opening. Now we try to 'speak' each other's language.",
  ],
  'doubt': [
    "Doubt isn't the opposite of faith - it's part of faith. Some of the greatest believers in Scripture wrestled with doubt.",
    "I went through a major faith crisis a few years ago. What helped: reading books by Christians who'd wrestled with the same questions.",
  ],
  'anxiety': [
    "I deal with this daily. What helps: morning routine anchored in Scripture, limiting caffeine, and being honest with my small group.",
    "Anxiety and faith can coexist - having anxiety doesn't mean you lack faith. Medication + prayer both helped me.",
  ],
  'marriage': [
    "We hit a rough patch a few years ago. What saved us: we started dating again - weekly date nights, no kid talk allowed.",
    "Christian counseling was a game-changer for us. Having a third party help us communicate was humbling but so helpful.",
  ],
  'pray': [
    "My prayer life transformed when I stopped treating it like a to-do list and started treating it like a conversation.",
    "I started using a prayer journal and it changed everything. Writing my prayers helps me focus.",
  ],
  'loneliness': [
    "I feel this deeply. What's helped: being the initiator. Instead of waiting for invites, I started hosting.",
    "Something counterintuitive that helped: volunteering. Serving alongside others created natural friendships.",
  ],
};

// ============================================================================
// HELPERS
// ============================================================================

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findContextualReplies(postContent: string): string[] {
  const contentLower = postContent.toLowerCase();

  for (const [keyword, replies] of Object.entries(CONTEXTUAL_REPLIES)) {
    if (contentLower.includes(keyword)) {
      return replies;
    }
  }

  return [...MEDIUM_REPLIES, ...LONG_REPLIES];
}

function generateReply(includeScripture: boolean = false, postContent: string = ''): string {
  const rand = Math.random();

  if (includeScripture) {
    const scripture = getRandomScripture();
    const template = getRandomItem(SCRIPTURE_TEMPLATES);
    return template
      .replace('{verse}', scripture.text.substring(0, 100) + '...')
      .replace('{reference}', scripture.verse);
  }

  if (postContent) {
    const contextualReplies = findContextualReplies(postContent);
    if (contextualReplies.length > 0 && Math.random() < 0.8) {
      return getRandomItem(contextualReplies);
    }
  }

  if (rand < 0.60) return getRandomItem(SHORT_REPLIES);
  if (rand < 0.90) return getRandomItem(MEDIUM_REPLIES);
  return getRandomItem(LONG_REPLIES);
}

// ============================================================================
// BOT LOGIC
// ============================================================================

async function postNewQuestions(count: number): Promise<number[]> {
  console.info(`[Advice Bot] Posting ${count} new questions...`);

  const botUsernames = BOT_PERSONAS.map(p => p.username);
  const usersResult = await db.execute(sql`
    SELECT id, username FROM users
    WHERE username = ANY(${`{${botUsernames.join(',')}}`}::text[])
  `);
  const botUsers = (usersResult.rows || []) as { id: number; username: string }[];

  if (botUsers.length === 0) {
    console.error('[Advice Bot] No bot users found. Run seed-bot-users.ts first.');
    return [];
  }

  const questions = getRandomQuestions(count);
  const postedIds: number[] = [];

  for (const question of questions) {
    const author = getRandomItem(botUsers);
    const useAnonymous = Math.random() > 0.3;

    const result = await db.execute(sql`
      INSERT INTO microblogs (
        author_id,
        content,
        topic,
        anonymous_nickname,
        created_at
      ) VALUES (
        ${author.id},
        ${question.content},
        'QUESTION',
        ${useAnonymous ? getRandomNickname() : null},
        NOW()
      )
      RETURNING id
    `);

    if (result.rows && result.rows.length > 0) {
      const postId = (result.rows[0] as { id: number }).id;
      postedIds.push(postId);
    }
  }

  console.info(`[Advice Bot] Posted ${postedIds.length} questions`);
  return postedIds;
}

async function addRepliesToRecentPosts(): Promise<void> {
  console.info(`[Advice Bot] Adding replies to recent posts...`);

  const botUsernames = BOT_PERSONAS.map(p => p.username);
  const usersResult = await db.execute(sql`
    SELECT id, username FROM users
    WHERE username = ANY(${`{${botUsernames.join(',')}}`}::text[])
  `);
  const botUsers = (usersResult.rows || []) as { id: number; username: string }[];

  if (botUsers.length === 0) return;

  const recentPosts = await db.execute(sql`
    SELECT m.id, m.author_id, m.content,
           (SELECT COUNT(*) FROM microblogs r WHERE r.parent_id = m.id) as reply_count
    FROM microblogs m
    WHERE m.topic = 'QUESTION'
      AND m.parent_id IS NULL
      AND m.created_at > NOW() - INTERVAL '3 days'
    ORDER BY m.created_at DESC
    LIMIT 20
  `);

  const posts = (recentPosts.rows || []) as { id: number; author_id: number; content: string; reply_count: string }[];

  let repliesAdded = 0;

  for (const post of posts) {
    const currentReplies = parseInt(post.reply_count) || 0;
    if (currentReplies >= 5) continue;

    const newReplyCount = getRandomInt(1, 3);
    const repliers = getRandomItems(
      botUsers.filter(u => u.id !== post.author_id),
      newReplyCount
    );

    let scriptureCounter = 0;

    for (const replier of repliers) {
      const includeScripture = scriptureCounter >= 3;
      if (includeScripture) scriptureCounter = 0;
      else scriptureCounter++;

      let reply = generateReply(includeScripture, post.content);

      if (Math.random() < 0.05) {
        reply += '\n\n' + getRandomCrossPromotion();
      }

      await db.execute(sql`
        INSERT INTO microblogs (
          author_id,
          content,
          parent_id,
          topic,
          created_at
        ) VALUES (
          ${replier.id},
          ${reply},
          ${post.id},
          'OTHER',
          NOW()
        )
      `);

      repliesAdded++;

      if (Math.random() < 0.75) {
        try {
          await db.execute(sql`
            INSERT INTO microblog_likes (microblog_id, user_id, created_at)
            VALUES (${post.id}, ${replier.id}, NOW())
            ON CONFLICT DO NOTHING
          `);
        } catch (e) {
          // Ignore duplicate likes
        }
      }
    }
  }

  console.info(`[Advice Bot] Added ${repliesAdded} replies`);
}

// ============================================================================
// EXPORTED FUNCTION FOR SCHEDULER
// ============================================================================

export async function runAdviceBot(): Promise<void> {
  console.info('[Advice Bot] Starting run...');

  const questionCount = getRandomInt(3, 5);

  // 1. Post new questions
  await postNewQuestions(questionCount);

  // 2. Add replies to recent posts
  await addRepliesToRecentPosts();

  console.info('[Advice Bot] Run complete');
}
