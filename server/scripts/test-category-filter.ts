import "dotenv/config";
import { storage } from '../storage-optimized';

async function testCategoryFilter() {
  console.log('🧪 Testing Category Filter Logic\n');

  try {
    const communities = await storage.getAllCommunities();
    console.log(`Total communities: ${communities.length}\n`);

    // Test case 1: Filter by "Hiking" category
    console.log('TEST 1: Filter by "Hiking" activity');
    console.log('======================================');

    const hikingCommunities = communities.filter((community: any) => {
      const fieldValue = community.activities;
      if (!fieldValue) return false;
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes('Hiking');
      }
      return fieldValue === 'Hiking';
    });

    console.log(`Found ${hikingCommunities.length} communities with "Hiking"`);
    hikingCommunities.forEach((c: any) => {
      console.log(`  ✓ ${c.name}`);
      console.log(`    Activities: ${JSON.stringify(c.activities)}`);
    });

    // Test case 2: Filter by "Bible Study" category
    console.log('\n\nTEST 2: Filter by "Bible Study" ministry type');
    console.log('===============================================');

    const bibleStudyCommunities = communities.filter((community: any) => {
      const fieldValue = community.ministryTypes;
      if (!fieldValue) return false;
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes('Bible Study');
      }
      return fieldValue === 'Bible Study';
    });

    console.log(`Found ${bibleStudyCommunities.length} communities with "Bible Study"`);
    bibleStudyCommunities.forEach((c: any) => {
      console.log(`  ✓ ${c.name}`);
      console.log(`    Ministry Types: ${JSON.stringify(c.ministryTypes)}`);
    });

    // Test case 3: Filter by "Arts & Crafts" category
    console.log('\n\nTEST 3: Filter by "Arts & Crafts" activity');
    console.log('===========================================');

    const artsCommunities = communities.filter((community: any) => {
      const fieldValue = community.activities;
      if (!fieldValue) return false;
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes('Arts & Crafts');
      }
      return fieldValue === 'Arts & Crafts';
    });

    console.log(`Found ${artsCommunities.length} communities with "Arts & Crafts"`);
    artsCommunities.forEach((c: any) => {
      console.log(`  ✓ ${c.name}`);
      console.log(`    Activities: ${JSON.stringify(c.activities)}`);
    });

    // Test case 4: Filter by "Service Projects" category
    console.log('\n\nTEST 4: Filter by "Service Projects" activity');
    console.log('===============================================');

    const serviceCommunities = communities.filter((community: any) => {
      const fieldValue = community.activities;
      if (!fieldValue) return false;
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes('Service Projects');
      }
      return fieldValue === 'Service Projects';
    });

    console.log(`Found ${serviceCommunities.length} communities with "Service Projects"`);
    serviceCommunities.forEach((c: any) => {
      console.log(`  ✓ ${c.name}`);
      console.log(`    Activities: ${JSON.stringify(c.activities)}`);
    });

    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('==========');
    console.log(`Total communities: ${communities.length}`);
    console.log(`With "Hiking": ${hikingCommunities.length}`);
    console.log(`With "Bible Study": ${bibleStudyCommunities.length}`);
    console.log(`With "Arts & Crafts": ${artsCommunities.length}`);
    console.log(`With "Service Projects": ${serviceCommunities.length}`);

    const communitiesWithData = communities.filter((c: any) =>
      c.activities || c.ministryTypes || c.professions || c.lifeStages
    );
    console.log(`\nCommunities with filter data: ${communitiesWithData.length} / ${communities.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

testCategoryFilter();
