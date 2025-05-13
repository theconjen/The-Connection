import { db } from './db';
import { users, communities, apologeticsResources, livestreams } from '@shared/schema';
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
  console.log("Database seeding completed successfully!");
}

// Export the function so it can be called from other files
export { seedDatabase };