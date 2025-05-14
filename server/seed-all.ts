/**
 * Master seed script that runs all seed scripts in sequence
 */
import { seedDatabase } from './seed';
import { seedBibleReadingPlans } from './seed-bible-reading-plans';
import { seedCommunities } from './seed-communities';
import { seedCreatorTiersAndGifts } from './seed-creator-tiers';
import { seedFeed } from './seed-feed';
import { seedApologetics } from './seed-apologetics';
import { seedPrayerRequests } from './seed-prayer-requests';
import { seedEvents } from './seed-events';
import { seedWallPosts } from './seed-wall-posts';

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
    
    // Additional community seeding (if needed)
    try {
      await seedCommunities();
    } catch (error) {
      console.log("Community seeding already done or encountered an error, skipping...");
    }
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
if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed process failed:", error);
      process.exit(1);
    });
}

export { seedAll };