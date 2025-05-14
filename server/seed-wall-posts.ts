/**
 * Seed script for community wall posts
 */
import { db } from "./db";
import { users, communities, communityWallPosts, communityMembers } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedWallPosts() {
  console.log("Starting wall posts data seeding...");
  
  try {
    // Check if wall posts already exist
    const existingPosts = await db.select({ count: { count: 'id' }}).from(communityWallPosts);
    if (existingPosts[0]?.count > 0) {
      console.log("Wall posts already exist, skipping seeding");
      return;
    }

    // Get the demo user
    const demoUsers = await db.select().from(users).where(({ eq }) => eq(users.username, 'demo'));
    if (demoUsers.length === 0) {
      console.log("Demo user not found, cannot seed wall posts");
      return;
    }
    
    const demoUser = demoUsers[0];
    console.log(`Found demo user with ID: ${demoUser.id}, will use as wall post creator`);
    
    // Get communities
    const allCommunities = await db.select().from(communities);
    if (allCommunities.length === 0) {
      console.log("No communities found, cannot seed wall posts");
      return;
    }

    console.log(`Found ${allCommunities.length} communities for wall post creation`);

    // Create wall posts for each community
    const wallPostsData = [];
    
    // Prayer Requests community
    const prayerCommunity = allCommunities.find(c => c.slug === 'prayer-requests');
    if (prayerCommunity) {
      // Public wall posts
      wallPostsData.push({
        communityId: prayerCommunity.id,
        authorId: demoUser.id,
        content: "Welcome to our Prayer Requests community! This is a safe space to share your prayer needs and support one another through prayer. Remember that public posts can be seen by all, while private posts are only visible to community members.",
        isPrivate: false
      });
      
      wallPostsData.push({
        communityId: prayerCommunity.id,
        authorId: demoUser.id,
        content: "PRAYER TIP: When praying for others, try using the ACTS method: Adoration (praise God for who He is), Confession (admit your own shortcomings), Thanksgiving (express gratitude), and Supplication (present your requests).",
        isPrivate: false
      });
      
      // Private wall post
      wallPostsData.push({
        communityId: prayerCommunity.id,
        authorId: demoUser.id,
        content: "MEMBERS ONLY: We're organizing a weekly prayer call every Tuesday at 7 PM. If you'd like to join, please comment below and I'll send you the details. This is a great opportunity for us to connect and pray together in real-time!",
        isPrivate: true
      });
    }
    
    // Bible Study community
    const bibleStudyCommunity = allCommunities.find(c => c.slug === 'bible-study');
    if (bibleStudyCommunity) {
      // Public wall posts
      wallPostsData.push({
        communityId: bibleStudyCommunity.id,
        authorId: demoUser.id,
        content: "Welcome to our Bible Study community! This is a place to discuss Scripture, share insights, and grow together in our understanding of God's Word. Feel free to ask questions and contribute to discussions.",
        isPrivate: false
      });
      
      wallPostsData.push({
        communityId: bibleStudyCommunity.id,
        authorId: demoUser.id,
        content: "STUDY TIP: Try using the SOAP method when studying a passage: Scripture (write out the passage), Observation (what does it say?), Application (how does it apply to me?), and Prayer (respond to God based on what you learned).",
        isPrivate: false
      });
      
      // Private wall post
      wallPostsData.push({
        communityId: bibleStudyCommunity.id,
        authorId: demoUser.id,
        content: "MEMBERS ONLY: We're starting a new study series on the book of Romans next month. If you have specific passages or themes you'd like to explore in depth, please share your suggestions here!",
        isPrivate: true
      });
    }
    
    // Theology community
    const theologyCommunity = allCommunities.find(c => c.slug === 'theology');
    if (theologyCommunity) {
      // Public wall posts (only public wall for this community)
      wallPostsData.push({
        communityId: theologyCommunity.id,
        authorId: demoUser.id,
        content: "Welcome to our Theology community! This is a place for thoughtful discussions about Christian doctrine, theological perspectives, and apologetics. While we may have different viewpoints on secondary issues, we unite around the essential truths of the Christian faith.",
        isPrivate: false
      });
      
      wallPostsData.push({
        communityId: theologyCommunity.id,
        authorId: demoUser.id,
        content: "DISCUSSION GUIDELINE: When discussing theological topics, let's remember the old saying: 'In essentials, unity; in non-essentials, liberty; in all things, charity.' Respectful dialogue helps us all grow.",
        isPrivate: false
      });
      
      wallPostsData.push({
        communityId: theologyCommunity.id,
        authorId: demoUser.id,
        content: "RECOMMENDED READING: 'Mere Christianity' by C.S. Lewis is a wonderful introduction to Christian theology that's accessible yet profound. What books have helped shape your theological understanding?",
        isPrivate: false
      });
    }
    
    // Christian Life community
    const christianLifeCommunity = allCommunities.find(c => c.slug === 'christian-life');
    if (christianLifeCommunity) {
      // Public wall posts
      wallPostsData.push({
        communityId: christianLifeCommunity.id,
        authorId: demoUser.id,
        content: "Welcome to our Christian Life community! This is a place to share experiences, challenges, and encouragement about living out our faith in everyday life. From family and work to personal growth and spiritual disciplines, all topics are welcome.",
        isPrivate: false
      });
      
      wallPostsData.push({
        communityId: christianLifeCommunity.id,
        authorId: demoUser.id,
        content: "PRACTICAL TIP: Building a consistent quiet time can be challenging. Start small—even just 10 minutes a day—and create triggers by attaching it to an existing habit, like having your morning coffee or before bedtime.",
        isPrivate: false
      });
      
      // Private wall post
      wallPostsData.push({
        communityId: christianLifeCommunity.id,
        authorId: demoUser.id,
        content: "MEMBERS ONLY: We're organizing a book club! Our first selection is 'The Practice of the Presence of God' by Brother Lawrence. If you'd like to participate, comment below and we'll coordinate reading schedules and discussion times.",
        isPrivate: true
      });
    }

    console.log("Creating wall posts...");
    const insertedPosts = await db.insert(communityWallPosts).values(wallPostsData).returning();
    console.log(`Created ${insertedPosts.length} wall posts`);

    console.log("Wall posts data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding wall posts:", error);
  }
}

// Run this directly if called directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedWallPosts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed wall posts data:", error);
      process.exit(1);
    });
}

// Function is already exported at the top