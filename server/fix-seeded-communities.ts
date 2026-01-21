/**
 * Fix seeded communities:
 * 1. Update locations to Detroit, Michigan area
 * 2. Make sole members into owners
 *
 * Run: npx tsx server/fix-seeded-communities.ts
 */

import 'dotenv/config';
import { db } from './db';
import { communities, communityMembers } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';

// Detroit, Michigan coordinates
const DETROIT_LOCATIONS = [
  { city: 'Detroit', state: 'MI', lat: '42.3314', lng: '-83.0458' },
  { city: 'Ann Arbor', state: 'MI', lat: '42.2808', lng: '-83.7430' },
  { city: 'Royal Oak', state: 'MI', lat: '42.4895', lng: '-83.1446' },
  { city: 'Troy', state: 'MI', lat: '42.6064', lng: '-83.1497' },
  { city: 'Dearborn', state: 'MI', lat: '42.3223', lng: '-83.1763' },
  { city: 'Novi', state: 'MI', lat: '42.4801', lng: '-83.4755' },
  { city: 'Farmington Hills', state: 'MI', lat: '42.4850', lng: '-83.3771' },
  { city: 'Warren', state: 'MI', lat: '42.5145', lng: '-83.0147' },
  { city: 'Sterling Heights', state: 'MI', lat: '42.5803', lng: '-83.0302' },
  { city: 'Livonia', state: 'MI', lat: '42.3684', lng: '-83.3527' },
  { city: 'Canton', state: 'MI', lat: '42.3086', lng: '-83.4821' },
  { city: 'Southfield', state: 'MI', lat: '42.4734', lng: '-83.2219' },
  { city: 'Bloomfield Hills', state: 'MI', lat: '42.5839', lng: '-83.2455' },
  { city: 'Plymouth', state: 'MI', lat: '42.3714', lng: '-83.4702' },
  { city: 'Birmingham', state: 'MI', lat: '42.5467', lng: '-83.2114' },
  { city: 'Rochester Hills', state: 'MI', lat: '42.6584', lng: '-83.1499' },
];

// Seeded community slugs
const SEEDED_SLUGS = [
  'young-professionals-fellowship',
  'moms-in-faith',
  'downtown-worship-collective',
  'mens-early-morning-prayer',
  'college-career-bible-study',
  'seniors-walking-faith',
  'recovery-renewal',
  'outdoor-adventures-ministry',
  'tech-workers-bible-study',
  'singles-community',
  'healthcare-professionals-prayer',
  'global-missions-network',
  'young-married-couples',
  'first-responders-fellowship',
  'creative-arts-ministry',
  'high-school-youth-group',
];

async function updateLocations() {
  console.info('📍 Updating seeded community locations to Detroit, Michigan area...\n');

  const allCommunities = await db.select().from(communities);
  const seededCommunities = allCommunities.filter(c => SEEDED_SLUGS.includes(c.slug));

  let updated = 0;
  for (let i = 0; i < seededCommunities.length; i++) {
    const community = seededCommunities[i];
    const location = DETROIT_LOCATIONS[i % DETROIT_LOCATIONS.length];

    // Skip global/online communities (null location is intentional)
    if (community.slug === 'global-missions-network') {
      console.info(`⏭️  Skipped ${community.name} (global/online community)`);
      continue;
    }

    await db.update(communities)
      .set({
        city: location.city,
        state: location.state,
        latitude: location.lat,
        longitude: location.lng,
      })
      .where(eq(communities.id, community.id));

    console.info(`✅ ${community.name} → ${location.city}, ${location.state}`);
    updated++;
  }

  console.info(`\n✨ Updated ${updated} community locations to Detroit area.`);
}

async function fixSoleMemberOwnership() {
  console.info('\n👑 Fixing sole member ownership...\n');

  const allCommunities = await db.select().from(communities);
  const seededCommunities = allCommunities.filter(c => SEEDED_SLUGS.includes(c.slug));

  let fixed = 0;
  for (const community of seededCommunities) {
    const members = await db.select().from(communityMembers)
      .where(eq(communityMembers.communityId, community.id));

    if (members.length === 0) {
      // No members yet, skip
      continue;
    }

    const hasOwner = members.some(m => m.role === 'owner');

    if (!hasOwner && members.length === 1) {
      // Single member without owner - make them the owner
      const soleMember = members[0];
      await db.update(communityMembers)
        .set({ role: 'owner' })
        .where(and(
          eq(communityMembers.communityId, community.id),
          eq(communityMembers.userId, soleMember.userId)
        ));

      console.info(`✅ ${community.name}: User ${soleMember.userId} is now owner`);
      fixed++;
    } else if (!hasOwner && members.length > 1) {
      // Multiple members but no owner - make the first member owner
      const firstMember = members[0];
      await db.update(communityMembers)
        .set({ role: 'owner' })
        .where(and(
          eq(communityMembers.communityId, community.id),
          eq(communityMembers.userId, firstMember.userId)
        ));

      console.info(`✅ ${community.name}: User ${firstMember.userId} is now owner (first of ${members.length} members)`);
      fixed++;
    } else if (hasOwner) {
      console.info(`⏭️  ${community.name}: Already has an owner`);
    }
  }

  console.info(`\n✨ Fixed ownership for ${fixed} communities.`);
}

async function main() {
  try {
    await updateLocations();
    await fixSoleMemberOwnership();
    console.info('\n🎉 All fixes complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
