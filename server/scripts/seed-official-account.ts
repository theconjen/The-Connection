/**
 * Seed Official "The Connection Team" Account & Initial Content
 *
 * Creates a system user for the platform team and seeds 10 microblog posts
 * covering devotionals, discussion starters, feature tips, and encouragement.
 * Posts are backdated over the last 7 days so the feed looks naturally populated.
 *
 * Run: npx tsx server/scripts/seed-official-account.ts
 * Clear & reseed: npx tsx server/scripts/seed-official-account.ts --clear
 */

import 'dotenv/config';
import { db } from '../db';
import { users, microblogs } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import * as argon2 from 'argon2';
import crypto from 'crypto';

// ============================================================================
// OFFICIAL ACCOUNT CONFIG
// ============================================================================

const OFFICIAL_USERNAME = 'theconnectionteam';
const OFFICIAL_DISPLAY_NAME = 'The Connection Team';
const OFFICIAL_BIO = 'Official account for The Connection — your Christian community platform.';
const OFFICIAL_AVATAR = 'https://ui-avatars.com/api/?name=The+Connection&background=6366f1&color=fff&size=256&bold=true';

// ============================================================================
// SEED POSTS — 10 initial microblog posts
// ============================================================================

const SEED_POSTS: { content: string; topic: string; daysAgo: number }[] = [
  // 3 daily devotionals / Scripture reflections
  {
    content: `"For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future." — Jeremiah 29:11\n\nNo matter where you are today, God's plans for your life are good. Take a moment to rest in that promise. 🙏`,
    topic: 'SCRIPTURE',
    daysAgo: 7,
  },
  {
    content: `Morning reflection: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." — Proverbs 3:5-6\n\nWhat area of your life do you need to surrender to God today?`,
    topic: 'SCRIPTURE',
    daysAgo: 5,
  },
  {
    content: `"Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go." — Joshua 1:9\n\nStarting something new can feel overwhelming. But you don't walk alone. He goes before you.`,
    topic: 'SCRIPTURE',
    daysAgo: 3,
  },

  // 2 discussion-starter questions
  {
    content: `What's one Bible verse that has gotten you through a tough season? We'd love to hear what Scripture has meant the most to you. Drop it below! 👇`,
    topic: 'QUESTION',
    daysAgo: 6,
  },
  {
    content: `If you could have coffee with any person from the Bible (besides Jesus), who would it be and what would you ask them? Let's have some fun with this one! ☕`,
    topic: 'QUESTION',
    daysAgo: 2,
  },

  // 2 feature tips
  {
    content: `Did you know you can join communities based on your interests? Whether it's Bible study, worship, young adults, or apologetics — there's a community for you. Tap the Communities tab to explore! 🔍`,
    topic: 'OTHER',
    daysAgo: 6,
  },
  {
    content: `Pro tip: You can bookmark posts and advice to save them for later! Just tap the bookmark icon on any post. Find all your saved content in your Bookmarks screen. 📌`,
    topic: 'OTHER',
    daysAgo: 4,
  },

  // 3 apologetics highlights / faith encouragement
  {
    content: `Welcome to The Connection! 🎉 This is a space built for Christians to connect, encourage one another, share prayer requests, and grow in faith together. We're so glad you're here.`,
    topic: 'OTHER',
    daysAgo: 7,
  },
  {
    content: `Struggling with doubt? You're not alone — and it's okay. Doubt can actually strengthen your faith when you bring it to God honestly. Check out our Apologetics section for thoughtful Q&A on tough questions. 💡`,
    topic: 'OBSERVATION',
    daysAgo: 4,
  },
  {
    content: `Reminder: You are loved. You are seen. You are known by the Creator of the universe. Whatever today holds, let that truth anchor you. ❤️\n\n"See what great love the Father has lavished on us, that we should be called children of God!" — 1 John 3:1`,
    topic: 'SCRIPTURE',
    daysAgo: 1,
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedOfficialAccount() {
  console.info('\n' + '='.repeat(60));
  console.info('  Seeding Official Account: The Connection Team');
  console.info('='.repeat(60) + '\n');

  const shouldClear = process.argv.includes('--clear');

  try {
    // Check if account already exists
    const existing = await db.execute(
      sql`SELECT id FROM users WHERE username = ${OFFICIAL_USERNAME} LIMIT 1`
    );

    let officialUserId: number;

    if (existing.rows && existing.rows.length > 0) {
      officialUserId = existing.rows[0].id as number;

      if (shouldClear) {
        // Delete existing posts from this account
        await db.execute(
          sql`DELETE FROM microblogs WHERE author_id = ${officialUserId}`
        );
        console.info(`🗑️  Cleared existing posts for @${OFFICIAL_USERNAME}`);
      } else {
        console.info(`⏭️  Account @${OFFICIAL_USERNAME} already exists (id: ${officialUserId})`);

        // Check if posts already exist
        const postCount = await db.execute(
          sql`SELECT COUNT(*) as count FROM microblogs WHERE author_id = ${officialUserId}`
        );
        const count = Number(postCount.rows[0].count);
        if (count > 0 && !shouldClear) {
          console.info(`⏭️  ${count} posts already exist. Use --clear to reseed.`);
          console.info('\n✅ Done (no changes needed)\n');
          return;
        }
      }
    } else {
      // Create the official account
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await argon2.hash(randomPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });

      const result = await db.execute(
        sql`INSERT INTO users (username, email, password, display_name, bio, avatar_url, is_admin, onboarding_completed, email_verified)
            VALUES (${OFFICIAL_USERNAME}, ${'team@theconnection.app'}, ${hashedPassword}, ${OFFICIAL_DISPLAY_NAME}, ${OFFICIAL_BIO}, ${OFFICIAL_AVATAR}, ${true}, ${true}, ${true})
            RETURNING id`
      );

      officialUserId = result.rows[0].id as number;
      console.info(`✅ Created account @${OFFICIAL_USERNAME} (id: ${officialUserId})`);
    }

    // Seed the microblog posts
    let created = 0;
    for (const post of SEED_POSTS) {
      const createdAt = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000);
      // Add some randomness to the hour
      createdAt.setHours(7 + Math.floor(Math.random() * 12));
      createdAt.setMinutes(Math.floor(Math.random() * 60));

      await db.execute(
        sql`INSERT INTO microblogs (content, author_id, topic, created_at)
            VALUES (${post.content}, ${officialUserId}, ${post.topic}, ${createdAt})`
      );
      created++;
    }

    console.info(`✅ Created ${created} microblog posts`);
    console.info('\n' + '='.repeat(60));
    console.info('  Summary');
    console.info('='.repeat(60));
    console.info(`  Account: @${OFFICIAL_USERNAME} (id: ${officialUserId})`);
    console.info(`  Posts:   ${created} microblog posts seeded`);
    console.info(`  Span:    Last 7 days`);
    console.info('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error seeding official account:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedOfficialAccount();
