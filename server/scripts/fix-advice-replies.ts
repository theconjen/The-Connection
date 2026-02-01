/**
 * Fix Advice Replies
 *
 * Replaces generic replies with contextually relevant ones that match each question.
 * Run: npx tsx server/scripts/fix-advice-replies.ts
 */

import 'dotenv/config';
import { db } from '../db';
import { microblogs, users } from '@shared/schema';
import { eq, sql, isNotNull } from 'drizzle-orm';

// Question-specific replies - mapped by keywords in the question
const CONTEXTUAL_REPLIES: Record<string, string[]> = {
  'love languages': [
    "My husband is acts of service, I'm words of affirmation. What helped us was explicitly telling each other what we need - 'I feel loved when you say thank you for dinner' or 'I feel loved when you help with dishes.' It felt awkward at first but now it's natural.",
    "We read the 5 Love Languages book together and it was eye-opening. Now we try to 'speak' each other's language even if it doesn't come naturally. Takes effort but worth it!",
    "Something that helped us: we each committed to doing one thing in the other's love language daily. Small but consistent acts add up.",
  ],
  'child': [
    "We went through this with our son. First, document everything. Then meet with the teacher AND principal together. Schools respond better when they know you're serious and keeping records.",
    "My daughter was bullied in 5th grade. What helped: we role-played responses at home, built up her confidence with activities she excelled at, and I stayed in close contact with her teacher. It took time but it got better.",
    "One thing that helped our family: we focused on building our child's inner confidence rather than just trying to stop the bullies. Counseling helped him process his feelings too.",
  ],
  'bullied': [
    "We went through this with our son. First, document everything. Then meet with the teacher AND principal together. Schools respond better when they know you're serious and keeping records.",
    "My daughter was bullied in 5th grade. What helped: we role-played responses at home, built up her confidence with activities she excelled at, and I stayed in close contact with her teacher. It took time but it got better.",
    "One thing that helped our family: we focused on building our child's inner confidence rather than just trying to stop the bullies. Counseling helped him process his feelings too.",
  ],
  'numb': [
    "I've been there. For me, numbness was actually my body's way of protecting me from overwhelm. What helped: small practices - lighting a candle during prayer, going for walks, journaling even just one sentence. Feeling comes back slowly.",
    "Spiritual numbness often comes after intense seasons. Give yourself grace. Sometimes we need to just show up - read a Psalm, sit in silence - without expecting to feel anything. Feelings follow faithfulness.",
    "When I felt spiritually numb, a friend suggested I stop trying so hard and just rest. No performance, no striving. Just being with God like you'd sit with a friend in comfortable silence. It helped more than all my effort.",
  ],
  'identity': [
    "After my divorce, I had to completely rebuild who I was. What helped: making a list of things that were true about me BEFORE and AFTER the change. Your core self is still there, just needs rediscovering.",
    "Major life changes shook my identity too. I started asking 'Who does God say I am?' instead of 'Who was I?' Scripture like Ephesians 1-2 became my foundation. Our identity in Christ doesn't change even when everything else does.",
    "I went through this after leaving my career. It helped to explore new things - hobbies, volunteering, classes. You're not starting over, you're building on everything you've learned.",
  ],
  'coworker': [
    "Boundaries have been key for me. I'm friendly but professional. I don't engage in gossip or drama. When conflicts arise, I address them directly but calmly. It's not about being 'nice' - it's about being respectful while protecting your peace.",
    "Praying for difficult coworkers changed MY heart more than it changed them. It's hard to stay angry at someone you're praying for. Doesn't mean I let them walk over me, but it keeps my attitude right.",
    "Something practical that helped: I stopped expecting non-Christians to act like Christians. Lowered my frustration and helped me see them with compassion instead.",
  ],
  'screen time': [
    "We do 'phone-free' hours - during dinner and before bed. Those quiet moments have become sacred for prayer, reading, and real conversation. It was hard at first but now everyone looks forward to it.",
    "I replaced my morning scroll with morning prayer. Put my phone across the room so I have to physically get up. That first hour sets the tone for my whole day.",
    "What worked for our family: we got physical Bibles and devotionals so we're not tempted by phone notifications during spiritual time. Old school but effective!",
  ],
  'doubt': [
    "Doubt isn't the opposite of faith - it's part of faith. Some of the greatest believers in Scripture wrestled with doubt (Thomas, David, Job). Bring your questions to God - He can handle them.",
    "I went through a major faith crisis a few years ago. What helped: reading books by Christians who'd wrestled with the same questions (Tim Keller, C.S. Lewis). I wasn't the first and won't be the last.",
    "My pastor told me something that stuck: 'Doubt your doubts as much as you doubt your faith.' Our doubts aren't always as rational as they feel in the moment.",
  ],
  'fear': [
    "I struggle with anxiety about the future too. What helps: I limit how much news I consume, I journal my fears and then pray over them specifically, and I remind myself of past faithfulness. He's been faithful before, He'll be faithful again.",
    "Philippians 4:6-7 has been my anchor. When I feel fear rising, I literally stop and pray about the specific thing I'm afraid of. Not a magic fix, but it redirects my mind.",
    "Something my therapist taught me: fear of the future is often grief about loss of control. Surrendering control to God (daily, sometimes hourly) is the antidote. Easier said than done, but practice helps.",
  ],
  'pray': [
    "My prayer life transformed when I stopped treating it like a to-do list and started treating it like a conversation. Now I talk to God throughout the day - while driving, cooking, working. He's always there.",
    "I started using a prayer journal and it changed everything. Writing my prayers helps me focus and looking back at answered prayers builds my faith for current struggles.",
    "What helped me: scheduled prayer time in the morning before the chaos starts, plus breath prayers throughout the day. 'Lord, help me' counts as much as eloquent prayers.",
  ],
  'marriage': [
    "We hit a rough patch a few years ago. What saved us: we started dating again - weekly date nights, no kid talk allowed. We had to intentionally reconnect as a couple, not just co-parents or roommates.",
    "Christian counseling was a game-changer for us. Having a third party help us communicate was humbling but so helpful. No shame in getting help.",
    "One thing that helps us: we pray together every night before bed. Even when we're frustrated with each other. It's hard to stay mad at someone you're praying with.",
  ],
  'anger': [
    "I've wrestled with this too. Anger at God is often really grief or disappointment. He's big enough to handle our honest feelings - look at the Psalms, David yelled at God all the time.",
    "A counselor helped me see that my anger at God was actually anger at my circumstances, and I was directing it at Him because He felt 'safe.' Processing the underlying hurt helped.",
    "Something that helped me: reading Lamentations. It's basically a whole book of someone being angry and grieving before God. Our honest emotions aren't sin - it's what we do with them that matters.",
  ],
  'church hurt': [
    "Church hurt took me years to process. What helped: finding a small group before committing to a church. Getting to know real people, not just Sunday performances. Trust builds slowly and that's okay.",
    "After being burned by church leadership, I took a year off from organized church. I didn't leave my faith, just institutions. When I came back, I chose a smaller church where accountability was real.",
    "Something that helped me: separating God from His imperfect followers. People will disappoint us - they're human. But God never will. He was hurt by what happened to you too.",
  ],
  'loneliness': [
    "I feel this deeply. What's helped: being the initiator. Instead of waiting for invites, I started hosting - simple dinners, coffee after church, walks. It's vulnerable but it works.",
    "Church can be the loneliest place when you're surrounded by people but not really known. I found one person to be real with - just one. That connection made all the difference.",
    "Something counterintuitive that helped: volunteering. Serving alongside others created natural friendships in a way that just 'attending' never did.",
  ],
  'addiction': [
    "10 years sober here. What worked: Celebrate Recovery (or similar Christ-centered recovery program), daily accountability, and addressing the underlying pain that drove the addiction. You can't just stop - you have to heal what's underneath.",
    "Recovery is possible. I'm living proof. But it took surrendering completely - not 99%, but 100%. And getting help I didn't want to admit I needed. DM me if you need someone to talk to.",
    "What helped me: telling ONE person the whole truth. Secrets keep us sick. The shame lost its power when I brought it into the light. It's terrifying but it's the first step.",
  ],
  'teenager': [
    "Parent of 3 teens here. It's normal for them to question everything - it's how they make faith their own. Stay calm, answer honestly (including 'I don't know'), and keep the relationship open. They'll come back.",
    "What helped with our teens: we stopped lecturing and started asking questions. 'What do you think about that?' opens conversation better than 'Here's what you should believe.'",
    "Our kids questioned everything too. We gave them space to doubt while keeping our home a safe place to discuss anything. Most of them circled back to faith in their 20s.",
  ],
};

// Fallback contextual replies for questions that don't match specific keywords
const GENERAL_SUPPORTIVE_REPLIES = [
  "Thank you for being vulnerable enough to ask this. I don't have all the answers, but I'm praying for you right now.",
  "I've walked a similar road. It's hard but not hopeless. Would be happy to share more if you want to DM.",
  "This is such an important question. I'm following this thread because I need wisdom here too.",
];

// Get bot users for attribution
async function getBotUsers() {
  // Use raw SQL to avoid schema column mismatch
  const result = await db.execute(sql`
    SELECT id, username, display_name as "displayName"
    FROM users
    WHERE display_name IN ('Sarah M.', 'Rachel S.', 'Mike T.', 'Jennifer L.', 'David K.', 'Emily R.')
    LIMIT 6
  `);

  // Neon returns { rows: [...] } or array directly depending on driver
  let bots = Array.isArray(result) ? result : (result as any).rows || [];

  if (!bots || bots.length === 0) {
    // Fallback: get any users
    const fallback = await db.execute(sql`
      SELECT id, username, display_name as "displayName"
      FROM users
      LIMIT 6
    `);
    bots = Array.isArray(fallback) ? fallback : (fallback as any).rows || [];
  }

  console.info(`[DEBUG] Bot users found:`, bots.length, bots.map((b: any) => b.displayName || b.username));
  return bots;
}

function findMatchingReplies(questionContent: string): string[] {
  const contentLower = questionContent.toLowerCase();

  for (const [keyword, replies] of Object.entries(CONTEXTUAL_REPLIES)) {
    if (contentLower.includes(keyword)) {
      return replies;
    }
  }

  return GENERAL_SUPPORTIVE_REPLIES;
}

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

async function fixAdviceReplies() {
  console.info('\n🔧 Fixing advice replies with contextual content...\n');

  try {
    // Get all advice posts (topic=QUESTION, no parentId)
    const advicePosts = await db
      .select()
      .from(microblogs)
      .where(sql`${microblogs.topic} = 'QUESTION' AND ${microblogs.parentId} IS NULL`);

    console.info(`📝 Found ${advicePosts.length} advice posts to fix\n`);

    // Get bot users
    const botUsers = await getBotUsers();
    if (botUsers.length === 0) {
      console.error('❌ No users found to attribute replies to');
      return;
    }
    console.info(`👥 Using ${botUsers.length} users for replies\n`);

    let totalDeleted = 0;
    let totalCreated = 0;

    for (const post of advicePosts) {
      // Delete all nested replies first (replies to replies), then direct replies
      // Use raw SQL with CASCADE-like deletion
      const deleteResult = await db.execute(sql`
        WITH RECURSIVE reply_tree AS (
          -- Direct replies to this post
          SELECT id FROM microblogs WHERE parent_id = ${post.id}
          UNION ALL
          -- Nested replies (replies to replies)
          SELECT m.id FROM microblogs m
          INNER JOIN reply_tree rt ON m.parent_id = rt.id
        )
        DELETE FROM microblogs WHERE id IN (SELECT id FROM reply_tree)
        RETURNING id
      `);

      const deleted = Array.isArray(deleteResult) ? deleteResult : (deleteResult as any).rows || [];
      totalDeleted += deleted.length;

      // Find contextual replies for this question
      const matchingReplies = findMatchingReplies(post.content || '');

      // Get 2-3 random replies from the matching set
      const repliesToCreate = getRandomItems(matchingReplies, Math.min(3, matchingReplies.length));

      // Create new contextual replies
      for (let i = 0; i < repliesToCreate.length; i++) {
        const replyContent = repliesToCreate[i];
        const author = botUsers[i % botUsers.length];

        // Create reply with timestamp 1-12 hours after original post
        const replyDate = new Date(post.createdAt!);
        replyDate.setHours(replyDate.getHours() + 1 + Math.floor(Math.random() * 11));

        await db.insert(microblogs).values({
          authorId: author.id,
          content: replyContent,
          parentId: post.id,
          topic: 'OTHER' as any,
          createdAt: replyDate,
        });

        totalCreated++;
      }

      console.info(`  ✅ Post ${post.id}: "${post.content?.substring(0, 40)}..." - ${deleted.length} deleted, ${repliesToCreate.length} created`);
    }

    // Update reply counts
    console.info('\n📊 Updating reply counts...');
    await db.execute(sql`
      UPDATE microblogs m
      SET reply_count = (
        SELECT COUNT(*)::int FROM microblogs r WHERE r.parent_id = m.id
      )
      WHERE m.topic = 'QUESTION' AND m.parent_id IS NULL
    `);

    console.info('\n' + '='.repeat(50));
    console.info('✨ Fix Complete!');
    console.info('='.repeat(50));
    console.info(`🗑️  Deleted: ${totalDeleted} generic replies`);
    console.info(`✅ Created: ${totalCreated} contextual replies`);
    console.info('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error fixing replies:', error);
    throw error;
  }
}

fixAdviceReplies()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
