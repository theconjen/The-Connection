import { db } from './db';
import { creatorTiers, virtualGifts } from '@shared/schema';

async function seedCreatorTiersAndGifts() {
  console.log("Starting to seed creator tiers and virtual gifts...");
  
  // Check if we already have creator tiers
  const existingTiers = await db.select().from(creatorTiers);
  if (existingTiers.length > 0) {
    console.log("Creator tiers already exist, skipping...");
  } else {
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
  }
  
  // Check if we already have virtual gifts
  const existingGifts = await db.select().from(virtualGifts);
  if (existingGifts.length > 0) {
    console.log("Virtual gifts already exist, skipping...");
  } else {
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
  }
  
  console.log("Seeding of creator tiers and virtual gifts completed!");
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCreatorTiersAndGifts()
    .then(() => console.log("Done!"))
    .catch((error) => {
      console.error("Error seeding creator tiers and gifts:", error);
    });
}

// Export the function for use in other scripts
export { seedCreatorTiersAndGifts };