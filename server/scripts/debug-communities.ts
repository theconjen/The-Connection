import "dotenv/config";
import { storage } from '../storage-optimized';

async function debugCommunities() {
  console.log('🔍 Debugging Communities Data Structure\n');

  try {
    const communities = await storage.getAllCommunities();

    console.log(`Total communities: ${communities.length}\n`);

    if (communities.length > 0) {
      console.log('Sample community (first one):');
      console.log(JSON.stringify(communities[0], null, 2));

      console.log('\n\nField Analysis:');
      console.log('================');

      const sample = communities[0];
      console.log(`- ministryTypes: ${JSON.stringify(sample.ministryTypes)}`);
      console.log(`- activities: ${JSON.stringify(sample.activities)}`);
      console.log(`- professions: ${JSON.stringify(sample.professions)}`);
      console.log(`- lifeStages: ${JSON.stringify(sample.lifeStages)}`);
      console.log(`- recoverySupport: ${JSON.stringify(sample.recoverySupport)}`);
      console.log(`- ageGroup: ${sample.ageGroup}`);
      console.log(`- gender: ${sample.gender}`);
      console.log(`- meetingType: ${sample.meetingType}`);
      console.log(`- frequency: ${sample.frequency}`);

      console.log('\n\nCommunities with "Bible Study" ministry type:');
      const bibleStudyCommunities = communities.filter((c: any) =>
        c.ministryTypes && c.ministryTypes.includes('Bible Study')
      );
      console.log(`Found: ${bibleStudyCommunities.length} communities`);
      bibleStudyCommunities.forEach((c: any) => {
        console.log(`  - ${c.name}: ${JSON.stringify(c.ministryTypes)}`);
      });

      console.log('\n\nCommunities with "Hiking" activity:');
      const hikingCommunities = communities.filter((c: any) =>
        c.activities && c.activities.includes('Hiking')
      );
      console.log(`Found: ${hikingCommunities.length} communities`);
      hikingCommunities.forEach((c: any) => {
        console.log(`  - ${c.name}: ${JSON.stringify(c.activities)}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

debugCommunities();
