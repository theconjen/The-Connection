/**
 * Seed script for App Store screenshot events
 * Run: npx tsx server/seed-screenshot-events.ts
 * Remove: npx tsx server/seed-screenshot-events.ts --remove
 */

import 'dotenv/config';
import { db } from './db';
import { events, eventRsvps, users, communities } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Flag events as screenshot data
const SCREENSHOT_FLAG = '[SCREENSHOT]';

// Helper function to get dates relative to today
function getDateOffset(daysFromNow: number, hour: number = 19, minute: number = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function getEndTime(startDate: Date, durationHours: number): Date {
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + durationHours);
  return endDate;
}

const screenshotEvents = [
  {
    title: "Sunday Worship Service",
    description: "Join us for a powerful time of worship, prayer, and teaching from God's Word. All are welcome! Childcare provided for ages 0-12. Coffee and fellowship after the service.",
    location: "Grace Community Church, 123 Main St, Austin, TX",
    latitude: "30.2672",
    longitude: "-97.7431",
    startTime: getDateOffset(0, 10, 30), // This Sunday at 10:30 AM
    endTime: getDateOffset(0, 12, 0), // 1.5 hour service
    isOnline: false,
    maxAttendees: 500,
    attendeeCount: 287,
    tags: ['worship', 'sunday', 'church'],
  },
  {
    title: "Young Adults Game Night",
    description: "Board games, card games, and fellowship! Bring your favorite snack to share. Ages 18-35 welcome. Great way to meet new friends in a fun, casual environment.",
    location: "The Connection Hub, 456 Oak Ave, Austin, TX",
    latitude: "30.2849",
    longitude: "-97.7341",
    startTime: getDateOffset(5, 19, 0), // Friday at 7 PM
    endTime: getDateOffset(5, 22, 0), // 3 hours
    isOnline: false,
    maxAttendees: 40,
    attendeeCount: 28,
    tags: ['games', 'fellowship', 'young-adults'],
  },
  {
    title: "Women's Bible Study: Proverbs 31",
    description: "A 6-week study on the Proverbs 31 woman. Discover God's design for women in faith, family, and work. Coffee, childcare, and great discussion included!",
    location: "Cornerstone Church, 789 Elm St, Austin, TX",
    latitude: "30.2612",
    longitude: "-97.7381",
    startTime: getDateOffset(2, 9, 30), // Tuesday at 9:30 AM
    endTime: getDateOffset(2, 11, 30), // 2 hours
    isOnline: false,
    maxAttendees: 50,
    attendeeCount: 34,
    tags: ['women', 'bible-study', 'prayer'],
  },
  {
    title: "Online Prayer Meeting",
    description: "Join believers from around the country for an hour of powerful intercession. We'll pray for our nation, churches, families, and personal needs. Zoom link sent upon RSVP.",
    location: "Zoom (Online)",
    latitude: null,
    longitude: null,
    startTime: getDateOffset(1, 20, 0), // Monday at 8 PM
    endTime: getDateOffset(1, 21, 0), // 1 hour
    isOnline: true,
    maxAttendees: null,
    attendeeCount: 156,
    tags: ['prayer', 'online', 'intercession'],
  },
  {
    title: "Baptism Service at the Lake",
    description: "Celebrating new life in Christ! If you've made the decision to follow Jesus and want to be baptized, sign up today. Friends and family welcome to attend and celebrate!",
    location: "Lady Bird Lake Park, Austin, TX",
    latitude: "30.2595",
    longitude: "-97.7473",
    startTime: getDateOffset(7, 15, 0), // Next Sunday at 3 PM
    endTime: getDateOffset(7, 17, 0), // 2 hours
    isOnline: false,
    maxAttendees: 200,
    attendeeCount: 78,
    tags: ['baptism', 'celebration', 'outdoor'],
  },
  {
    title: "Men's Breakfast & Devotional",
    description: "Bacon, eggs, coffee, and brotherhood! Join us for a hearty breakfast and short devotional on becoming the men God has called us to be. Bring a friend!",
    location: "The Breakfast Club, 234 Coffee Rd, Austin, TX",
    latitude: "30.2752",
    longitude: "-97.7411",
    startTime: getDateOffset(6, 7, 0), // Saturday at 7 AM
    endTime: getDateOffset(6, 9, 0), // 2 hours
    isOnline: false,
    maxAttendees: 60,
    attendeeCount: 43,
    tags: ['men', 'breakfast', 'fellowship'],
  },
  {
    title: "Youth Group: Summer Kickoff Pool Party",
    description: "It's getting hot! Cool off with swimming, games, music, and a short message. Grades 6-12 welcome. Bring swimwear, towel, and $5 for pizza. Parents can stay or drop off!",
    location: "Johnson Family Home, 567 Pool Ln, Austin, TX",
    latitude: "30.3500",
    longitude: "-97.8000",
    startTime: getDateOffset(12, 18, 0), // Two weeks out at 6 PM
    endTime: getDateOffset(12, 21, 0), // 3 hours
    isOnline: false,
    maxAttendees: 80,
    attendeeCount: 52,
    tags: ['youth', 'pool-party', 'summer'],
  },
  {
    title: "Missions Info Night: Guatemala Trip",
    description: "Learn about our July mission trip to Guatemala! We'll be building homes, running VBS, and sharing the Gospel. Come hear stories, see photos, and find out how to join or support the team.",
    location: "Grace Community Church, 123 Main St, Austin, TX",
    latitude: "30.2672",
    longitude: "-97.7431",
    startTime: getDateOffset(10, 19, 0), // In 10 days at 7 PM
    endTime: getDateOffset(10, 21, 0), // 2 hours
    isOnline: true, // Hybrid - also available online
    maxAttendees: 100,
    attendeeCount: 34,
    tags: ['missions', 'info-session', 'guatemala'],
  },
  {
    title: "Worship Night: Acoustics & Prayer",
    description: "An intimate evening of acoustic worship and prayer ministry. Come as you are. Expect God to meet you in a powerful way. No agenda, just worship and His presence.",
    location: "The Loft, 890 Worship Way, Austin, TX",
    latitude: "30.2672",
    longitude: "-97.7450",
    startTime: getDateOffset(14, 19, 30), // Two weeks out at 7:30 PM
    endTime: getDateOffset(14, 22, 0), // 2.5 hours
    isOnline: false,
    maxAttendees: 120,
    attendeeCount: 89,
    tags: ['worship', 'prayer', 'music'],
  },
  {
    title: "Marriage Enrichment Seminar",
    description: "Date night with a purpose! Join us for a marriage enrichment seminar with Pastor Mike & Amy. Topics: communication, conflict resolution, and keeping Christ at the center. Dinner included!",
    location: "Cornerstone Church, 789 Elm St, Austin, TX",
    latitude: "30.2612",
    longitude: "-97.7381",
    startTime: getDateOffset(20, 18, 0), // Three weeks out at 6 PM
    endTime: getDateOffset(20, 21, 0), // 3 hours
    isOnline: false,
    maxAttendees: 40,
    attendeeCount: 24,
    tags: ['marriage', 'couples', 'seminar'],
  },
  {
    title: "Community Service Day: Food Bank",
    description: "Serve together! We're partnering with Austin Food Bank to sort and pack food for families in need. Perfect for families with kids ages 8+. Wear comfortable clothes!",
    location: "Austin Food Bank, 6500 Metropolis Dr, Austin, TX",
    latitude: "30.2130",
    longitude: "-97.6730",
    startTime: getDateOffset(13, 9, 0), // Two weeks Saturday at 9 AM
    endTime: getDateOffset(13, 12, 0), // 3 hours
    isOnline: false,
    maxAttendees: 50,
    attendeeCount: 41,
    tags: ['service', 'outreach', 'volunteer'],
  },
  {
    title: "Theology on Tap: Apologetics Discussion",
    description: "Coffee (or beer), conversation, and defending the faith! This month: 'Why does God allow suffering?' Open mic Q&A format. Skeptics welcome - bring your toughest questions!",
    location: "Common Grounds Coffee, 345 Java St, Austin, TX",
    latitude: "30.2800",
    longitude: "-97.7450",
    startTime: getDateOffset(17, 19, 0), // In 17 days at 7 PM
    endTime: getDateOffset(17, 21, 0), // 2 hours
    isOnline: false,
    maxAttendees: 30,
    attendeeCount: 22,
    tags: ['apologetics', 'coffee', 'discussion'],
  },
  {
    title: "Kids Ministry Volunteer Training",
    description: "Want to serve in Kids Ministry? Come to this mandatory training! We'll cover child safety, lesson planning, and classroom management. Background check required (we'll help you apply!).",
    location: "Grace Community Church, 123 Main St, Austin, TX",
    latitude: "30.2672",
    longitude: "-97.7431",
    startTime: getDateOffset(8, 10, 0), // Next week Saturday at 10 AM
    endTime: getDateOffset(8, 13, 0), // 3 hours
    isOnline: false,
    maxAttendees: 25,
    attendeeCount: 18,
    tags: ['volunteer', 'training', 'kids'],
  },
  {
    title: "Singles Hiking Trip: Mt. Bonnell",
    description: "Get out in God's creation! Easy-moderate hike with amazing views of Austin. Ages 21-40. We'll hike, have lunch, and end with a short devotional. Bring water, snacks, and sunscreen!",
    location: "Mt. Bonnell Trailhead, Austin, TX",
    latitude: "30.3150",
    longitude: "-97.7730",
    startTime: getDateOffset(6, 8, 0), // Saturday at 8 AM
    endTime: getDateOffset(6, 12, 0), // 4 hours
    isOnline: false,
    maxAttendees: 25,
    attendeeCount: 19,
    tags: ['singles', 'hiking', 'outdoor'],
  },
  {
    title: "Financial Peace University",
    description: "Dave Ramsey's Financial Peace University - 9 week course! Learn budgeting, getting out of debt, saving, and being a good steward of God's resources. Materials fee: $129.",
    location: "The Connection Hub, 456 Oak Ave, Austin, TX",
    latitude: "30.2849",
    longitude: "-97.7341",
    startTime: getDateOffset(15, 19, 0), // Two+ weeks at 7 PM
    endTime: getDateOffset(15, 21, 0), // 2 hours weekly
    isOnline: true, // Hybrid
    maxAttendees: 40,
    attendeeCount: 28,
    tags: ['financial', 'stewardship', 'class'],
  },
];

async function seedScreenshotEvents() {

  try {
    // Get screenshot users
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

    // Create events
    for (let i = 0; i < screenshotEvents.length; i++) {
      const eventData = screenshotEvents[i];
      const organizer = demoUsers[i % demoUsers.length];
      const community = screenshotCommunities[i % Math.max(1, screenshotCommunities.length)];

      const [createdEvent] = await db.insert(events).values({
        title: eventData.title,
        description: `${SCREENSHOT_FLAG} ${eventData.description}`,
        eventDate: eventData.startTime.toISOString().split('T')[0], // Just the date portion
        startTime: eventData.startTime.toTimeString().split(' ')[0], // Just the time portion HH:MM:SS
        endTime: eventData.endTime.toTimeString().split(' ')[0],
        location: eventData.location,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        isVirtual: eventData.isOnline,
        creatorId: organizer.id,
        communityId: community?.id || null,
      }).returning();


      // Add random attendees
      const numAttendees = Math.min(eventData.attendeeCount, demoUsers.length);
      for (let j = 0; j < numAttendees && j < demoUsers.length; j++) {
        await db.insert(eventRsvps).values({
          eventId: createdEvent.id,
          userId: demoUsers[j].id,
          status: 'attending',
        });
      }

    }

  } catch (error) {
    console.error('❌ Error seeding screenshot events:', error);
    throw error;
  }
}

async function removeScreenshotEvents() {

  try {
    // Find all events with screenshot flag
    const allEvents = await db.select().from(events);
    const screenshotEventsList = allEvents.filter(e =>
      e.description?.includes(SCREENSHOT_FLAG)
    );

    if (screenshotEventsList.length === 0) {
      return;
    }

    // Delete event RSVPs first (foreign key constraint)
    for (const event of screenshotEventsList) {
      await db.delete(eventRsvps).where(eq(eventRsvps.eventId, event.id));
    }

    // Delete events
    for (const event of screenshotEventsList) {
      await db.delete(events).where(eq(events.id, event.id));
      .trim()}"`);
    }

  } catch (error) {
    console.error('❌ Error removing screenshot events:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isRemove = args.includes('--remove');

  if (isRemove) {
    await removeScreenshotEvents();
  } else {
    await seedScreenshotEvents();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
