import { db } from "./db.js";
import { users, prayerRequests, prayers, communities } from "./shared/schema.js";
import { eq } from "drizzle-orm";
async function seedPrayerRequests() {
  console.log("Starting prayer request data seeding...");
  try {
    const existingPrayers = await db.select({ count: { count: "id" } }).from(prayerRequests);
    if (existingPrayers[0]?.count > 0) {
      console.log("Prayer requests already exist, skipping seeding");
      return;
    }
    const demoUsers = await db.select().from(users).where(({ eq: eq2 }) => eq2(users.username, "demo"));
    if (demoUsers.length === 0) {
      console.log("Demo user not found, cannot seed prayer requests");
      return;
    }
    const demoUser = demoUsers[0];
    console.log(`Found demo user with ID: ${demoUser.id}, will use as prayer request creator`);
    const prayerCommunity = await db.select().from(communities).where(({ eq: eq2 }) => eq2(communities.slug, "prayer-requests"));
    const communityId = prayerCommunity[0]?.id;
    if (!communityId) {
      console.log("Prayer community not found");
    } else {
      console.log(`Found prayer community with ID: ${communityId}`);
    }
    const prayerRequestData = [
      {
        title: "Health concerns for my mother",
        content: "My mother is undergoing some medical tests for a concerning health issue. Please pray for accurate diagnosis, effective treatment options, and peace of mind for her and our family during this uncertain time.",
        authorId: demoUser.id,
        privacyLevel: "public",
        isAnonymous: false
      },
      {
        title: "Job interview next week",
        content: "I have an important job interview next week that would be a significant step forward in my career. Please pray for clarity of mind, confidence, and that God's will would be done in this situation.",
        authorId: demoUser.id,
        privacyLevel: "public",
        isAnonymous: false
      },
      {
        title: "Marriage restoration",
        content: "My spouse and I have been going through a difficult time in our marriage. Please pray for healing, restored communication, and that we would both have hearts open to forgiveness and reconciliation.",
        authorId: demoUser.id,
        privacyLevel: "public",
        isAnonymous: true
      },
      {
        title: "Wisdom for important decision",
        content: "I'm facing a major life decision that will affect my family's future. Please pray that God would grant me wisdom, clear guidance, and peace about which path to take.",
        authorId: demoUser.id,
        privacyLevel: "public",
        isAnonymous: false
      },
      {
        title: "Financial breakthrough needed",
        content: "Our family is experiencing financial strain due to unexpected expenses and reduced income. Please pray for provision, wisdom in managing our resources, and potential new opportunities.",
        authorId: demoUser.id,
        privacyLevel: "public",
        isAnonymous: false
      },
      {
        title: "Prayer for my child's faith",
        content: "My teenage child is questioning their faith and moving away from church involvement. Please pray that God would work in their heart, that they would encounter Christ in a meaningful way, and that I would have wisdom in how to support them through this time.",
        authorId: demoUser.id,
        privacyLevel: "public",
        isAnonymous: false
      }
    ];
    console.log("Creating prayer requests...");
    const insertedPrayers = await db.insert(prayerRequests).values(prayerRequestData).returning();
    console.log(`Created ${insertedPrayers.length} prayer requests`);
    const prayerResponseData = [];
    for (const prayer of insertedPrayers) {
      const prayerCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < prayerCount; i++) {
        prayerResponseData.push({
          prayerRequestId: prayer.id,
          userId: demoUser.id,
          message: i % 2 === 0 ? "Praying for you during this time. May God provide exactly what you need." : "I'm lifting this up in prayer. Standing with you in faith."
        });
      }
      await db.update(prayerRequests).set({ prayerCount }).where(eq(prayerRequests.id, prayer.id));
    }
    const answeredPrayer = insertedPrayers[1];
    await db.update(prayerRequests).set({
      isAnswered: true,
      answeredDescription: "Update: I got the job! Thank you all for your prayers. I start next month and am so grateful for God's provision."
    }).where(eq(prayerRequests.id, answeredPrayer.id));
    console.log("Marked one prayer request as answered");
    console.log("Creating prayer responses...");
    if (prayerResponseData.length > 0) {
      const insertedResponses = await db.insert(prayers).values(prayerResponseData).returning();
      console.log(`Created ${insertedResponses.length} prayer responses`);
    }
    console.log("Prayer request data seeding completed successfully");
  } catch (error) {
    console.error("Error seeding prayer requests:", error);
  }
}
export {
  seedPrayerRequests
};
