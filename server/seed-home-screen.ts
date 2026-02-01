/**
 * Seed script for Home Screen content
 * Clears old posts/microblogs and creates fresh content for the new Home layout
 *
 * Run: npx tsx server/seed-home-screen.ts
 * Clear only: npx tsx server/seed-home-screen.ts --clear-only
 */

import 'dotenv/config';
import { db } from './db';
import { microblogs, posts, comments, users, communities, communityMembers, microblogLikes, microblogReposts, microblogBookmarks } from '@shared/schema';
import { eq, inArray, sql, like } from 'drizzle-orm';

// Screenshot flag to identify demo users
const SCREENSHOT_FLAG = '[SCREENSHOT]';

// Profile photos for fake users (Unsplash faces)
const PROFILE_PHOTOS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
];

// ============================================================================
// COMMUNITY ADVICE POSTS (microblogs with topic=QUESTION)
// These appear in the "Community Advice" section on Home
// ============================================================================

const advicePosts = [
  {
    content: "How do you balance screen time with spiritual time? I want to spend more time in the Word but keep getting distracted by my phone.",
    topic: "QUESTION",
    tags: ["seeking-advice", "discipline", "balance"],
    anonymousNickname: "Distracted Dad",
  },
  {
    content: "Any tips for explaining the Trinity to a non-Christian friend? They asked me and I stumbled through my answer.",
    topic: "QUESTION",
    tags: ["seeking-advice", "apologetics", "evangelism"],
    anonymousNickname: "College Student",
  },
  {
    content: "What's helped you stay consistent with daily prayer? I start strong but fade after a few weeks.",
    topic: "QUESTION",
    tags: ["seeking-advice", "prayer", "discipline"],
    anonymousNickname: "Seeking Consistency",
  },
  {
    content: "How do you handle difficult coworkers while still being a light for Christ? Need wisdom here.",
    topic: "QUESTION",
    tags: ["seeking-advice", "workplace", "witness"],
    anonymousNickname: "Office Worker",
  },
  {
    content: "Best way to memorize Scripture? I've tried flashcards but they don't stick for me.",
    topic: "QUESTION",
    tags: ["seeking-advice", "bible", "memorization"],
    // No nickname - will show as "Anonymous"
  },
  {
    content: "How do you find a good church when you move to a new city? What should I look for?",
    topic: "QUESTION",
    tags: ["seeking-advice", "church", "community"],
    anonymousNickname: "New In Town",
  },
  {
    content: "What's your go-to verse when anxiety hits? Looking to build a list for difficult moments.",
    topic: "QUESTION",
    tags: ["seeking-advice", "anxiety", "scripture"],
    anonymousNickname: "Anxious Heart",
  },
  {
    content: "How do you handle disagreements about theology with family members? Want to keep the peace but also hold to truth.",
    topic: "QUESTION",
    tags: ["seeking-advice", "family", "theology"],
    anonymousNickname: "Peacemaker",
  },
];

// ============================================================================
// COMMUNITY POSTS (for "From Your Communities" section)
// ============================================================================

const communityPostsData = [
  {
    title: "This Sunday: Guest Speaker on Missions",
    content: "Excited to announce Pastor James from Guatemala will be sharing about their church planting ministry this Sunday. Service starts at 10am. Bring a friend!",
    tags: ["announcement", "missions"],
  },
  {
    title: "Small Group Sign-ups Now Open",
    content: "Fall small groups are forming! We have options for young adults, couples, men's and women's groups. Check the connection card this Sunday or DM me to find your fit.",
    tags: ["small-groups", "fellowship"],
  },
  {
    title: "Prayer Walk This Saturday",
    content: "Join us Saturday at 8am as we prayer walk through downtown. We'll meet at the church parking lot. Bring comfortable shoes and a heart ready to intercede for our city.",
    tags: ["prayer", "outreach"],
  },
  {
    title: "Book Club: Starting 'Mere Christianity'",
    content: "Our book club is reading C.S. Lewis's Mere Christianity starting next week. Meetings every Thursday at 7pm. All are welcome - no need to have read it before!",
    tags: ["book-club", "study"],
  },
  {
    title: "Worship Night Recap",
    content: "What an incredible worship night! Thank you to everyone who came out. The presence of God was so tangible. Photos from the evening are up on our community page.",
    tags: ["worship", "testimony"],
  },
  {
    title: "Volunteers Needed: Food Pantry",
    content: "Our monthly food pantry is this Saturday from 9am-12pm. We need 10 more volunteers to help sort and distribute. This is a great way to serve our neighbors in need!",
    tags: ["volunteer", "service"],
  },
  {
    title: "New Believer Class Starting",
    content: "Know someone new to faith? Our 4-week 'Foundations' class starts next Sunday after service. Covers basics of prayer, Bible reading, and Christian community.",
    tags: ["class", "discipleship"],
  },
  {
    title: "Youth Lock-In Next Friday",
    content: "Middle and high schoolers! Lock-in next Friday 7pm - 7am. Games, worship, snacks, and zero sleep. Permission slips due by Wednesday. Bring a friend!",
    tags: ["youth", "event"],
  },
];

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

async function clearOldData() {
  console.info('🗑️  Clearing old posts and microblogs...');

  try {
    // Delete all related microblog data first (foreign key constraints)
    const deletedMicroblogLikes = await db.delete(microblogLikes).returning();
    console.info(`   Deleted ${deletedMicroblogLikes.length} microblog likes`);

    const deletedMicroblogReposts = await db.delete(microblogReposts).returning();
    console.info(`   Deleted ${deletedMicroblogReposts.length} microblog reposts`);

    const deletedMicroblogBookmarks = await db.delete(microblogBookmarks).returning();
    console.info(`   Deleted ${deletedMicroblogBookmarks.length} microblog bookmarks`);

    // Delete all comments (foreign key constraint)
    const deletedComments = await db.delete(comments).returning();
    console.info(`   Deleted ${deletedComments.length} comments`);

    // Delete all posts
    const deletedPosts = await db.delete(posts).returning();
    console.info(`   Deleted ${deletedPosts.length} posts`);

    // Delete all microblogs
    const deletedMicroblogs = await db.delete(microblogs).returning();
    console.info(`   Deleted ${deletedMicroblogs.length} microblogs`);

    console.info('✅ Old data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function seedHomeScreenContent() {
  console.info('\n🌱 Seeding fresh Home screen content...');

  try {
    // Get screenshot users first (they have proper names and photos)
    const allUsers = await db.select().from(users);
    let screenshotUsers = allUsers.filter(u => u.bio?.includes(SCREENSHOT_FLAG));

    // If no screenshot users, use any users with displayName
    if (screenshotUsers.length === 0) {
      screenshotUsers = allUsers.filter(u => u.displayName && u.displayName.trim() !== '');
    }

    // If still no users, use all users
    if (screenshotUsers.length === 0) {
      screenshotUsers = allUsers;
    }

    if (screenshotUsers.length === 0) {
      console.error('❌ No users found. Please seed users first.');
      return;
    }

    console.info(`   Using ${screenshotUsers.length} users for content`);

    // Update users without profile photos
    console.info('\n📸 Updating user profile photos...');
    for (let i = 0; i < screenshotUsers.length; i++) {
      const user = screenshotUsers[i];
      if (!user.avatarUrl) {
        const photoUrl = PROFILE_PHOTOS[i % PROFILE_PHOTOS.length];
        await db.update(users)
          .set({ avatarUrl: photoUrl })
          .where(eq(users.id, user.id));
        console.info(`   ✅ Added photo for ${user.displayName || user.username}`);
        // Update local reference
        screenshotUsers[i] = { ...user, avatarUrl: photoUrl };
      }
    }

    // Get communities
    const allCommunities = await db.select().from(communities).limit(10);

    // ========================================
    // 1. Create Community Advice microblogs
    // ========================================
    console.info('\n📝 Creating Community Advice posts...');

    for (let i = 0; i < advicePosts.length; i++) {
      const post = advicePosts[i];
      const author = screenshotUsers[i % screenshotUsers.length];

      await db.insert(microblogs).values({
        authorId: author.id,
        content: post.content,
        topic: post.topic as any,
        tags: post.tags,
        anonymousNickname: (post as any).anonymousNickname || null,
        createdAt: new Date(Date.now() - (i * 2 * 60 * 60 * 1000)), // Spread over past hours
      });

      const nickname = (post as any).anonymousNickname ? ` (${(post as any).anonymousNickname})` : '';
      console.info(`   ✅ "${post.content.substring(0, 50)}..."${nickname}`);
    }

    // ========================================
    // 2. Create Community Posts
    // ========================================
    if (allCommunities.length > 0) {
      console.info('\n📝 Creating community posts...');

      for (let i = 0; i < communityPostsData.length; i++) {
        const postData = communityPostsData[i];
        const author = screenshotUsers[i % screenshotUsers.length];
        const community = allCommunities[i % allCommunities.length];

        // Ensure author is a member of the community
        const existingMembership = await db.select()
          .from(communityMembers)
          .where(eq(communityMembers.communityId, community.id))
          .limit(1);

        if (existingMembership.length === 0) {
          // Add author as community member
          await db.insert(communityMembers).values({
            communityId: community.id,
            userId: author.id,
            role: 'member',
          }).onConflictDoNothing();
        }

        await db.insert(posts).values({
          authorId: author.id,
          communityId: community.id,
          title: postData.title,
          content: postData.content,
          tags: postData.tags,
          createdAt: new Date(Date.now() - (i * 3 * 60 * 60 * 1000)), // Spread over past hours
        });

        console.info(`   ✅ "${postData.title}" in ${community.name}`);
      }
    } else {
      console.info('⚠️  No communities found. Skipping community posts.');
    }

    console.info('\n✨ Home screen content seeded successfully!');
    console.info('   - Community Advice posts: ' + advicePosts.length);
    console.info('   - Community posts: ' + (allCommunities.length > 0 ? communityPostsData.length : 0));

  } catch (error) {
    console.error('❌ Error seeding content:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const clearOnly = args.includes('--clear-only');

  // Always clear old data first
  await clearOldData();

  // Seed new content unless --clear-only flag is passed
  if (!clearOnly) {
    await seedHomeScreenContent();
  }

  console.info('\n🎉 Done!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
