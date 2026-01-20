/**
 * Seed script for App Store screenshot forum posts
 * Run: npx tsx server/seed-screenshot-posts.ts
 * Remove: npx tsx server/seed-screenshot-posts.ts --remove
 */

import 'dotenv/config';
import { db } from './db';
import { posts, comments, users, communities } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Flag posts as screenshot data
const SCREENSHOT_FLAG = '[SCREENSHOT]';

const screenshotPosts = [
  {
    title: "How do you handle doubt in your faith journey?",
    content: "I've been a Christian for 5 years, but lately I've been struggling with doubts about certain theological concepts. Is this normal? How do you work through seasons of doubt while still maintaining your relationship with God?",
    category: "faith",
    comments: [
      "Doubt is actually a sign of a maturing faith! Even John the Baptist had doubts when he was in prison. God can handle your questions. I recommend reading 'The Reason for God' by Tim Keller - it helped me tremendously.",
      "I've been there! For me, journaling my questions and bringing them directly to God in prayer helped. Also, finding a mentor or accountability partner to discuss these things openly made a huge difference.",
      "C.S. Lewis said, 'I believe in Christianity as I believe that the sun has risen: not only because I see it, but because by it I see everything else.' Keep pressing in, friend. The breakthrough is coming!"
    ]
  },
  {
    title: "Best Bible reading plans for beginners?",
    content: "New believer here! Just got baptized last month and want to develop a consistent Bible reading habit. What reading plans would you recommend for someone just starting out? Should I start with the Gospels or go chronologically?",
    category: "bible-study",
    comments: [
      "Start with the Gospel of John! It's written specifically to help people believe in Jesus. Then maybe Romans to understand salvation, and Psalms for worship and prayer.",
      "I used the Bible Project's reading plan when I first started. They have videos that explain each book before you read it, which really helps with context!",
      "Congratulations on your baptism! 🎉 I'd suggest starting with Mark (shortest Gospel), then Acts to see the early church, then jump to some New Testament letters. Don't try to go cover-to-cover right away - you'll burn out."
    ]
  },
  {
    title: "Testimony: God provided when I had $0 in my account",
    content: "Y'all, I have to share this. Lost my job 3 months ago, down to my last $50. Rent was due in 3 days and I had no idea how I'd pay it. I prayed and surrendered it to God. The NEXT DAY, a former client called out of the blue offering me freelance work worth exactly my rent + groceries for the month. God is faithful! 🙌",
    category: "testimony",
    comments: [
      "Philippians 4:19! 'And my God will meet all your needs according to the riches of his glory in Christ Jesus.' Thank you for sharing this reminder!",
      "This is beautiful! God's timing is always perfect. Praying for continued provision as you look for full-time work.",
      "I needed to hear this today. Going through financial struggles myself and this just encouraged my faith so much. Thank you for sharing! 💙"
    ]
  },
  {
    title: "Struggling with toxic family relationships - need prayer",
    content: "How do you honor your parents (Ephesians 6:2) when they're emotionally abusive? I've set boundaries but they keep violating them. I feel guilty for limiting contact, but it's affecting my mental health and marriage. Anyone else deal with this?",
    category: "prayer-request",
    comments: [
      "Praying for you right now. Setting boundaries IS honoring yourself as God's creation. You can respect your parents while protecting your peace. Check out 'Boundaries' by Cloud & Townsend - changed my life.",
      "Been there. Remember, even Jesus didn't allow His family to control His ministry (Mark 3:31-35). Honoring doesn't mean accepting abuse. Your mental health matters to God.",
      "Lifting you up in prayer. 🙏 Consider talking to a Christian counselor who understands both Scripture and trauma. Your healing matters."
    ]
  },
  {
    title: "What's your daily devotional routine look like?",
    content: "I want to be more consistent with my quiet time. What does your devotional routine look like? What time of day? How long? What tools do you use (journal, Bible app, devotional books, etc.)?",
    category: "devotional",
    comments: [
      "I wake up at 5:30am, make coffee, then do 30 minutes: 10 min Bible reading (using Bible in a Year plan), 10 min prayer with a journal, 10 min worship music. Game changer!",
      "I'm a night owl so mornings don't work for me. I do my devotional at 9pm before bed. Don't feel pressured to do mornings if that's not your rhythm!",
      "I use the YouVersion app with the 'First 5' devotional. It's only 5 minutes but helps me stay consistent. Started small and built from there!"
    ]
  },
  {
    title: "Apologetics resources for college campus ministry?",
    content: "Leading a college ministry and we're getting a lot of tough questions about Christianity from skeptical students. What are the best apologetics resources you'd recommend? Books, videos, podcasts, etc.?",
    category: "apologetics",
    comments: [
      "J. Warner Wallace's 'Cold-Case Christianity' is excellent! He's a detective who became a Christian by applying forensic investigation to the Gospels. Very compelling for skeptics.",
      "Check out 'The Case for Christ' by Lee Strobel (investigative journalist who set out to disprove Christianity), and William Lane Craig's debates on YouTube. Also Cross Examined podcast!",
      "Don't sleep on C.S. Lewis's 'Mere Christianity' - still one of the most powerful apologetics works. Also Ravi Zacharias International Ministries has tons of Q&A sessions online."
    ]
  },
  {
    title: "How do you fast effectively?",
    content: "Want to incorporate fasting into my spiritual discipline but I've never done it before. What are the different types of fasting? Any tips for a first-timer? How do you stay focused on prayer instead of just being hungry? 😅",
    category: "spiritual-discipline",
    comments: [
      "Start small! Try a partial fast (skip one meal) or a Daniel fast (only fruits/vegetables) before attempting a full food fast. And stay hydrated!",
      "I do a 24-hour fast once a week (dinner to dinner). Every time I feel hungry, I stop and pray. It turns my physical hunger into spiritual hunger. Matthew 6:16-18 is a good guide!",
      "Important: If you have medical conditions or take medications, talk to your doctor first! Spiritual disciplines shouldn't harm your physical health."
    ]
  },
  {
    title: "Mission trip fundraising ideas that actually work?",
    content: "Going on a mission trip to Honduras in July (so excited!!) but need to raise $2,500. What fundraising ideas have worked for you? Support letters? Bake sales? GoFundMe? Help a brother out! 🌍",
    category: "missions",
    comments: [
      "Support letters worked best for me! I sent 50 personalized letters explaining the mission and my testimony. Raised $3,000 in 2 months. People want to partner with you, they just need to know about it!",
      "I did a 'sponsor a day' thing where people could sponsor specific days of my trip for $25-50. Made a calendar board at church. Fully funded in 6 weeks!",
      "Car wash + bake sale combo at church! Got the youth group involved. Raised $800 in one Saturday. Also don't underestimate asking local businesses to sponsor you."
    ]
  },
  {
    title: "Single at 30 and feeling discouraged",
    content: "Everyone around me is getting married and having kids. I trust God's timing but some days it's really hard. How do you stay content and serve God wholeheartedly while waiting for the right person?",
    category: "relationships",
    comments: [
      "1 Corinthians 7:32-35 talks about the gift of singleness and how it allows undistracted devotion to the Lord. This season is not wasted! Use it to grow closer to God and serve freely.",
      "I got married at 32 and I'm SO GLAD I waited. The growth I experienced in my 20s-30s while single made me a better spouse. Your waiting is preparing you. ❤️",
      "Join that singles ministry! Some of my deepest friendships came from my 'waiting season.' Also, read 'The Sacred Search' by Gary Thomas about finding a spouse God's way."
    ]
  },
  {
    title: "Worship song recommendations for small groups?",
    content: "Leading worship for our small group for the first time next week. What are your go-to worship songs that work well for intimate, acoustic settings? Looking for songs that are easy to learn and really help people connect with God. 🎸",
    category: "worship",
    comments: [
      "Try 'Good Good Father,' 'Way Maker,' '10,000 Reasons,' and 'Cornerstone.' All sound great acoustic and everyone knows them! Also 'Reckless Love' is powerful.",
      "Some older ones that never fail: 'How Great is Our God,' 'Blessed Be Your Name,' 'Here I Am to Worship.' They're simple but so meaningful!",
      "Don't forget about hymns! 'Amazing Grace' and 'It Is Well With My Soul' work beautifully in small group settings. Sometimes the old songs hit different."
    ]
  },
];

async function seedScreenshotPosts() {

  try {
    // Get screenshot users (filter by bio containing SCREENSHOT_FLAG)
    const allUsers = await db.select().from(users);
    const demoUsers = allUsers.filter(u => u.bio?.includes(SCREENSHOT_FLAG));

    if (demoUsers.length === 0) {
      console.error('❌ No screenshot users found. Please seed users first.');
      return;
    }


    // Get screenshot communities
    const allCommunities = await db.select().from(communities);
    // Get communities by specific slugs (from seed data)
    const communitySlugs = [
      'young-professionals-fellowship', 'moms-in-faith', 'downtown-worship-collective',
      'mens-early-morning-prayer', 'college-career-bible-study', 'seniors-walking-faith',
      'recovery-renewal', 'outdoor-adventures-ministry', 'tech-workers-bible-study',
      'singles-community', 'healthcare-professionals-prayer', 'global-missions-network',
      'young-married-couples', 'first-responders-fellowship', 'creative-arts-ministry',
      'high-school-youth-group'
    ];
    const screenshotCommunities = allCommunities.filter(c =>
      communitySlugs.includes(c.slug || '')
    );

    if (screenshotCommunities.length === 0) {
    }

    // Create posts and comments
    for (let i = 0; i < screenshotPosts.length; i++) {
      const postData = screenshotPosts[i];
      const author = demoUsers[i % demoUsers.length];
      const community = screenshotCommunities[i % Math.max(1, screenshotCommunities.length)];

      // Create post
      const [createdPost] = await db.insert(posts).values({
        authorId: author.id,
        communityId: community?.id || null,
        title: postData.title,
        content: `${SCREENSHOT_FLAG} ${postData.content}`,
        tags: [postData.category],
      }).returning();


      // Create comments
      for (let j = 0; j < postData.comments.length; j++) {
        const commenter = demoUsers[(i + j + 1) % demoUsers.length];
        await db.insert(comments).values({
          postId: createdPost.id,
          authorId: commenter.id,
          content: `${SCREENSHOT_FLAG} ${postData.comments[j]}`,
        });
      }

    }

  } catch (error) {
    console.error('❌ Error seeding screenshot posts:', error);
    throw error;
  }
}

async function removeScreenshotPosts() {

  try {
    // Find all posts with screenshot flag
    const allPosts = await db.select().from(posts);
    const screenshotPostsList = allPosts.filter(p =>
      p.content?.includes(SCREENSHOT_FLAG)
    );

    if (screenshotPostsList.length === 0) {
      return;
    }

    // Delete comments first (foreign key constraint)
    for (const post of screenshotPostsList) {
      const postComments = await db.select().from(comments).where(eq(comments.postId, post.id));
      for (const comment of postComments) {
        await db.delete(comments).where(eq(comments.id, comment.id));
      }
    }

    // Delete posts
    for (const post of screenshotPostsList) {
      await db.delete(posts).where(eq(posts.id, post.id));
      .trim()}"`);
    }

  } catch (error) {
    console.error('❌ Error removing screenshot posts:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isRemove = args.includes('--remove');

  if (isRemove) {
    await removeScreenshotPosts();
  } else {
    await seedScreenshotPosts();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
