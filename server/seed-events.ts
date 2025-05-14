/**
 * Seed script for community events and RSVPs
 */
import { db } from "./db";
import { users, events, eventRsvps, communities } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedEvents() {
  console.log("Starting events data seeding...");
  
  try {
    // Check if events already exist
    const existingEvents = await db.select({ count: { count: 'id' }}).from(events);
    if (existingEvents[0]?.count > 0) {
      console.log("Events already exist, skipping seeding");
      return;
    }

    // Get the demo user
    const demoUsers = await db.select().from(users).where(({ eq }) => eq(users.username, 'demo'));
    if (demoUsers.length === 0) {
      console.log("Demo user not found, cannot seed events");
      return;
    }
    
    const demoUser = demoUsers[0];
    console.log(`Found demo user with ID: ${demoUser.id}, will use as event creator`);
    
    // Get communities
    const allCommunities = await db.select().from(communities);
    if (allCommunities.length === 0) {
      console.log("No communities found, cannot seed community events");
      return;
    }

    console.log(`Found ${allCommunities.length} communities for event creation`);

    // Helper function to add days to current date
    const addDays = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };

    // Create events for each community
    const eventsData = [
      // Bible Study community event
      {
        title: "Weekly Bible Study: Gospel of John",
        description: "Join us for our weekly Bible study where we'll be exploring the Gospel of John. This week we'll be focusing on chapters 1-2, discussing the prologue and Jesus's first miracle at the wedding in Cana. All levels of Biblical knowledge are welcome!",
        location: "Community Center Room 103",
        address: "123 Main Street",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        isVirtual: false,
        isPublic: true,
        showOnMap: true,
        eventDate: addDays(3), // 3 days from now
        startTime: "19:00", // 7:00 PM
        endTime: "20:30", // 8:30 PM
        creatorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'bible-study')?.id || null,
        latitude: "39.781721",
        longitude: "-89.650148"
      },
      // Hybrid event for Theology community
      {
        title: "Panel Discussion: Faith and Science",
        description: "A panel discussion featuring scientists who are Christians discussing how they integrate their faith with their scientific work. Topics will include evolution, cosmology, and bioethics. Join us in person or online via the virtual meeting link.",
        location: "University Auditorium",
        address: "500 College Ave",
        city: "Springfield",
        state: "IL",
        zipCode: "62702",
        isVirtual: true,
        virtualMeetingUrl: "https://example.com/meeting/faithscience",
        isPublic: true,
        showOnMap: true,
        eventDate: addDays(10), // 10 days from now
        startTime: "18:30", // 6:30 PM
        endTime: "20:00", // 8:00 PM
        creatorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'theology')?.id || null,
        latitude: "39.776031",
        longitude: "-89.643909"
      },
      // Virtual event for Prayer community
      {
        title: "24-Hour Prayer Vigil",
        description: "Join our 24-hour prayer vigil where we'll be praying continuously for our community, nation, and world. Sign up for a 30-minute slot to participate. Prayer guides and specific prayer points will be provided.",
        isVirtual: true,
        virtualMeetingUrl: "https://example.com/prayer-vigil",
        isPublic: true,
        eventDate: addDays(7), // 7 days from now
        startTime: "18:00", // 6:00 PM
        endTime: "18:00", // 6:00 PM (next day, but we'll simplify)
        creatorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'prayer-requests')?.id || null
      },
      // Christian Life community event
      {
        title: "Volunteer Day: Community Garden",
        description: "Let's put our faith into action! Join us as we help maintain the community garden that provides fresh produce for the local food pantry. No gardening experience necessary. Tools will be provided, just bring work gloves and water.",
        location: "Hope Community Garden",
        address: "456 Park Street",
        city: "Springfield",
        state: "IL",
        zipCode: "62704",
        isVirtual: false,
        isPublic: true,
        showOnMap: true,
        eventDate: addDays(14), // 14 days from now
        startTime: "09:00", // 9:00 AM
        endTime: "12:00", // 12:00 PM
        creatorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'christian-life')?.id || null,
        latitude: "39.789940",
        longitude: "-89.654420"
      },
      // Another Christian Life event
      {
        title: "Family Movie Night: The Case for Christ",
        description: "Join us for a family-friendly movie night featuring 'The Case for Christ.' We'll provide popcorn and drinks, and have a brief discussion after the film about its themes and message.",
        location: "Community Center Auditorium",
        address: "123 Main Street",
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        isVirtual: false,
        isPublic: true,
        showOnMap: true,
        eventDate: addDays(21), // 21 days from now
        startTime: "18:30", // 6:30 PM
        endTime: "21:00", // 9:00 PM
        creatorId: demoUser.id,
        communityId: allCommunities.find(c => c.slug === 'christian-life')?.id || null,
        latitude: "39.781721",
        longitude: "-89.650148"
      }
    ];

    console.log("Creating events...");
    const insertedEvents = await db.insert(events).values(eventsData).returning();
    console.log(`Created ${insertedEvents.length} events`);

    // Add RSVPs for events
    const rsvpData = [];
    for (const event of insertedEvents) {
      // Creator is attending
      rsvpData.push({
        eventId: event.id,
        userId: demoUser.id,
        status: "attending"
      });
      
      // For the first event, add a "maybe" RSVP too (just to show different statuses)
      if (event === insertedEvents[0]) {
        rsvpData.push({
          eventId: event.id,
          userId: demoUser.id,
          status: "maybe"
        });
      }
    }

    console.log("Creating event RSVPs...");
    const insertedRsvps = await db.insert(eventRsvps).values(rsvpData).returning();
    console.log(`Created ${insertedRsvps.length} event RSVPs`);
    
    console.log("Events data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding events:", error);
  }
}

// Run this directly if called directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedEvents()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to seed events data:", error);
      process.exit(1);
    });
}

// Function is already exported at the top