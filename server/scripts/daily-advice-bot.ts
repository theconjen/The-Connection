/**
 * Daily Advice Bot
 *
 * Posts 3-5 new advice questions per day and adds replies to recent posts.
 * Designed to run daily via cron job or scheduler.
 *
 * Run manually: npx tsx server/scripts/daily-advice-bot.ts
 * Run with custom count: npx tsx server/scripts/daily-advice-bot.ts --questions=5
 *
 * Cron example (run at 8am, 2pm, 8pm):
 * 0 8,14,20 * * * cd /path/to/project && npx tsx server/scripts/daily-advice-bot.ts --questions=1
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
// CONTEXTUAL REPLIES - Matched to question keywords
// ============================================================================

const CONTEXTUAL_REPLIES: Record<string, string[]> = {
  'love language': [
    "My husband is acts of service, I'm words of affirmation. What helped us was explicitly telling each other what we need. It felt awkward at first but now it's natural.",
    "We read the 5 Love Languages book together and it was eye-opening. Now we try to 'speak' each other's language even if it doesn't come naturally.",
    "Something that helped us: we each committed to doing one thing in the other's love language daily. Small but consistent acts add up.",
  ],
  'child': [
    "We went through this with our son. First, document everything. Then meet with the teacher AND principal together. Schools respond better when they know you're serious.",
    "My daughter struggled with this too. What helped: we role-played responses at home, built up her confidence with activities she excelled at, and stayed in close contact with teachers.",
    "One thing that helped our family: we focused on building our child's inner confidence rather than just trying to fix the external situation.",
  ],
  'bully': [
    "We went through this with our son. First, document everything. Then meet with the teacher AND principal together.",
    "My daughter was bullied in 5th grade. What helped: we role-played responses at home and built up her confidence with activities she excelled at.",
    "One thing that helped our family: we focused on building our child's inner confidence rather than just trying to stop the bullies.",
  ],
  'numb': [
    "I've been there. For me, numbness was actually my body's way of protecting me from overwhelm. What helped: small practices - lighting a candle during prayer, going for walks, journaling even just one sentence.",
    "Spiritual numbness often comes after intense seasons. Give yourself grace. Sometimes we need to just show up without expecting to feel anything.",
    "When I felt spiritually numb, a friend suggested I stop trying so hard and just rest. No performance, no striving. Just being with God.",
  ],
  'identity': [
    "After my divorce, I had to completely rebuild who I was. What helped: making a list of things that were true about me BEFORE and AFTER the change.",
    "Major life changes shook my identity too. I started asking 'Who does God say I am?' instead of 'Who was I?' Our identity in Christ doesn't change.",
    "I went through this after leaving my career. It helped to explore new things - hobbies, volunteering, classes. You're not starting over, you're building on everything you've learned.",
  ],
  'coworker': [
    "Boundaries have been key for me. I'm friendly but professional. When conflicts arise, I address them directly but calmly.",
    "Praying for difficult coworkers changed MY heart more than it changed them. It's hard to stay angry at someone you're praying for.",
    "Something practical that helped: I stopped expecting non-Christians to act like Christians. Lowered my frustration and helped me see them with compassion.",
  ],
  'screen time': [
    "We do 'phone-free' hours - during dinner and before bed. Those quiet moments have become sacred for prayer, reading, and real conversation.",
    "I replaced my morning scroll with morning prayer. Put my phone across the room so I have to physically get up. That first hour sets the tone.",
    "What worked for our family: we got physical Bibles and devotionals so we're not tempted by phone notifications during spiritual time.",
  ],
  'doubt': [
    "Doubt isn't the opposite of faith - it's part of faith. Some of the greatest believers in Scripture wrestled with doubt (Thomas, David, Job).",
    "I went through a major faith crisis a few years ago. What helped: reading books by Christians who'd wrestled with the same questions.",
    "My pastor told me something that stuck: 'Doubt your doubts as much as you doubt your faith.'",
  ],
  'fear': [
    "I struggle with anxiety about the future too. What helps: I limit how much news I consume, I journal my fears and pray over them specifically.",
    "Philippians 4:6-7 has been my anchor. When I feel fear rising, I literally stop and pray about the specific thing I'm afraid of.",
    "Something my therapist taught me: fear of the future is often grief about loss of control. Surrendering control to God is the antidote.",
  ],
  'pray': [
    "My prayer life transformed when I stopped treating it like a to-do list and started treating it like a conversation throughout the day.",
    "I started using a prayer journal and it changed everything. Writing my prayers helps me focus and looking back at answered prayers builds faith.",
    "What helped me: scheduled prayer time in the morning before the chaos starts, plus breath prayers throughout the day.",
  ],
  'marriage': [
    "We hit a rough patch a few years ago. What saved us: we started dating again - weekly date nights, no kid talk allowed.",
    "Christian counseling was a game-changer for us. Having a third party help us communicate was humbling but so helpful.",
    "One thing that helps us: we pray together every night before bed. Even when we're frustrated with each other.",
  ],
  'anger': [
    "I've wrestled with this too. Anger at God is often really grief or disappointment. He's big enough to handle our honest feelings.",
    "A counselor helped me see that my anger at God was actually anger at my circumstances, and I was directing it at Him because He felt 'safe.'",
    "Something that helped me: reading Lamentations. It's basically a whole book of someone being angry and grieving before God.",
  ],
  'church hurt': [
    "Church hurt took me years to process. What helped: finding a small group before committing to a church. Trust builds slowly and that's okay.",
    "After being burned by church leadership, I took a year off from organized church. When I came back, I chose a smaller church where accountability was real.",
    "Something that helped me: separating God from His imperfect followers. People will disappoint us - they're human. But God never will.",
  ],
  'loneliness': [
    "I feel this deeply. What's helped: being the initiator. Instead of waiting for invites, I started hosting - simple dinners, coffee after church.",
    "Church can be the loneliest place when you're surrounded by people but not really known. I found one person to be real with - just one.",
    "Something counterintuitive that helped: volunteering. Serving alongside others created natural friendships.",
  ],
  'addiction': [
    "10 years sober here. What worked: Celebrate Recovery, daily accountability, and addressing the underlying pain that drove the addiction.",
    "Recovery is possible. I'm living proof. But it took surrendering completely - not 99%, but 100%. And getting help I didn't want to admit I needed.",
    "What helped me: telling ONE person the whole truth. Secrets keep us sick. The shame lost its power when I brought it into the light.",
  ],
  'teenager': [
    "Parent of 3 teens here. It's normal for them to question everything - it's how they make faith their own. Stay calm and keep the relationship open.",
    "What helped with our teens: we stopped lecturing and started asking questions. 'What do you think about that?' opens conversation better than 'Here's what you should believe.'",
    "Our kids questioned everything too. We gave them space to doubt while keeping our home a safe place to discuss anything.",
  ],
  'memorize': [
    "What worked for me: writing verses on index cards and reviewing them during commute time. Repetition is key.",
    "I use the app 'Scripture Typer' - typing out verses helps them stick better than just reading.",
    "Start small - one verse a week, really meditate on it. Quality over quantity. I also set the verse as my phone wallpaper.",
  ],
  'church': [
    "When we moved, we visited 10+ churches before finding our home. Don't rush it. Look for genuine community, not just good preaching.",
    "What helped us: we looked for a church where we could serve, not just consume. Getting involved fast helped us connect.",
    "Ask around! The best church recommendations come from people whose faith you respect. Also, small groups are where real connection happens.",
  ],
  'anxiety': [
    "I deal with this daily. What helps: morning routine anchored in Scripture, limiting caffeine, and being honest with my small group about hard days.",
    "Anxiety and faith can coexist - having anxiety doesn't mean you lack faith. God gave us brains that sometimes misfire. Medication + prayer both helped me.",
    "Something practical: when anxiety hits, I do 4-7-8 breathing while reciting a verse. Engages both body and spirit.",
  ],
  'health': [
    "Went through a major diagnosis 3 years ago. What helped: finding one person who'd been through something similar, journaling my prayers, and letting people help.",
    "Health crises have a way of stripping everything down to what matters. I learned to receive help - that was humbling but necessary.",
    "I had to grieve the life I'd planned while trusting God with the life I have. Both/and, not either/or. It's a daily surrender.",
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

  // Return generic replies if no keyword match
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

  // Try to find contextual replies based on post content
  if (postContent) {
    const contextualReplies = findContextualReplies(postContent);
    if (contextualReplies.length > 0 && Math.random() < 0.8) {
      // 80% chance to use contextual reply when available
      return getRandomItem(contextualReplies);
    }
  }

  // Fallback to generic replies
  if (rand < 0.60) return getRandomItem(SHORT_REPLIES);
  if (rand < 0.90) return getRandomItem(MEDIUM_REPLIES);
  return getRandomItem(LONG_REPLIES);
}

// ============================================================================
// MAIN BOT LOGIC
// ============================================================================

async function postNewQuestions(count: number) {
  console.info(`\n📝 Posting ${count} new advice questions...\n`);

  // Get bot users
  const botUsernames = BOT_PERSONAS.map(p => p.username);
  const usersResult = await db.execute(sql`
    SELECT id, username FROM users
    WHERE username = ANY(${`{${botUsernames.join(',')}}`}::text[])
  `);
  const botUsers = (usersResult.rows || []) as { id: number; username: string }[];

  if (botUsers.length === 0) {
    console.error('❌ No bot users found. Run seed-bot-users.ts first.');
    return [];
  }

  const questions = getRandomQuestions(count);
  const postedIds: number[] = [];

  for (const question of questions) {
    const author = getRandomItem(botUsers);
    const useAnonymous = Math.random() > 0.3; // 70% anonymous

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
      console.info(`✅ Posted: "${question.content.substring(0, 50)}..."`);
    }
  }

  return postedIds;
}

async function addRepliesToRecentPosts() {
  console.info(`\n💬 Adding replies to recent advice posts...\n`);

  // Get bot users
  const botUsernames = BOT_PERSONAS.map(p => p.username);
  const usersResult = await db.execute(sql`
    SELECT id, username FROM users
    WHERE username = ANY(${`{${botUsernames.join(',')}}`}::text[])
  `);
  const botUsers = (usersResult.rows || []) as { id: number; username: string }[];

  if (botUsers.length === 0) {
    console.error('❌ No bot users found.');
    return;
  }

  // Get recent advice posts from the last 3 days that could use more replies
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
  let likesAdded = 0;

  for (const post of posts) {
    const currentReplies = parseInt(post.reply_count) || 0;

    // Skip posts that already have enough replies (5+)
    if (currentReplies >= 5) continue;

    // Add 1-3 new replies
    const newReplyCount = getRandomInt(1, 3);
    const repliers = getRandomItems(
      botUsers.filter(u => u.id !== post.author_id),
      newReplyCount
    );

    let scriptureCounter = 0;

    for (const replier of repliers) {
      // Include scripture every 3-4 replies
      const includeScripture = scriptureCounter >= 3;
      if (includeScripture) scriptureCounter = 0;
      else scriptureCounter++;

      // Pass post content to get contextual replies
      let reply = generateReply(includeScripture, post.content);

      // 5% chance to add cross-promotion
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

      // 75% chance to like the original post
      if (Math.random() < 0.75) {
        try {
          await db.execute(sql`
            INSERT INTO microblog_likes (microblog_id, user_id, created_at)
            VALUES (${post.id}, ${replier.id}, NOW())
            ON CONFLICT DO NOTHING
          `);
          likesAdded++;
        } catch (e) {
          // Ignore duplicate likes
        }
      }
    }

    console.info(`   💬 Added ${newReplyCount} replies to post #${post.id}`);
  }

  console.info(`\n   Total: ${repliesAdded} replies, ${likesAdded} likes added`);
}

async function addRepliesToReplies() {
  console.info(`\n🧵 Building conversation threads...\n`);

  // Get bot users
  const botUsernames = BOT_PERSONAS.map(p => p.username);
  const usersResult = await db.execute(sql`
    SELECT id, username FROM users
    WHERE username = ANY(${`{${botUsernames.join(',')}}`}::text[])
  `);
  const botUsers = (usersResult.rows || []) as { id: number; username: string }[];

  if (botUsers.length === 0) return;

  // Get recent replies that don't have nested replies yet
  const recentReplies = await db.execute(sql`
    SELECT m.id, m.author_id, m.parent_id
    FROM microblogs m
    WHERE m.parent_id IS NOT NULL
      AND m.created_at > NOW() - INTERVAL '2 days'
      AND NOT EXISTS (SELECT 1 FROM microblogs r WHERE r.parent_id = m.id)
    ORDER BY RANDOM()
    LIMIT 10
  `);

  const replies = (recentReplies.rows || []) as { id: number; author_id: number; parent_id: number }[];

  let threadsCreated = 0;

  for (const reply of replies) {
    // 30% chance to create a nested thread
    if (Math.random() > 0.3) continue;

    const replier = getRandomItem(botUsers.filter(u => u.id !== reply.author_id));
    const nestedReply = getRandomItem(SHORT_REPLIES);

    await db.execute(sql`
      INSERT INTO microblogs (
        author_id,
        content,
        parent_id,
        topic,
        created_at
      ) VALUES (
        ${replier.id},
        ${nestedReply},
        ${reply.id},
        'OTHER',
        NOW()
      )
    `);

    threadsCreated++;
  }

  console.info(`   Created ${threadsCreated} nested thread replies`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse --questions argument (default: 3-5 random)
  let questionCount = getRandomInt(3, 5);
  const questionsArg = args.find(a => a.startsWith('--questions='));
  if (questionsArg) {
    questionCount = parseInt(questionsArg.split('=')[1]) || questionCount;
  }

  console.info('='.repeat(50));
  console.info('🤖 Daily Advice Bot');
  console.info('='.repeat(50));
  console.info(`📅 ${new Date().toLocaleDateString()}`);
  console.info(`📝 Posting ${questionCount} new questions`);
  console.info('='.repeat(50));

  // 1. Post new questions
  const newPostIds = await postNewQuestions(questionCount);

  // 2. Add replies to recent posts (including new ones)
  await addRepliesToRecentPosts();

  // 3. Build conversation threads
  await addRepliesToReplies();

  console.info('\n' + '='.repeat(50));
  console.info('✨ Daily bot run complete!');
  console.info('='.repeat(50) + '\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
