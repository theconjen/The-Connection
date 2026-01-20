import "dotenv/config";
import { storage } from './storage-optimized';

async function testRecommendations() {
  console.log('🧪 Testing Community Recommendations\n');

  try {
    // Get all users
    const users = await storage.getAllUsers();

    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    console.log(`✅ Found ${users.length} users`);

    // Test with first user
    const testUser = users[0];
    console.log(`\n👤 Testing with user: ${testUser.username} (ID: ${testUser.id})`);
    console.log(`   Interests: ${testUser.interests || 'None'}`);
    console.log(`   Location: ${testUser.city || 'Unknown'}, ${testUser.state || 'Unknown'}`);
    console.log(`   Denomination: ${testUser.denomination || 'None'}`);

    // Get recommended communities
    const recommendations = await storage.getRecommendedCommunities(testUser.id, 10);

    console.log(`\n📊 Recommendations found: ${recommendations.length}`);

    if (recommendations.length > 0) {
      console.log('\n🎯 Top 5 Recommended Communities:\n');
      recommendations.slice(0, 5).forEach((community: any, index: number) => {
        console.log(`${index + 1}. ${community.name}`);
        console.log(`   Score: ${community.recommendationScore?.toFixed(2) || 'N/A'}`);
        console.log(`   Description: ${community.description?.substring(0, 80) || 'No description'}...`);
        console.log(`   Meeting Type: ${community.meetingType || 'Unknown'}`);
        console.log(`   Location: ${community.city || 'Unknown'}, ${community.state || 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No recommendations found. This could be because:');
      console.log('   - No public communities exist');
      console.log('   - User is already member of all public communities');
      console.log('   - User profile lacks data for matching (interests, location, etc.)');
    }

    // Get all communities
    const allCommunities = await storage.getAllCommunities();
    console.log(`\n📚 Total communities in database: ${allCommunities.length}`);

    // Get user's communities
    const userCommunities = await storage.getUserCommunities(testUser.id);
    console.log(`👥 Communities user is already in: ${userCommunities.length}`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing recommendations:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRecommendations()
    .then(() => {
      console.log('\n✅ Recommendation test complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testRecommendations };
