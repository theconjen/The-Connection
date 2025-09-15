import { db } from './db';
import { 
  users, 
  communities,
  communityMembers,
  communityChatRooms,
  chatMessages, 
  apologeticsResources, 
  livestreams, 
  creatorTiers,
  virtualGifts,
  bibleReadingPlans,
  bibleStudyNotes,
  verseMemorization
} from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("Starting database seeding...");
  
  // Check if we already have data
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has data, skipping seeding");
    return;
  }

  // Add a demo user
  const demoUser = await db.insert(users).values({
    username: 'demo',
    email: 'demo@faithconnect.com',
    password: await hashPassword('password'),
    displayName: 'Demo User',
    bio: 'This is a demo account for testing purposes.',
    avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=6d28d9&color=fff'
  }).returning();
  
  console.log(`Created demo user with ID: ${demoUser[0].id}`);
  
  // Add communities
  const communities_data = [
    {
      name: "Prayer Requests",
      description: "Share your prayer requests and pray for others in the community.",
      slug: "prayer-requests",
      iconName: "pray",
      iconColor: "primary",
      createdBy: demoUser[0].id,
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
      createdBy: demoUser[0].id,
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
      createdBy: demoUser[0].id,
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
      createdBy: demoUser[0].id,
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
      userId: demoUser[0].id,
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
      createdBy: demoUser[0].id
    });

    // Add a second chat room for some communities
    if (community.name === "Bible Study" || community.name === "Theology") {
      chatRooms.push({
        communityId: community.id,
        name: "Questions",
        description: "Ask your questions about the faith",
        isPrivate: false,
        createdBy: demoUser[0].id
      });
    }

    // Add a private chat room for communities with private walls
    if (community.hasPrivateWall) {
      chatRooms.push({
        communityId: community.id,
        name: "Members Only",
        description: "Private discussion for community members",
        isPrivate: true,
        createdBy: demoUser[0].id
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
        senderId: demoUser[0].id,
        isSystemMessage: true
      });
    }
  }
  
  if (welcomeMessages.length > 0) {
    await db.insert(chatMessages).values(welcomeMessages);
    console.log("Added welcome messages to General chat rooms");
  }
  
  // Add apologetics resources
  await db.insert(apologeticsResources).values([
    {
      title: "Introduction to Christian Apologetics",
      description: "A beginner's guide to defending the faith with reason and evidence.",
      type: "book",
      iconName: "book-reader",
      url: "https://example.com/apologetics-intro"
    },
    {
      title: "Responding to Common Objections",
      description: "Learn how to address common challenges to the Christian faith.",
      type: "video",
      iconName: "video",
      url: "https://example.com/objections"
    },
    {
      title: "Faith in a Skeptical World",
      description: "A podcast exploring faith in a world of doubt and questioning.",
      type: "podcast",
      iconName: "headphones",
      url: "https://example.com/skeptical-world"
    }
  ]);
  
  console.log("Created apologetics resources");
  
  // Add livestreams
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  await db.insert(livestreams).values([
    {
      title: "Sunday Worship Service",
      description: "Join us for our weekly Sunday worship service with praise music and teachings.",
      hostId: demoUser[0].id,
      thumbnail: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1173&q=80",
      status: "upcoming",
      viewerCount: 0,
      scheduledFor: tomorrow,
      duration: "1.5 hours",
      tags: "worship,service,sunday"
    },
    {
      title: "Bible Study: Book of Romans",
      description: "A deep dive into the Book of Romans with Pastor Mark.",
      hostId: demoUser[0].id,
      thumbnail: "https://images.unsplash.com/photo-1504052434066-ff599a2d621e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      status: "upcoming",
      viewerCount: 0,
      scheduledFor: nextWeek,
      duration: "1 hour",
      tags: "bible,study,romans"
    },
    {
      title: "Youth Conference: Faith in Action",
      description: "A special online conference for youth to learn how to live out their faith.",
      hostId: demoUser[0].id,
      thumbnail: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
      status: "upcoming",
      viewerCount: 0,
      scheduledFor: nextWeek,
      duration: "2 hours",
      tags: "youth,conference,faith"
    }
  ]);
  
  console.log("Created livestreams");
  
  // Add creator tiers for livestreamer incentives
  await db.insert(creatorTiers).values([
    {
      name: "Bronze Creator",
      description: "Entry-level tier for new livestream creators",
      requirements: "At least 1 livestream per month, adherence to community guidelines",
      benefits: "Basic analytics, community exposure, platform support",
      iconName: "award-bronze",
      order: 1
    },
    {
      name: "Silver Creator",
      description: "Established livestream creators with growing audience",
      requirements: "At least 2 livestreams per month, 50+ average viewers, positive community feedback",
      benefits: "Enhanced visibility in search results, priority support, early access to new features",
      iconName: "award-silver",
      order: 2
    },
    {
      name: "Gold Creator",
      description: "Top-tier livestream creators with significant impact",
      requirements: "Weekly livestreams, 200+ average viewers, exemplary ministry content",
      benefits: "Featured streams, special badge, participation in special events, mentorship opportunities",
      iconName: "award-gold",
      order: 3
    }
  ]);
  
  console.log("Created creator tiers");
  
  // Add virtual gifts for livestream support
  await db.insert(virtualGifts).values([
    {
      name: "Prayer Hands",
      description: "Show support with prayer hands",
      iconName: "pray",
      value: 10,
      isActive: true
    },
    {
      name: "Dove",
      description: "Symbol of peace and the Holy Spirit",
      iconName: "dove",
      value: 25,
      isActive: true
    },
    {
      name: "Cross",
      description: "Symbol of faith and sacrifice",
      iconName: "cross",
      value: 50,
      isActive: true
    },
    {
      name: "Bible",
      description: "The Word of God",
      iconName: "bible",
      value: 100,
      isActive: true
    },
    {
      name: "Light of the World",
      description: "Premium gift representing Christ's light",
      iconName: "light",
      value: 250,
      isActive: true
    }
  ]);
  
  console.log("Created virtual gifts");
  
  // Add Bible reading plans
  await db.insert(bibleReadingPlans).values([
    {
      title: "Through the Gospels in 30 Days",
      description: "A 30-day reading plan to guide you through Matthew, Mark, Luke, and John.",
      duration: 30,
      readings: JSON.stringify([
        { day: 1, passages: ["Matthew 1-2"], title: "The Birth of Jesus" },
        { day: 2, passages: ["Matthew 3-4"], title: "Jesus's Baptism and Temptation" },
        { day: 3, passages: ["Matthew 5-7"], title: "The Sermon on the Mount" },
        // More days would be included here
        { day: 30, passages: ["John 20-21"], title: "The Resurrection and Ascension" }
      ]),
      creatorId: demoUser[0].id,
      isPublic: true
    },
    {
      title: "Psalms for Meditation",
      description: "A 15-day devotional through selected Psalms for reflection and meditation.",
      duration: 15,
      readings: JSON.stringify([
        { day: 1, passages: ["Psalm 1"], title: "The Way of the Righteous" },
        { day: 2, passages: ["Psalm 23"], title: "The Lord Is My Shepherd" },
        { day: 3, passages: ["Psalm 27"], title: "The Lord Is My Light" },
        // More days would be included here
        { day: 15, passages: ["Psalm 150"], title: "Let Everything Praise the Lord" }
      ]),
      creatorId: demoUser[0].id,
      isPublic: true
    },
    {
      title: "Journey Through Romans",
      description: "A deep dive into Paul's epistle to the Romans over 21 days.",
      duration: 21,
      readings: JSON.stringify([
        { day: 1, passages: ["Romans 1:1-17"], title: "The Gospel of God" },
        { day: 2, passages: ["Romans 1:18-32"], title: "God's Wrath Against Sin" },
        { day: 3, passages: ["Romans 2:1-16"], title: "God's Righteous Judgment" },
        // More days would be included here
        { day: 21, passages: ["Romans 16"], title: "Personal Greetings and Final Instructions" }
      ]),
      creatorId: demoUser[0].id,
      isPublic: true
    }
  ]);
  
  console.log("Created Bible reading plans");
  
  // Add Bible study notes
  await db.insert(bibleStudyNotes).values([
    {
      userId: demoUser[0].id,
      title: "The Parable of the Sower",
      content: "This parable speaks to the different ways people respond to God's Word. The seed is the same (God's truth), but the soil (our hearts) determines how it grows. I need to examine what kind of soil I am and how I can better receive God's Word.",
      passage: "Matthew 13:1-23",
      isPublic: true
    },
    {
      userId: demoUser[0].id,
      title: "Faith vs. Works in James",
      content: "James isn't contradicting Paul's teaching on justification by faith alone. Rather, he's emphasizing that true faith necessarily produces good works. Faith without works is dead because real faith transforms how we live.",
      passage: "James 2:14-26",
      isPublic: true
    },
    {
      userId: demoUser[0].id,
      title: "The Fruit of the Spirit",
      content: "The fruit of the Spirit is singular, suggesting these qualities come as a package. They're not achievements we work toward but natural results of the Spirit's presence in our lives. I want to focus on cultivating an environment where the Spirit can produce this fruit in me.",
      passage: "Galatians 5:22-23",
      isPublic: true
    }
  ]);
  
  console.log("Created Bible study notes");
  
  // Add verse memorization
  await db.insert(verseMemorization).values([
    {
      userId: demoUser[0].id,
      verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
      reminderFrequency: 3,
      reviewDates: JSON.stringify([new Date()])
    },
    {
      userId: demoUser[0].id,
      verse: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6",
      reminderFrequency: 2,
      reviewDates: JSON.stringify([new Date()])
    },
    {
      userId: demoUser[0].id,
      verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      reference: "Philippians 4:6-7",
      reminderFrequency: 5,
      reviewDates: JSON.stringify([new Date()])
    }
  ]);
  
  console.log("Created verse memorization entries");
  console.log("Database seeding completed successfully!");
}

// Export the function so it can be called from other files
export { seedDatabase };