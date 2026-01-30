/**
 * Seed Advice Posts with Realistic Engagement
 *
 * Creates Community Advice posts (microblogs with topic=QUESTION)
 * and populates them with realistic, Scripture-backed comments and likes.
 *
 * Features:
 * - 5-10 bot personas with realistic profiles
 * - 60% short, 30% medium, 10% long replies
 * - Scripture integration (1-2 verses per 3-4 replies)
 * - Thread building (replies to replies, 3-5 deep)
 * - 70-80% like distribution
 * - Cross-promotion to other communities
 * - Realistic timing (1-24 hour delays via timestamps)
 *
 * Run: npx tsx server/scripts/seed-advice-with-engagement.ts
 * Run with count: npx tsx server/scripts/seed-advice-with-engagement.ts --count=20
 */

import 'dotenv/config';
import { db } from '../db';
import { microblogs, microblogLikes, users } from '@shared/schema';
import { eq, sql, desc } from 'drizzle-orm';
import {
  ALL_ADVICE_QUESTIONS,
  getRandomQuestions,
  getRandomNickname,
  BOT_PERSONAS,
  getRandomBotPersona,
  SCRIPTURE_REFERENCES,
  getRandomScripture,
  getRandomCrossPromotion,
} from '../data/advice-questions';

// ============================================================================
// REPLY TEMPLATES BY LENGTH/TYPE
// ============================================================================

// SHORT REPLIES (60%) - Quick encouragement, 1-2 sentences
const SHORT_REPLIES = [
  "Praying for you! 🙏",
  "Praying for you sister!",
  "Praying for you brother!",
  "Following this thread!",
  "This is so relatable.",
  "Needed this today.",
  "Same here. You're not alone.",
  "Amen to this.",
  "Such a good question.",
  "This resonates deeply.",
  "Thank you for your honesty.",
  "Me too, friend. Me too.",
  "Right there with you.",
  "God sees you in this.",
  "You've got this!",
  "Bookmarking this thread.",
  "Lifting you up right now.",
  "So glad you asked this.",
  "Been there. It gets better.",
  "The fact that you're asking shows your heart is in the right place.",
  "You're braver than you know for sharing this.",
  "This community is here for you.",
  "I don't have answers but I'm praying.",
  "Walking with you in this.",
  "Hugs from afar.",
  "This hit home for me.",
  "Wow, I could have written this myself.",
  "Thank you for being real.",
  "Following because I need this wisdom too!",
  "Grace upon grace for you today.",
];

// MEDIUM REPLIES (30%) - Advice + personal insight, 2-4 sentences
const MEDIUM_REPLIES = [
  "What helped me was starting small - just 5 minutes a day and building from there. Consistency matters more than intensity.",
  "Have you tried journaling? It's been a game-changer for me in processing stuff like this.",
  "I'd recommend talking to a trusted friend or pastor about this. Don't go it alone.",
  "One thing that shifted my perspective: focus on progress, not perfection. God's not keeping score.",
  "For me, it was about reframing my thinking. Instead of 'I have to' it became 'I get to.'",
  "Community has been huge for me. Find your people and be honest with them. It's scary but worth it.",
  "I learned to give myself grace in this area. We're all works in progress.",
  "What worked for me: accountability partner + specific goals + lots of prayer. Not a quick fix but it works.",
  "Sometimes the answer is simpler than we think - just start. Imperfect action beats perfect inaction.",
  "I've found that consistency matters more than intensity. Small steps add up over time.",
  "My pastor gave me great advice on this: 'Don't compare your chapter 1 to someone else's chapter 20.'",
  "One practical thing: schedule it like an appointment you can't miss. Put it in your calendar.",
  "For me, the breakthrough came when I stopped trying to fix it myself and surrendered it fully.",
  "Something that helped: I stopped asking 'why' and started asking 'what now.' Changed everything.",
  "This might sound simple, but have you prayed specifically about this? Sometimes we forget the obvious.",
  "I went through something similar. What helped was lowering my expectations and raising my gratitude.",
  "Two things helped me: accepting where I am and believing God can change things. Both/and, not either/or.",
  "Real talk: it took me longer than I wanted to figure this out. Be patient with yourself.",
  "What I've learned is that God often works through the process, not around it. The struggle has purpose.",
  "Have you considered talking to a Christian counselor? No shame in getting professional help.",
];

// LONG REPLIES (10%) - Thoughtful, personal stories, 4+ sentences
const LONG_REPLIES = [
  "I went through something really similar about two years ago. It felt like I'd never get through it. But looking back, I can see how God was working even when I couldn't see it. What helped most was being honest with a small group about what I was going through - the shame lost its power when I brought it into the light. DM me if you want to talk more - happy to share what worked for me.",
  "My husband and I struggled with this for years before finding what worked for us. It took trying a lot of different approaches and being willing to fail. The turning point came when we stopped blaming each other and started seeing ourselves as a team against the problem, not against each other. Still a work in progress, but so much better now. Praying for you as you navigate this.",
  "As someone 10 years down this road, I can tell you it does get easier - not because the situation changes, but because you change. You develop muscles you didn't know you had. The prayers you're praying now are shaping you in ways you can't see yet. Keep showing up. Keep trusting. The breakthrough is often closer than it feels.",
  "I used to feel the exact same way. Here's what changed for me: I realized I was trying to earn something that was already freely given. It took a long time to really believe that grace isn't just a concept - it's my daily reality. Now when I mess up, I don't spiral. I just come back to the cross. Not perfectly, but consistently. You'll get there too.",
  "Coming from the other side of this struggle - there IS light at the end. I wish someone had told me that the darkest point often comes right before the breakthrough. I'm not saying it'll be easy or quick, but I am saying it's worth holding on. God is faithful, even when our feelings tell us otherwise. Keep going. You're not as far from the finish line as you think.",
  "I remember being exactly where you are. What I've learned since then is that sometimes God's silence isn't absence - it's invitation. He's inviting us to trust Him in the dark, to develop a faith that doesn't depend on feelings. That's hard. But the depth you're gaining right now will serve you for the rest of your life. Praying you feel His presence even in the quiet.",
  "Former [person who struggled with this exact thing] here. It took me about 6 months to see real change, but it was worth every hard day. The key for me was not trying to do it alone. I found one person I could be completely honest with - no performance, no pretending. That accountability and support made all the difference. Happy to share more if you're interested.",
  "I want to be honest with you because I think you need to hear this: what you're going through is hard, and it's okay to acknowledge that. Our faith doesn't require us to pretend everything is fine when it isn't. God can handle your real feelings. In fact, I think He prefers your honest struggle over a fake smile. Keep being real. That's where healing starts.",
];

// SCRIPTURE-BACKED REPLIES (mixed into rotation)
const SCRIPTURE_REPLIES = [
  "This verse has gotten me through hard seasons: '{verse}' - {reference}. It reminds me that God's got this even when I don't.",
  "Something that's been anchoring me lately: '{verse}' ({reference}). Maybe it'll speak to you too.",
  "I keep coming back to {reference}: '{verse}'. It doesn't fix everything but it steadies me.",
  "One of my favorites for times like this: '{verse}' - {reference}. His promises are true even when circumstances say otherwise.",
  "Not sure if this helps, but {reference} has been my lifeline: '{verse}'",
  "When I feel like this, I remember {reference}: '{verse}'. Easier said than lived, but still true.",
];

// CONTEXTUAL REPLIES - Matched to question keywords for relevance
const CONTEXTUAL_REPLIES: Record<string, string[]> = {
  'love language': [
    "My husband is acts of service, I'm words of affirmation. What helped us was explicitly telling each other what we need. It felt awkward at first but now it's natural.",
    "We read the 5 Love Languages book together and it was eye-opening. Now we try to 'speak' each other's language even if it doesn't come naturally.",
    "Something that helped us: we each committed to doing one thing in the other's love language daily. Small but consistent acts add up.",
  ],
  'child': [
    "We went through this with our son. First, document everything. Then meet with the teacher AND principal together. Schools respond better when they know you're serious.",
    "My daughter struggled with this too. What helped: we role-played responses at home, built up her confidence with activities she excelled at.",
    "One thing that helped our family: we focused on building our child's inner confidence rather than just trying to fix the external situation.",
  ],
  'bully': [
    "We went through this with our son. First, document everything. Then meet with the teacher AND principal together.",
    "My daughter was bullied in 5th grade. What helped: we role-played responses at home and built up her confidence.",
    "One thing that helped: we focused on building our child's inner confidence rather than just trying to stop the bullies.",
  ],
  'numb': [
    "I've been there. For me, numbness was actually my body's way of protecting me from overwhelm. Small practices helped - lighting a candle during prayer, going for walks.",
    "Spiritual numbness often comes after intense seasons. Give yourself grace. Sometimes we need to just show up without expecting to feel anything.",
    "When I felt spiritually numb, a friend suggested I stop trying so hard and just rest. No performance, no striving.",
  ],
  'identity': [
    "After my divorce, I had to completely rebuild who I was. What helped: making a list of things true about me BEFORE and AFTER the change.",
    "Major life changes shook my identity too. I started asking 'Who does God say I am?' instead of 'Who was I?'",
    "I went through this after leaving my career. Exploring new things - hobbies, volunteering, classes - helped me rebuild.",
  ],
  'coworker': [
    "Boundaries have been key for me. I'm friendly but professional. When conflicts arise, I address them directly but calmly.",
    "Praying for difficult coworkers changed MY heart more than it changed them. It's hard to stay angry at someone you're praying for.",
    "I stopped expecting non-Christians to act like Christians. Lowered my frustration and helped me see them with compassion.",
  ],
  'screen time': [
    "We do 'phone-free' hours - during dinner and before bed. Those quiet moments have become sacred for prayer and conversation.",
    "I replaced my morning scroll with morning prayer. Put my phone across the room so I have to physically get up.",
    "We got physical Bibles and devotionals so we're not tempted by phone notifications during spiritual time.",
  ],
  'doubt': [
    "Doubt isn't the opposite of faith - it's part of faith. Some of the greatest believers wrestled with doubt (Thomas, David, Job).",
    "I went through a major faith crisis. Reading books by Christians who'd wrestled with the same questions helped.",
    "My pastor said: 'Doubt your doubts as much as you doubt your faith.' That stuck with me.",
  ],
  'fear': [
    "I struggle with anxiety about the future too. What helps: limiting news, journaling fears, and praying over them specifically.",
    "Philippians 4:6-7 has been my anchor. When fear rises, I stop and pray about the specific thing I'm afraid of.",
    "Fear of the future is often grief about loss of control. Surrendering control to God is the antidote.",
  ],
  'pray': [
    "My prayer life transformed when I stopped treating it like a to-do list and started treating it like a conversation.",
    "Using a prayer journal changed everything. Writing prayers helps me focus and looking back builds faith.",
    "Scheduled prayer time in the morning plus breath prayers throughout the day - that's what works for me.",
  ],
  'marriage': [
    "We hit a rough patch a few years ago. What saved us: we started dating again - weekly date nights, no kid talk allowed.",
    "Christian counseling was a game-changer for us. Having a third party help us communicate was humbling but helpful.",
    "One thing that helps: we pray together every night before bed. Even when we're frustrated with each other.",
  ],
  'memorize': [
    "What worked for me: writing verses on index cards and reviewing them during commute time. Repetition is key.",
    "I use the app 'Scripture Typer' - typing out verses helps them stick better than just reading.",
    "Start small - one verse a week, really meditate on it. I also set the verse as my phone wallpaper.",
  ],
  'church': [
    "When we moved, we visited 10+ churches before finding our home. Don't rush it - look for genuine community.",
    "We looked for a church where we could serve, not just consume. Getting involved fast helped us connect.",
    "Ask people whose faith you respect for recommendations. Also, small groups are where real connection happens.",
  ],
  'anxiety': [
    "I deal with this daily. Morning routine anchored in Scripture, limiting caffeine, and being honest with my small group helps.",
    "Anxiety and faith can coexist. God gave us brains that sometimes misfire. Medication + prayer both helped me.",
    "When anxiety hits, I do 4-7-8 breathing while reciting a verse. Engages both body and spirit.",
  ],
};

function findContextualReplies(postContent: string): string[] {
  const contentLower = postContent.toLowerCase();
  for (const [keyword, replies] of Object.entries(CONTEXTUAL_REPLIES)) {
    if (contentLower.includes(keyword)) {
      return replies;
    }
  }
  return [];
}

// FOLLOW-UP QUESTIONS (to encourage more replies)
const FOLLOW_UP_QUESTIONS = [
  "What about you - has anyone else walked through this?",
  "Has anyone found something that actually works?",
  "Would love to hear what's helped others.",
  "Anyone else relate to this?",
  "Curious what worked for everyone else.",
  "How are others navigating this?",
];

// ============================================================================
// HELPER FUNCTIONS
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

// Get a date within the last N days
function getRandomRecentDate(daysBack: number): Date {
  const now = new Date();
  const msBack = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - msBack);
}

// Get a date 1-24 hours after the reference date
function getReplyDate(referenceDate: Date, minHours: number = 1, maxHours: number = 24): Date {
  const hoursLater = minHours + Math.random() * (maxHours - minHours);
  return new Date(referenceDate.getTime() + hoursLater * 60 * 60 * 1000);
}

// Generate a reply based on the distribution (60% short, 30% medium, 10% long)
// Now accepts postContent to generate contextual replies
function generateReply(includeScripture: boolean = false, includeFollowUp: boolean = false, postContent: string = ''): string {
  const rand = Math.random();
  let reply: string;

  if (includeScripture && Math.random() < 0.3) {
    // ~30% chance of scripture reply when includeScripture is true
    const scripture = getRandomScripture();
    const template = getRandomItem(SCRIPTURE_REPLIES);
    reply = template
      .replace('{verse}', scripture.text.substring(0, 100) + '...')
      .replace('{reference}', scripture.verse);
  } else {
    // Try to find contextual replies based on post content (80% chance to use if available)
    const contextualReplies = postContent ? findContextualReplies(postContent) : [];
    if (contextualReplies.length > 0 && Math.random() < 0.8) {
      reply = getRandomItem(contextualReplies);
    } else if (rand < 0.60) {
      // 60% short
      reply = getRandomItem(SHORT_REPLIES);
    } else if (rand < 0.90) {
      // 30% medium
      reply = getRandomItem(MEDIUM_REPLIES);
    } else {
      // 10% long
      reply = getRandomItem(LONG_REPLIES);
    }
  }

  // Occasionally add a follow-up question (10% chance)
  if (includeFollowUp && Math.random() < 0.1) {
    reply += ' ' + getRandomItem(FOLLOW_UP_QUESTIONS);
  }

  return reply;
}

// Occasionally add cross-promotion (5% chance)
function maybeAddCrossPromotion(reply: string): string {
  if (Math.random() < 0.05) {
    return reply + '\n\n' + getRandomCrossPromotion();
  }
  return reply;
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedAdviceWithEngagement(postCount: number = 30) {
  console.info('\n🌱 Seeding Community Advice with Realistic Engagement...\n');

  try {
    // Get all users to use for posting and engagement
    const allUsers = await db.select().from(users);

    if (allUsers.length < 3) {
      console.error('❌ Need at least 3 users in database. Please seed users first.');
      console.error('   Run: npx tsx server/scripts/seed-bot-users.ts');
      process.exit(1);
    }

    // Find bot users by their usernames (from BOT_PERSONAS)
    const botUsernames = BOT_PERSONAS.map(p => p.username);
    const botUsers = allUsers.filter(u => botUsernames.includes(u.username));
    const regularUsers = allUsers.filter(u => !botUsernames.includes(u.username));

    // Prefer bot users for engagement, but use all users if not enough bots
    const engagementUsers = botUsers.length >= 5 ? botUsers : allUsers;

    console.info(`👥 Found ${allUsers.length} total users`);
    console.info(`🤖 Bot users available: ${botUsers.length}/${BOT_PERSONAS.length}`);
    console.info(`👤 Regular users: ${regularUsers.length}`);
    console.info(`📝 Using ${engagementUsers.length} users for engagement`);

    if (botUsers.length === 0) {
      console.warn('⚠️  No bot users found. Run seed-bot-users.ts first for best results.');
    }

    // Get random questions from our bank
    const questionsToPost = getRandomQuestions(postCount);
    console.info(`📝 Selected ${questionsToPost.length} questions to post\n`);

    let totalPosts = 0;
    let totalComments = 0;
    let totalNestedReplies = 0;
    let totalLikes = 0;
    let scriptureReplies = 0;
    let crossPromotions = 0;

    for (const question of questionsToPost) {
      // Pick a random author
      const author = getRandomItem(allUsers);
      const postDate = getRandomRecentDate(14); // Within last 2 weeks

      // Create the advice post (microblog with topic=QUESTION)
      const [newPost] = await db.insert(microblogs).values({
        authorId: author.id,
        content: question.content,
        topic: 'QUESTION' as any,
        anonymousNickname: Math.random() > 0.3 ? getRandomNickname() : null, // 70% anonymous
        createdAt: postDate,
      }).returning();

      totalPosts++;
      console.info(`\n✅ Posted: "${question.content.substring(0, 50)}..."`);

      // ========================================
      // ADD ENGAGEMENT
      // ========================================

      // Determine engagement level (some posts more popular than others)
      const isPopular = Math.random() < 0.3; // 30% of posts get more engagement
      const baseReplies = isPopular ? getRandomInt(5, 10) : getRandomInt(2, 5);
      const baseLikes = isPopular ? getRandomInt(8, 20) : getRandomInt(3, 8);

      // 1. Add likes to the main post (70-80% of base)
      const likeCount = Math.floor(baseLikes * (0.7 + Math.random() * 0.1));
      const likers = getRandomItems(engagementUsers.filter(u => u.id !== author.id), Math.min(likeCount, engagementUsers.length - 1));

      for (const liker of likers) {
        try {
          await db.insert(microblogLikes).values({
            microblogId: newPost.id,
            userId: liker.id,
            createdAt: getReplyDate(postDate, 0.5, 48),
          }).onConflictDoNothing();
          totalLikes++;
        } catch (e) {
          // Ignore duplicates
        }
      }

      // 2. Add top-level comments (use bot users for authentic engagement)
      const commentCount = baseReplies;
      const availableCommenters = engagementUsers.filter(u => u.id !== author.id);
      const commenters = getRandomItems(availableCommenters, Math.min(commentCount, availableCommenters.length));
      const usedReplies = new Set<string>();
      const createdComments: { id: number; authorId: number; createdAt: Date }[] = [];

      // Track scripture usage (1-2 per 3-4 replies)
      let scriptureCounter = 0;

      for (let i = 0; i < commenters.length; i++) {
        const commenter = commenters[i];

        // Include scripture every 3-4 replies
        const shouldIncludeScripture = scriptureCounter >= 3;
        if (shouldIncludeScripture) {
          scriptureCounter = 0;
          scriptureReplies++;
        } else {
          scriptureCounter++;
        }

        // Generate unique reply - pass question content for contextual replies
        let reply = generateReply(shouldIncludeScripture, i === commenters.length - 1, question.content);
        let attempts = 0;
        while (usedReplies.has(reply) && attempts < 10) {
          reply = generateReply(shouldIncludeScripture, false, question.content);
          attempts++;
        }
        usedReplies.add(reply);

        // Maybe add cross-promotion
        if (Math.random() < 0.05) {
          reply = maybeAddCrossPromotion(reply);
          crossPromotions++;
        }

        // Create reply with realistic timing (1-24 hours later)
        const replyDate = getReplyDate(postDate, 1, 24);
        const [newReply] = await db.insert(microblogs).values({
          authorId: commenter.id,
          content: reply,
          parentId: newPost.id,
          topic: 'OTHER' as any,
          createdAt: replyDate,
        }).returning();

        totalComments++;
        createdComments.push({ id: newReply.id, authorId: commenter.id, createdAt: replyDate });

        // Like 70-80% of comments
        if (Math.random() < 0.75) {
          const commentLikeCount = getRandomInt(1, 3);
          const commentLikers = getRandomItems(
            engagementUsers.filter(u => u.id !== commenter.id),
            Math.min(commentLikeCount, engagementUsers.length - 1)
          );

          for (const liker of commentLikers) {
            try {
              await db.insert(microblogLikes).values({
                microblogId: newReply.id,
                userId: liker.id,
                createdAt: getReplyDate(replyDate, 0.5, 12),
              }).onConflictDoNothing();
              totalLikes++;
            } catch (e) {
              // Ignore duplicates
            }
          }
        }
      }

      // 3. Add nested replies (thread building, 3-5 deep) for popular posts
      if (isPopular && createdComments.length >= 2) {
        // Pick 1-2 comments to have nested threads
        const threadsToCreate = getRandomInt(1, 2);
        const commentsForThreads = getRandomItems(createdComments, threadsToCreate);

        for (const parentComment of commentsForThreads) {
          // Create 2-4 nested replies
          const nestedCount = getRandomInt(2, 4);
          let currentParentId = parentComment.id;
          let currentParentDate = parentComment.createdAt;

          for (let depth = 0; depth < nestedCount && depth < 4; depth++) {
            const nestedCommenter = getRandomItem(
              engagementUsers.filter(u => u.id !== parentComment.authorId)
            );

            // Nested replies tend to be shorter
            const nestedReply = Math.random() < 0.7
              ? getRandomItem(SHORT_REPLIES)
              : getRandomItem(MEDIUM_REPLIES);

            // Reply 1-6 hours after parent
            const nestedDate = getReplyDate(currentParentDate, 1, 6);

            const [nestedReplyPost] = await db.insert(microblogs).values({
              authorId: nestedCommenter.id,
              content: nestedReply,
              parentId: currentParentId,
              topic: 'OTHER' as any,
              createdAt: nestedDate,
            }).returning();

            totalNestedReplies++;

            // 50% chance to like nested replies
            if (Math.random() < 0.5) {
              const nestedLiker = getRandomItem(engagementUsers.filter(u => u.id !== nestedCommenter.id));
              try {
                await db.insert(microblogLikes).values({
                  microblogId: nestedReplyPost.id,
                  userId: nestedLiker.id,
                  createdAt: getReplyDate(nestedDate, 0.5, 4),
                }).onConflictDoNothing();
                totalLikes++;
              } catch (e) {
                // Ignore duplicates
              }
            }

            // Next nested reply is a child of this one
            currentParentId = nestedReplyPost.id;
            currentParentDate = nestedDate;
          }
        }
      }

      const threadInfo = isPopular ? '🔥 Popular' : '';
      console.info(`   └─ ${likers.length} likes, ${commenters.length} comments ${threadInfo}`);
    }

    console.info('\n' + '='.repeat(60));
    console.info('✨ Seeding Complete!');
    console.info('='.repeat(60));
    console.info(`📝 Posts created: ${totalPosts}`);
    console.info(`💬 Top-level comments: ${totalComments}`);
    console.info(`🧵 Nested replies (threads): ${totalNestedReplies}`);
    console.info(`❤️  Total likes: ${totalLikes}`);
    console.info(`📖 Scripture-backed replies: ${scriptureReplies}`);
    console.info(`🔗 Cross-promotions: ${crossPromotions}`);
    console.info('='.repeat(60));
    console.info('\n📊 Engagement Distribution:');
    console.info(`   - 60% short encouraging replies`);
    console.info(`   - 30% medium advice replies`);
    console.info(`   - 10% long thoughtful replies`);
    console.info(`   - Scripture every 3-4 replies`);
    console.info(`   - 70-80% of replies get likes`);
    console.info(`   - 30% of posts are "popular" with threads`);
    console.info('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error seeding advice:', error);
    throw error;
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  let count = 30; // Default - quality over quantity

  // Parse --count argument
  const countArg = args.find(a => a.startsWith('--count='));
  if (countArg) {
    count = parseInt(countArg.split('=')[1]) || 30;
  }

  // Cap at 100 for quality (as per best practices)
  if (count > 100) {
    console.warn('⚠️  Capping at 100 posts (quality over quantity)');
    count = 100;
  }

  console.info(`\n📊 Will create ${count} advice posts with realistic engagement`);
  console.info(`   (Recommended: 30-50 high-quality posts > 500 empty ones)\n`);

  await seedAdviceWithEngagement(count);

  console.info('🎉 Done!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
