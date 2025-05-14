import { db } from './db';
import { 
  users, 
  communities,
  communityMembers,
  communityChatRooms,
  chatMessages
} from '@shared/schema';

/**
 * Seeds the community features and related data
 */
export async function seedCommunities() {
  console.log("Starting community data seeding...");
  
  // Check if we already have community data
  const existingCommunities = await db.select().from(communities);
  if (existingCommunities.length > 0) {
    console.log("Communities already exist, skipping seeding");
    return;
  }

  // Get the demo user to use as creator
  const demoUsers = await db.select().from(users).where(eb => eb.eq(users.username, 'demo'));
  if (demoUsers.length === 0) {
    console.log("Demo user not found, cannot seed communities");
    return;
  }
  
  const demoUser = demoUsers[0];
  console.log(`Found demo user with ID: ${demoUser.id}, will use as community creator`);

  // Add communities
  const communities_data = [
    {
      name: "Prayer Requests",
      description: "Share your prayer requests and pray for others in the community.",
      slug: "prayer-requests",
      iconName: "pray",
      iconColor: "primary",
      createdBy: demoUser.id,
      memberCount: 1, // Starting with the creator
      hasPrivateWall: true,
      hasPublicWall: true
    },
    {
      name: "Bible Study",
      description: "Discuss and study the Bible together with fellow believers.",
      slug: "bible-study",
      iconName: "book",
      iconColor: "secondary",
      createdBy: demoUser.id,
      memberCount: 1,
      hasPrivateWall: true,
      hasPublicWall: true
    },
    {
      name: "Theology",
      description: "Dive deep into theological discussions and doctrinal topics.",
      slug: "theology",
      iconName: "church",
      iconColor: "accent",
      createdBy: demoUser.id,
      memberCount: 1,
      hasPrivateWall: false,
      hasPublicWall: true
    },
    {
      name: "Christian Life",
      description: "Share experiences and advice about living as a Christian in today's world.",
      slug: "christian-life",
      iconName: "heart",
      iconColor: "red",
      createdBy: demoUser.id,
      memberCount: 1,
      hasPrivateWall: true,
      hasPublicWall: true
    }
  ];

  const insertedCommunities = await db.insert(communities).values(communities_data).returning();
  
  console.log("Created communities");

  // Add the demo user as a member of each community with the "owner" role
  for (const community of insertedCommunities) {
    await db.insert(communityMembers).values({
      communityId: community.id,
      userId: demoUser.id,
      role: "owner" // The creator is the owner
    });
  }

  console.log("Added demo user as owner of all communities");

  // Create chat rooms for each community
  const chatRooms = [];
  for (const community of insertedCommunities) {
    chatRooms.push({
      communityId: community.id,
      name: "General",
      description: "General discussion for all members",
      isPrivate: false,
      createdBy: demoUser.id
    });

    // Add a second chat room for some communities
    if (community.name === "Bible Study" || community.name === "Theology") {
      chatRooms.push({
        communityId: community.id,
        name: "Questions",
        description: "Ask your questions about the faith",
        isPrivate: false,
        createdBy: demoUser.id
      });
    }

    // Add a private chat room for communities with private walls
    if (community.hasPrivateWall) {
      chatRooms.push({
        communityId: community.id,
        name: "Members Only",
        description: "Private discussion for community members",
        isPrivate: true,
        createdBy: demoUser.id
      });
    }
  }
  
  const insertedChatRooms = await db.insert(communityChatRooms).values(chatRooms).returning();
  console.log("Created community chat rooms");
  
  // Add a welcome message to each "General" chat room
  const welcomeMessages = [];
  for (const chatRoom of insertedChatRooms) {
    if (chatRoom.name === "General") {
      welcomeMessages.push({
        content: `Welcome to the ${chatRoom.name} chat room! This is a place for all members to connect and discuss topics related to this community. Please remember to be respectful of others.`,
        chatRoomId: chatRoom.id,
        senderId: demoUser.id,
        isSystemMessage: true
      });
    }
  }
  
  if (welcomeMessages.length > 0) {
    await db.insert(chatMessages).values(welcomeMessages);
    console.log("Added welcome messages to General chat rooms");
  }
  
  console.log("Community seeding complete!");
}

// If this file is run directly, execute the seeding
if (require.main === module) {
  seedCommunities()
    .then(() => {
      console.log("Community seeding script complete");
      process.exit(0);
    })
    .catch(err => {
      console.error("Error seeding communities:", err);
      process.exit(1);
    });
}