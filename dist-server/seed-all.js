import { seedDatabase } from "./seed.js";
import { seedBibleReadingPlans } from "./seed-bible-reading-plans.js";
import { seedCreatorTiersAndGifts } from "./seed-creator-tiers.js";
import { seedFeed } from "./seed-feed.js";
import { seedApologetics } from "./seed-apologetics.js";
import { seedPrayerRequests } from "./seed-prayer-requests.js";
import { seedEvents } from "./seed-events.js";
import { seedWallPosts } from "./seed-wall-posts.js";
async function seedAll() {
  console.log("===============================================");
  console.log("Starting comprehensive data seeding process...");
  console.log("===============================================");
  try {
    await seedDatabase();
    console.log("-----------------------------------------------");
    await seedBibleReadingPlans();
    console.log("-----------------------------------------------");
    console.log("Community seeding already done, skipping...");
    console.log("-----------------------------------------------");
    try {
      await seedCreatorTiersAndGifts();
    } catch (error) {
      console.log("Creator tiers already seeded or encountered an error, skipping...");
    }
    console.log("-----------------------------------------------");
    await seedFeed();
    console.log("-----------------------------------------------");
    await seedApologetics();
    console.log("-----------------------------------------------");
    await seedPrayerRequests();
    console.log("-----------------------------------------------");
    await seedEvents();
    console.log("-----------------------------------------------");
    await seedWallPosts();
    console.log("-----------------------------------------------");
    console.log("===============================================");
    console.log("Comprehensive data seeding completed successfully!");
    console.log("===============================================");
  } catch (error) {
    console.error("Error during comprehensive seeding:", error);
  }
}
export {
  seedAll
};
