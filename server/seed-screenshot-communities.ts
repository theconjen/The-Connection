/**
 * Seed script for App Store screenshot communities
 * Run: npx tsx server/seed-communities.ts
 * Remove: npx tsx server/seed-communities.ts --remove
 */

import 'dotenv/config';
import { db } from './db';
import { communities, communityMembers } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Flag communities as screenshot data
const SCREENSHOT_FLAG = '[SCREENSHOT]';

const screenshotCommunities = [
  {
    name: "Young Professionals Fellowship",
    description: "Connect with other young professionals navigating faith and career. Weekly Bible studies, networking events, and prayer support.",
    slug: "young-professionals-fellowship",
    iconName: "briefcase",
    iconColor: "#2563EB",
    city: "Austin",
    state: "TX",
    latitude: "30.2672",
    longitude: "-97.7431",
    memberCount: 124,
    isPrivate: false,
    ageGroup: "Young Adult",
    gender: "Co-Ed",
    ministryTypes: ["Bible Study", "Prayer", "Discipleship"],
    activities: ["Coffee & Conversations", "Volunteering", "Hiking"],
    professions: ["Business", "Tech", "Healthcare"],
    meetingType: "Hybrid",
    frequency: "Weekly",
    lifeStages: ["Young Professionals", "Singles"],
  },
  {
    name: "Moms in Faith",
    description: "A supportive community for mothers to share experiences, pray together, and grow in faith while raising children.",
    slug: "moms-in-faith",
    iconName: "heart-circle",
    iconColor: "#DB2777",
    city: "Austin",
    state: "TX",
    latitude: "30.2792",
    longitude: "-97.7401",
    memberCount: 89,
    isPrivate: false,
    ageGroup: "Adult",
    gender: "Women's Only",
    ministryTypes: ["Prayer", "Discipleship"],
    activities: ["Book Club", "Coffee & Conversations", "Service Projects"],
    professions: [],
    meetingType: "In-Person",
    frequency: "Bi-weekly",
    lifeStages: ["Married"],
    parentCategories: ["Moms", "All Parents"],
  },
  {
    name: "Downtown Worship Collective",
    description: "Musicians and worship leaders gathering to lead authentic worship and grow together in musical ministry.",
    slug: "downtown-worship-collective",
    iconName: "musical-notes",
    iconColor: "#E11D48",
    city: "Austin",
    state: "TX",
    latitude: "30.2702",
    longitude: "-97.7461",
    memberCount: 67,
    isPrivate: false,
    ageGroup: "All Ages",
    gender: "Co-Ed",
    ministryTypes: ["Worship", "Music"],
    activities: ["Worship Music", "Music", "Coffee & Conversations"],
    professions: ["Creatives"],
    meetingType: "In-Person",
    frequency: "Weekly",
    lifeStages: ["Young Professionals", "Ministry Leaders"],
  },
  {
    name: "Men's Early Morning Prayer",
    description: "Start your day with fellow brothers in Christ. Prayer, accountability, and encouragement before work.",
    slug: "mens-early-morning-prayer",
    iconName: "hand-right",
    iconColor: "#4F46E5",
    city: "Austin",
    state: "TX",
    latitude: "30.2642",
    longitude: "-97.7451",
    memberCount: 43,
    isPrivate: false,
    ageGroup: "Adult",
    gender: "Men's Only",
    ministryTypes: ["Prayer", "Discipleship"],
    activities: ["Coffee & Conversations"],
    professions: ["Business", "First Responders", "Blue Collar"],
    meetingType: "In-Person",
    frequency: "Weekly",
    lifeStages: ["Married", "Young Professionals"],
  },
  {
    name: "College & Career Bible Study",
    description: "Diving deep into God's Word with college students and young professionals. Casual atmosphere, real discussions.",
    slug: "college-career-bible-study",
    iconName: "book",
    iconColor: "#D97706",
    city: "Austin",
    state: "TX",
    latitude: "30.2752",
    longitude: "-97.7411",
    memberCount: 156,
    isPrivate: false,
    ageGroup: "Young Adult",
    gender: "Co-Ed",
    ministryTypes: ["Bible Study", "Discipleship"],
    activities: ["Book Club", "Coffee & Conversations", "Board Games"],
    professions: ["Students", "Tech", "Creatives"],
    meetingType: "Hybrid",
    frequency: "Weekly",
    lifeStages: ["Students", "Young Professionals", "Singles"],
  },
  {
    name: "Seniors Walking in Faith",
    description: "Fellowship for seniors 60+ to pray, share life experiences, and encourage one another in the journey of faith.",
    slug: "seniors-walking-faith",
    iconName: "people",
    iconColor: "#059669",
    city: "Austin",
    state: "TX",
    latitude: "30.2612",
    longitude: "-97.7381",
    memberCount: 34,
    isPrivate: false,
    ageGroup: "Seniors",
    gender: "Co-Ed",
    ministryTypes: ["Prayer", "Bible Study"],
    activities: ["Coffee & Conversations", "Gardening", "Service Projects"],
    professions: [],
    meetingType: "In-Person",
    frequency: "Weekly",
    lifeStages: ["Seniors"],
  },
  {
    name: "Recovery & Renewal",
    description: "A safe place for those in recovery to find hope, healing, and community rooted in Christ's redemptive love.",
    slug: "recovery-renewal",
    iconName: "medical",
    iconColor: "#2563EB",
    city: "Austin",
    state: "TX",
    latitude: "30.2692",
    longitude: "-97.7411",
    memberCount: 52,
    isPrivate: true,
    ageGroup: "All Ages",
    gender: "Co-Ed",
    ministryTypes: ["Prayer", "Discipleship"],
    activities: ["Coffee & Conversations", "Mentoring"],
    professions: [],
    recoverySupport: ["Addiction Recovery", "Mental Health"],
    meetingType: "In-Person",
    frequency: "Weekly",
    lifeStages: ["New Believers"],
  },
  {
    name: "Outdoor Adventures Ministry",
    description: "Experience God's creation through hiking, camping, and outdoor activities. Faith discussions around the campfire.",
    slug: "outdoor-adventures-ministry",
    iconName: "trail-sign",
    iconColor: "#059669",
    city: "Austin",
    state: "TX",
    latitude: "30.2832",
    longitude: "-97.7491",
    memberCount: 91,
    isPrivate: false,
    ageGroup: "Adult",
    gender: "Co-Ed",
    ministryTypes: ["Discipleship"],
    activities: ["Hiking", "Outdoor Adventures", "Camping", "Fishing"],
    professions: [],
    meetingType: "In-Person",
    frequency: "Bi-weekly",
    lifeStages: ["Young Professionals", "Singles", "Married"],
  },
  {
    name: "Tech Workers Bible Study",
    description: "Software developers, engineers, and tech professionals discussing faith in the digital age.",
    slug: "tech-workers-bible-study",
    iconName: "hardware-chip",
    iconColor: "#4F46E5",
    city: "Austin",
    state: "TX",
    latitude: "30.2652",
    longitude: "-97.7441",
    memberCount: 78,
    isPrivate: false,
    ageGroup: "Young Adult",
    gender: "Co-Ed",
    ministryTypes: ["Bible Study", "Apologetics"],
    activities: ["Coffee & Conversations", "Gaming", "Board Games"],
    professions: ["Tech", "Business"],
    meetingType: "Hybrid",
    frequency: "Weekly",
    lifeStages: ["Young Professionals"],
  },
  {
    name: "Singles Community",
    description: "Building authentic friendships and faith for single adults. Game nights, service projects, and spiritual growth.",
    slug: "singles-community",
    iconName: "person",
    iconColor: "#7C3AED",
    city: "Austin",
    state: "TX",
    latitude: "30.2772",
    longitude: "-97.7421",
    memberCount: 143,
    isPrivate: false,
    ageGroup: "Young Adult",
    gender: "Co-Ed",
    ministryTypes: ["Bible Study", "Discipleship"],
    activities: ["Board Games", "Movies", "Coffee & Conversations", "Volunteering", "Sports"],
    professions: [],
    meetingType: "In-Person",
    frequency: "Weekly",
    lifeStages: ["Singles", "Young Professionals"],
  },
  {
    name: "Healthcare Professionals Prayer",
    description: "Doctors, nurses, and medical workers seeking spiritual support in a demanding field.",
    slug: "healthcare-professionals-prayer",
    iconName: "medical",
    iconColor: "#2563EB",
    city: "Austin",
    state: "TX",
    latitude: "30.2592",
    longitude: "-97.7471",
    memberCount: 41,
    isPrivate: false,
    ageGroup: "Adult",
    gender: "Co-Ed",
    ministryTypes: ["Prayer", "Discipleship"],
    activities: ["Coffee & Conversations", "Mentoring"],
    professions: ["Healthcare"],
    meetingType: "Hybrid",
    frequency: "Monthly",
    lifeStages: ["Young Professionals"],
  },
  {
    name: "Global Missions Network",
    description: "Connect with missionaries, learn about global ministry, and discover how you can impact the world for Christ.",
    slug: "global-missions-network",
    iconName: "airplane",
    iconColor: "#2563EB",
    city: null,
    state: null,
    latitude: null,
    longitude: null,
    memberCount: 312,
    isPrivate: false,
    ageGroup: "All Ages",
    gender: "Co-Ed",
    ministryTypes: ["Missions", "Prayer"],
    activities: ["Volunteering", "Service Projects", "Travel"],
    professions: [],
    meetingType: "Online",
    frequency: "Monthly",
    lifeStages: ["Ministry Leaders"],
  },
  {
    name: "Young Married Couples",
    description: "Navigating the early years of marriage together through faith, fun, and fellowship.",
    slug: "young-married-couples",
    iconName: "heart",
    iconColor: "#E11D48",
    city: "Austin",
    state: "TX",
    latitude: "30.2900",
    longitude: "-97.7300",
    memberCount: 68,
    isPrivate: false,
    ageGroup: "Young Adult",
    gender: "Co-Ed",
    ministryTypes: ["Bible Study", "Discipleship"],
    activities: ["Coffee & Conversations", "Board Games", "Movies", "Cooking"],
    professions: [],
    meetingType: "In-Person",
    frequency: "Bi-weekly",
    lifeStages: ["Married", "Young Professionals"],
  },
  {
    name: "First Responders Fellowship",
    description: "Police, firefighters, and paramedics finding strength and community in Christ.",
    slug: "first-responders-fellowship",
    iconName: "shield",
    iconColor: "#DC2626",
    city: "Austin",
    state: "TX",
    latitude: "30.2672",
    longitude: "-97.7600",
    memberCount: 37,
    isPrivate: false,
    ageGroup: "Adult",
    gender: "Co-Ed",
    ministryTypes: ["Prayer", "Discipleship"],
    activities: ["Coffee & Conversations", "Fitness", "Service Projects"],
    professions: ["First Responders"],
    meetingType: "In-Person",
    frequency: "Bi-weekly",
    lifeStages: ["Young Professionals"],
  },
  {
    name: "Creative Arts Ministry",
    description: "Writers, artists, photographers, and creatives using their gifts for God's glory.",
    slug: "creative-arts-ministry",
    iconName: "color-palette",
    iconColor: "#DB2777",
    city: "Austin",
    state: "TX",
    latitude: "30.2672",
    longitude: "-97.7450",
    memberCount: 84,
    isPrivate: false,
    ageGroup: "All Ages",
    gender: "Co-Ed",
    ministryTypes: ["Worship", "Discipleship"],
    activities: ["Arts & Crafts", "Photography", "Writing", "Music"],
    professions: ["Creatives"],
    meetingType: "Hybrid",
    frequency: "Bi-weekly",
    lifeStages: ["Young Professionals", "Ministry Leaders"],
  },
  {
    name: "High School Youth Group",
    description: "Teens growing in faith together through games, worship, and real talk about life and God.",
    slug: "high-school-youth-group",
    iconName: "school",
    iconColor: "#F59E0B",
    city: "Austin",
    state: "TX",
    latitude: "30.2672",
    longitude: "-97.7450",
    memberCount: 187,
    isPrivate: false,
    ageGroup: "Youth",
    gender: "Co-Ed",
    ministryTypes: ["Youth Ministry", "Worship", "Discipleship"],
    activities: ["Sports", "Gaming", "Music", "Service Projects", "Outdoor Adventures"],
    professions: ["Students"],
    meetingType: "In-Person",
    frequency: "Weekly",
    lifeStages: ["Students"],
  },
];

async function seedScreenshotCommunities() {
  console.info('🌱 Seeding screenshot communities...');

  try {
    let created = 0;
    let skipped = 0;

    // Create communities (flag is in slug for identification)
    for (const community of screenshotCommunities) {
      // Check if community already exists
      const existing = await db.select().from(communities).where(eq(communities.slug, community.slug));

      if (existing.length > 0) {
        console.info(`⏭️  Skipped (already exists): ${community.name}`);
        skipped++;
        continue;
      }

      await db.insert(communities).values({
        ...community,
      }).returning();

      console.info(`✅ Created: ${community.name} (${community.memberCount} members)`);
      created++;
    }

    console.info(`\n✨ Summary: ${created} created, ${skipped} skipped (already existed)`);
    if (created > 0) {
      console.info('\n📸 Communities are ready for App Store screenshots!');
    }
  } catch (error) {
    console.error('❌ Error seeding screenshot communities:', error);
    throw error;
  }
}

async function removeScreenshotCommunities() {
  console.info('🗑️  Removing screenshot communities...');

  try {
    // Find communities by their specific slugs
    const seedSlugs = screenshotCommunities.map(c => c.slug);
    const allCommunities = await db.select().from(communities);
    const screenshotComms = allCommunities.filter(c =>
      seedSlugs.includes(c.slug)
    );

    if (screenshotComms.length === 0) {
      console.info('ℹ️  No screenshot communities found.');
      return;
    }

    // Delete community members first (foreign key constraint)
    for (const comm of screenshotComms) {
      await db.delete(communityMembers).where(eq(communityMembers.communityId, comm.id));
    }

    // Delete communities
    for (const comm of screenshotComms) {
      await db.delete(communities).where(eq(communities.id, comm.id));
      console.info(`✅ Removed: ${comm.name}`);
    }

    console.info(`\n✨ Successfully removed ${screenshotComms.length} screenshot communities!`);
  } catch (error) {
    console.error('❌ Error removing screenshot communities:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isRemove = args.includes('--remove');

  if (isRemove) {
    await removeScreenshotCommunities();
  } else {
    await seedScreenshotCommunities();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
