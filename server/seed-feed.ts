/**
 * Seed script for posts, microblogs, and other feed content
 */
import { db } from "./db";
import { users, posts, comments, communities, groups, microblogs } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedFeed() {
  console.log("Starting feed data seeding...");
  
  try {
    // Check if posts already exist
    const existingPosts = await db.select({ count: { count: 'id' }}).from(posts);
    if (existingPosts[0]?.count > 0) {
      console.log("Posts already exist, skipping seeding");
      return;
    }

    // Get the demo user
    const demoUsers = await db.select().from(users).where(eq(users.username, 'demo'));
    if (demoUsers.length === 0) {
      console.log("Demo user not found, cannot seed feed");
      return;
    }
    
    const demoUser = demoUsers[0];
    console.log(`Found demo user with ID: ${demoUser.id}, will use as content creator`);
    
    // Get communities
    const allCommunities = await db.select().from(communities);
    if (allCommunities.length === 0) {
      console.log("No communities found, cannot seed community-related content");
      return;
    }

    console.log(`Found ${allCommunities.length} communities for content creation`);

    // Create regular posts
    const postData = [
      {
        title: "Introduction to Christian Apologetics",
        content: "Apologetics comes from the Greek word 'apologia,' which means to give a defense. Christian apologetics is the practice of giving a rational defense for the Christian faith. It involves using reason, evidence, and logical arguments to address objections, answer questions, and provide a compelling case for Christianity. This post will explore the basics of Christian apologetics and how we can use it to strengthen our faith and share it with others.",
        authorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'theology')?.id || null
      },
      {
        title: "Weekly Prayer Meeting Announcement",
        content: "Join us this Wednesday at 7 PM for our weekly prayer meeting. We'll be praying for community needs, global concerns, and personal requests. Everyone is welcome to join, whether in person or virtually. If you have a specific prayer request, please feel free to share it in the comments or privately message the prayer team.",
        authorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'prayer-requests')?.id || null
      },
      {
        title: "Understanding the Sermon on the Mount",
        content: "The Sermon on the Mount (Matthew 5-7) is one of the most profound teachings of Jesus Christ. In it, Jesus outlines the characteristics of citizens of God's kingdom, addressing topics such as the Beatitudes, loving your enemies, prayer, fasting, anxiety, judging others, and building your life on a solid foundation. Let's dive into this rich teaching and explore how it applies to our lives today.",
        authorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'bible-study')?.id || null
      },
      {
        title: "Navigating Faith in a Secular Workplace",
        content: "Many Christians struggle with how to live out their faith in workplaces that may not share their values. How do we remain true to our convictions while also being respectful and effective colleagues? This post offers practical advice for navigating this common challenge, from building authentic relationships to finding appropriate ways to share your faith when opportunities arise.",
        authorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'christian-life')?.id || null
      },
      {
        title: "The Historical Evidence for the Resurrection",
        content: "The resurrection of Jesus Christ is the cornerstone of Christian faith. But what historical evidence supports this extraordinary claim? This post examines the historical arguments for the resurrection, including the empty tomb, the post-resurrection appearances, the transformation of the disciples, and the rapid growth of the early church despite persecution. We'll look at what skeptical scholars admit and how believers can confidently discuss this topic.",
        authorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'theology')?.id || null
      },
      {
        title: "Developing a Consistent Prayer Life",
        content: "Prayer is vital to our spiritual growth, yet many of us struggle to maintain a consistent prayer life. This post offers practical strategies for developing a sustainable prayer routine, including setting specific times, creating a prayer list, practicing different types of prayer, and overcoming common obstacles like distractions and dryness in prayer.",
        authorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'prayer-requests')?.id || null
      }
    ];

    console.log("Creating posts...");
    const insertedPosts = await db.insert(posts).values(postData).returning();
    console.log(`Created ${insertedPosts.length} posts`);

    // Add comments to the posts
    const commentData = [];
    for (const post of insertedPosts) {
      commentData.push({
        content: `Great discussion topic! I've been wanting to learn more about ${post.title.toLowerCase()}.`,
        postId: post.id,
        authorId: demoUser.id
      });
      
      commentData.push({
        content: `This is really helpful information. Can you recommend any resources for further study on this topic?`,
        postId: post.id,
        authorId: demoUser.id
      });
    }

    console.log("Creating comments...");
    const insertedComments = await db.insert(comments).values(commentData).returning();
    console.log(`Created ${insertedComments.length} comments`);
    
    // Create microblogs (shorter posts, similar to tweets)
    const microblogData = [
      {
        content: "Just read an amazing passage from Romans 8 today. 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God.' What a powerful reminder!",
        authorId: demoUser.id
      },
      {
        content: "Attended a wonderful worship service this morning. The message on grace was exactly what I needed to hear today. Grateful for my church family!",
        authorId: demoUser.id
      },
      {
        content: "Question for discussion: How do you maintain your faith during difficult times? What verses or practices help you stay grounded?",
        authorId: demoUser.id
      },
      {
        content: "Just finished C.S. Lewis's 'Mere Christianity' for the third time. Each reading reveals new insights. What books have significantly impacted your faith journey?",
        authorId: demoUser.id
      },
      {
        content: "Reflecting on Philippians 4:8 today: 'Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.' A good filter for what we allow into our minds.",
        authorId: demoUser.id
      }
    ];

    console.log("Creating microblogs...");
    const insertedMicroblogs = await db.insert(microblogs).values(microblogData).returning();
    console.log(`Created ${insertedMicroblogs.length} microblogs`);

    // Update post counts for communities
    for (const community of allCommunities) {
      const postCount = insertedPosts.filter(p => p.communityId === community.id).length;
      if (postCount > 0) {
        await db.update(communities)
          .set({ memberCount: community.memberCount || 1 }) // Ensure at least one member
          .where(eq(communities.id, community.id));
      }
    }
    
    console.log("Feed data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding feed:", error);
  }
}

// Run this directly if called directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedFeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed feed data:", error);
      process.exit(1);
    });
}

// Function is already exported at the top