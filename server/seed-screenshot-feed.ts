/**
 * Seed script for App Store screenshot feed/microblogs
 * Run: npx tsx server/seed-screenshot-feed.ts
 * Remove: npx tsx server/seed-screenshot-feed.ts --remove
 */

import 'dotenv/config';
import { db } from './db';
import { microblogs, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Flag feed posts as screenshot data
const SCREENSHOT_FLAG = '[SCREENSHOT]';

const screenshotFeedPosts = [
  {
    content: `${SCREENSHOT_FLAG} Just finished reading Philippians 4:13 during my morning devotional. 'I can do all things through Christ who strengthens me.' Needed this reminder today! 🙏`,
    tags: ['devotional', 'scripture', 'encouragement'],
  },
  {
    content: `${SCREENSHOT_FLAG} Volunteered at the local food bank this morning. Incredible to see our church community come together to serve! 30 families fed today. ❤️`,
    tags: ['service', 'community', 'outreach'],
  },
  {
    content: `${SCREENSHOT_FLAG} Bible study question: How do you stay consistent in your prayer life? I struggle with making it a daily habit. Any tips from seasoned prayer warriors?`,
    tags: ['prayer', 'question', 'advice'],
  },
  {
    content: `${SCREENSHOT_FLAG} Worship practice tonight was POWERFUL. Can't wait for Sunday's service. God is moving in amazing ways! 🎵`,
    tags: ['worship', 'music', 'church'],
  },
  {
    content: `${SCREENSHOT_FLAG} Grateful for the 3am prayer warriors. Couldn't sleep, posted a prayer request, and within minutes had 5 people interceding. This community is everything. 💙`,
    tags: ['prayer', 'community', 'gratitude'],
  },
  {
    content: `${SCREENSHOT_FLAG} Teaching my kids about David and Goliath. Their faces when they realize God can use anyone, regardless of size or age. These moments are priceless! 👨‍👩‍👧‍👦`,
    tags: ['parenting', 'biblestory', 'family'],
  },
  {
    content: `${SCREENSHOT_FLAG} Romans 8:28 is hitting different today. 'And we know that in all things God works for the good of those who love him.' Trust His plan. ✨`,
    tags: ['scripture', 'faith', 'trust'],
  },
  {
    content: `${SCREENSHOT_FLAG} Men's breakfast this Saturday 7am! Bacon, eggs, and diving into James chapter 1. All men welcome. DM for location!`,
    tags: ['mens', 'breakfast', 'biblestudy'],
  },
  {
    content: `${SCREENSHOT_FLAG} Just baptized my best friend! Watching her surrender her life to Christ was one of the most beautiful moments I've witnessed. New creation! 🌊`,
    tags: ['baptism', 'testimony', 'celebration'],
  },
  {
    content: `${SCREENSHOT_FLAG} Praying for everyone taking exams this week. You've got this! God gave you a sound mind. 2 Timothy 1:7 📚`,
    tags: ['prayer', 'students', 'encouragement'],
  },
  {
    content: `${SCREENSHOT_FLAG} Coffee date with a sister in Christ this morning. Sometimes you just need someone to listen and pray with you. Grateful for authentic friendships. ☕`,
    tags: ['friendship', 'coffee', 'fellowship'],
  },
  {
    content: `${SCREENSHOT_FLAG} Youth group game night was WILD! 40 teens showed up. We laughed, played, and ended with powerful worship. This generation is on fire! 🔥`,
    tags: ['youth', 'games', 'ministry'],
  },
  {
    content: `${SCREENSHOT_FLAG} Hiking at sunrise to pray and journal. There's something about God's creation that makes His presence feel so close. 🏔️`,
    tags: ['nature', 'prayer', 'hiking'],
  },
  {
    content: `${SCREENSHOT_FLAG} Reading through Psalms and I'm struck by David's raw honesty with God. Permission to bring our real emotions to Him, not just the 'pretty' prayers.`,
    tags: ['psalms', 'prayer', 'honesty'],
  },
  {
    content: `${SCREENSHOT_FLAG} Recovery group tonight. 6 months sober today! Couldn't have done it without this community and Jesus. One day at a time. 💪`,
    tags: ['recovery', 'testimony', 'sobriety'],
  },
  {
    content: `${SCREENSHOT_FLAG} Mission trip to Guatemala approved! Taking a team of 15 to build homes and share the Gospel. June can't come soon enough! 🌎`,
    tags: ['missions', 'travel', 'service'],
  },
  {
    content: `${SCREENSHOT_FLAG} Studying apologetics and I'm blown away by the historical evidence for Jesus' resurrection. Our faith is built on solid ground! 📖`,
    tags: ['apologetics', 'study', 'evidence'],
  },
  {
    content: `${SCREENSHOT_FLAG} Moms prayer group this morning. We prayed over our kids, our marriages, our communities. Powerful when women unite in prayer! 👩‍👩‍👧`,
    tags: ['moms', 'prayer', 'women'],
  },
  {
    content: `${SCREENSHOT_FLAG} Just got my first theology book! 'Mere Christianity' by C.S. Lewis. Ready to dig deeper into my faith. Any other book recommendations?`,
    tags: ['books', 'theology', 'learning'],
  },
  {
    content: `${SCREENSHOT_FLAG} Worship team needs a drummer! If you can keep a beat and love Jesus, we want you. No experience necessary, just a willing heart. 🥁`,
    tags: ['worship', 'music', 'volunteer'],
  },
];

async function seedScreenshotFeed() {
  console.info('🌱 Seeding screenshot feed posts...');

  try {
    // Get screenshot users (filter by bio containing SCREENSHOT_FLAG)
    const allUsers = await db.select().from(users);
    const demoUsers = allUsers.filter(u => u.bio?.includes(SCREENSHOT_FLAG));

    if (demoUsers.length === 0) {
      console.error('❌ No screenshot users found. Please seed users first.');
      return;
    }

    console.info(`Found ${demoUsers.length} screenshot users`);

    // Check if we already have posts from screenshot users
    const screenshotUserIds = demoUsers.map(u => u.id);
    const existingPosts = await db.select().from(microblogs);
    const existingScreenshotPosts = existingPosts.filter(p => screenshotUserIds.includes(p.authorId));

    if (existingScreenshotPosts.length >= screenshotFeedPosts.length) {
      console.info(`⏭️  Skipped: ${existingScreenshotPosts.length} screenshot feed posts already exist`);
      return;
    }

    let created = 0;
    // Create feed posts with rotating authors
    for (let i = 0; i < screenshotFeedPosts.length; i++) {
      const post = screenshotFeedPosts[i];
      const author = demoUsers[i % demoUsers.length];

      // Check if this specific content already exists
      const contentPreview = post.content.substring(0, 50);
      const duplicate = existingPosts.find(p => p.content?.includes(contentPreview));

      if (duplicate) {
        console.info(`⏭️  Skipped (duplicate): "${contentPreview}..."`);
        continue;
      }

      await db.insert(microblogs).values({
        authorId: author.id,
        content: post.content.replace(SCREENSHOT_FLAG, '').trim(),
        tags: post.tags,
      });

      console.info(`✅ Created feed post by ${author.displayName}: "${contentPreview}..."`);
      created++;
    }

    console.info(`\n✨ Summary: ${created} created, ${screenshotFeedPosts.length - created} skipped`);
    if (created > 0) {
      console.info('\n📸 Feed is ready for App Store screenshots!');
    }
  } catch (error) {
    console.error('❌ Error seeding screenshot feed:', error);
    throw error;
  }
}

async function removeScreenshotFeed() {
  console.info('🗑️  Removing screenshot feed posts...');

  try {
    // Find all microblogs with screenshot flag
    const allPosts = await db.select().from(microblogs);
    const screenshotPosts = allPosts.filter(p =>
      p.content?.includes(SCREENSHOT_FLAG)
    );

    if (screenshotPosts.length === 0) {
      console.info('ℹ️  No screenshot feed posts found.');
      return;
    }

    // Delete posts
    for (const post of screenshotPosts) {
      await db.delete(microblogs).where(eq(microblogs.id, post.id));
      console.info(`✅ Removed feed post`);
    }

    console.info(`\n✨ Successfully removed ${screenshotPosts.length} screenshot feed posts!`);
  } catch (error) {
    console.error('❌ Error removing screenshot feed:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isRemove = args.includes('--remove');

  if (isRemove) {
    await removeScreenshotFeed();
  } else {
    await seedScreenshotFeed();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
