import { db } from './db';
import { 
  users, 
  communities, 
  apologeticsResources, 
  livestreams, 
  creatorTiers,
  virtualGifts
} from '@shared/schema';
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
    password: await hashPassword('password'),
    displayName: 'Demo User',
    bio: 'This is a demo account for testing purposes.',
    avatarUrl: 'https://ui-avatars.com/api/?name=Demo+User&background=6d28d9&color=fff'
  }).returning();
  
  console.log(`Created demo user with ID: ${demoUser[0].id}`);
  
  // Add communities
  await db.insert(communities).values([
    {
      name: "Prayer Requests",
      description: "Share your prayer requests and pray for others in the community.",
      slug: "prayer-requests",
      iconName: "pray",
      iconColor: "primary",
      createdBy: demoUser[0].id,
      memberCount: 0
    },
    {
      name: "Bible Study",
      description: "Discuss and study the Bible together with fellow believers.",
      slug: "bible-study",
      iconName: "book",
      iconColor: "secondary",
      createdBy: demoUser[0].id,
      memberCount: 0
    },
    {
      name: "Theology",
      description: "Dive deep into theological discussions and doctrinal topics.",
      slug: "theology",
      iconName: "church",
      iconColor: "accent",
      createdBy: demoUser[0].id,
      memberCount: 0
    },
    {
      name: "Christian Life",
      description: "Share experiences and advice about living as a Christian in today's world.",
      slug: "christian-life",
      iconName: "heart",
      iconColor: "red",
      createdBy: demoUser[0].id,
      memberCount: 0
    }
  ]);
  
  console.log("Created communities");
  
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
  console.log("Database seeding completed successfully!");
}

// Export the function so it can be called from other files
export { seedDatabase };