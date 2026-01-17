/**
 * Master seed script that runs all seed scripts in sequence
 */
import { seedDatabase } from './seed.js';
import { seedBibleReadingPlans } from './seed-bible-reading-plans.js';
import { seedCreatorTiersAndGifts } from './seed-creator-tiers.js';
import { seedFeed } from './seed-feed.js';
import { seedApologetics } from './seed-apologetics.js';
import { seedApologeticsQAs } from './seed-apologetics-qas.js';
import { seedResources } from './seed-resources.js';
import { seedPrayerRequests } from './seed-prayer-requests.js';
import { seedEvents } from './seed-events.js';
import { seedWallPosts } from './seed-wall-posts.js';

async function seedAll() {
  
  try {
    // Core data (users, basic communities, etc.)
    await seedDatabase();
    
    // Bible reading plans
    await seedBibleReadingPlans();
    
    // Communities are already seeded in the main seed script or with SQL directly
    
    // Creator tiers and gifts
    try {
      await seedCreatorTiersAndGifts();
    } catch (error) {
    }
    
    // Feed content (posts, microblogs)
    await seedFeed();
    
    // Apologetics content (old system)
    await seedApologetics();

    // Apologetics Q&A (new private inbox system)
    try {
      await seedApologeticsQAs();
    } catch (error) {
      console.error('Error seeding apologetics Q&As:', error);
    }

    // Apologetics resources
    await seedResources();
    
    // Prayer requests and responses
    await seedPrayerRequests();
    
    // Events and RSVPs
    await seedEvents();
    
    // Community wall posts
    await seedWallPosts();
    
  } catch (error) {
    console.error("Error during comprehensive seeding:", error);
  }
}

// Run the seed process if this script is executed directly
// if (import.meta.url === new URL(import.meta.url).href) {
//   seedAll()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error("Seed process failed:", error);
//       process.exit(1);
//     });
// }

export { seedAll };