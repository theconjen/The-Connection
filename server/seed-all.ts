/**
 * Master seed script that runs all seed scripts in sequence
 */
import { seedDatabase } from './seed.js';
import { seedBibleReadingPlans } from './seed-bible-reading-plans.js';
import { seedCreatorTiersAndGifts } from './seed-creator-tiers.js'; 
import { seedFeed } from './seed-feed.js';
import { seedApologetics } from './seed-apologetics.js';
import { seedPrayerRequests } from './seed-prayer-requests.js';
import { seedEvents } from './seed-events.js';
import { seedWallPosts } from './seed-wall-posts.js';

async function seedAll() {
  console.log("===============================================");
  console.log("Starting comprehensive data seeding process...");
  console.log("===============================================");
  
  try {
    // Core data (users, basic communities, etc.)
    await seedDatabase();
    console.log("-----------------------------------------------");
    
    // Bible reading plans
    await seedBibleReadingPlans();
    console.log("-----------------------------------------------");
    
    // Communities are already seeded in the main seed script or with SQL directly
    console.log("Community seeding already done, skipping...");
    console.log("-----------------------------------------------");
    
    // Creator tiers and gifts
    try {
      await seedCreatorTiersAndGifts();
    } catch (error) {
      console.log("Creator tiers already seeded or encountered an error, skipping...");
    }
    console.log("-----------------------------------------------");
    
    // Feed content (posts, microblogs)
    await seedFeed();
    console.log("-----------------------------------------------");
    
    // Apologetics content
    await seedApologetics();
    console.log("-----------------------------------------------");
    
    // Prayer requests and responses
    await seedPrayerRequests();
    console.log("-----------------------------------------------");
    
    // Events and RSVPs
    await seedEvents();
    console.log("-----------------------------------------------");
    
    // Community wall posts
    await seedWallPosts();
    console.log("-----------------------------------------------");
    
    console.log("===============================================");
    console.log("Comprehensive data seeding completed successfully!");
    console.log("===============================================");
  } catch (error) {
    console.error("Error during comprehensive seeding:", error);
  }
}

// Run the seed process if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  seedAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed process failed:", error);
      process.exit(1);
    });
}

export { seedAll };