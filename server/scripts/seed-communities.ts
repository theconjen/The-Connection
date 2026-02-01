/**
 * Seed 52 Communities for Discovery
 *
 * Creates diverse communities across categories:
 * - Life Stages (12)
 * - Ministry & Interest (15)
 * - Profession-Based (10)
 * - Interest/Hobby (10)
 * - Location-Based (5)
 *
 * Run: npx tsx server/scripts/seed-communities.ts
 * Clear + Seed: npx tsx server/scripts/seed-communities.ts --clear
 */

import 'dotenv/config';
import { db } from '../db';
import { communities, communityMembers, users } from '@shared/schema';
import { eq, sql, inArray } from 'drizzle-orm';

// ============================================================================
// COMMUNITY DEFINITIONS
// ============================================================================

interface CommunityDef {
  name: string;
  slug: string;
  description: string;
  iconName: string;
  iconColor: string;
  ageGroup?: string;
  gender?: string;
  ministryTypes?: string[];
  lifeStages?: string[];
  activities?: string[];
  professions?: string[];
  interestTags?: string[];
  isLocalCommunity?: boolean;
  city?: string;
  state?: string;
}

// Ionicons names that exist and look good
const ICONS = {
  people: 'people',
  heart: 'heart',
  book: 'book',
  musical_notes: 'musical-notes',
  globe: 'globe',
  briefcase: 'briefcase',
  school: 'school',
  home: 'home',
  leaf: 'leaf',
  fitness: 'fitness',
  airplane: 'airplane',
  cafe: 'cafe',
  game_controller: 'game-controller',
  paw: 'paw',
  hammer: 'hammer',
  medical: 'medkit',
  shield: 'shield',
  ribbon: 'ribbon',
  sparkles: 'sparkles',
  hand_left: 'hand-left',
  megaphone: 'megaphone',
  create: 'create',
  flame: 'flame',
  flower: 'flower',
  bicycle: 'bicycle',
  camera: 'camera',
  color_palette: 'color-palette',
  star: 'star',
  chatbubbles: 'chatbubbles',
  calendar: 'calendar',
  location: 'location',
};

// Earthy, warm colors that fit the app aesthetic
const COLORS = {
  sage: '#5C6B5E',
  terracotta: '#B56A55',
  plum: '#7C6B78',
  ocean: '#4A7C7E',
  gold: '#B5954C',
  forest: '#4A6741',
  clay: '#9C7A6B',
  slate: '#5A6A7A',
  rose: '#9C6B7A',
  moss: '#7C8F78',
};

// ============================================================================
// LIFE STAGES (12 communities)
// ============================================================================

const lifeStagesCommunities: CommunityDef[] = [
  {
    name: 'College & Young Professionals',
    slug: 'college-young-professionals',
    description: 'Navigating faith, career, and relationships in your 20s. Finding community during this pivotal season of life.',
    iconName: ICONS.school,
    iconColor: COLORS.ocean,
    ageGroup: 'Young Adult',
    lifeStages: ['College Students', 'Young Professionals'],
    interestTags: ['career', 'dating', 'purpose', 'community'],
  },
  {
    name: 'Newlyweds',
    slug: 'newlyweds',
    description: 'The first five years of marriage - navigating life as a team. Share tips, struggles, and encouragement.',
    iconName: ICONS.heart,
    iconColor: COLORS.rose,
    lifeStages: ['Newlyweds'],
    interestTags: ['marriage', 'communication', 'finances', 'in-laws'],
  },
  {
    name: 'New Parents',
    slug: 'new-parents',
    description: 'Surviving (and thriving in) the baby and toddler years. Sleep-deprived parents unite!',
    iconName: ICONS.home,
    iconColor: COLORS.sage,
    lifeStages: ['New Parents'],
    interestTags: ['parenting', 'babies', 'toddlers', 'sleep'],
  },
  {
    name: 'Homeschool Families',
    slug: 'homeschool-families',
    description: 'Curriculum tips, encouragement, and community for families educating at home.',
    iconName: ICONS.book,
    iconColor: COLORS.forest,
    lifeStages: ['Parents'],
    activities: ['Homeschooling'],
    interestTags: ['homeschool', 'curriculum', 'education', 'family'],
  },
  {
    name: 'Empty Nesters',
    slug: 'empty-nesters',
    description: 'Rediscovering purpose and marriage after the kids leave home. A new chapter awaits!',
    iconName: ICONS.leaf,
    iconColor: COLORS.gold,
    ageGroup: 'Adult',
    lifeStages: ['Empty Nesters'],
    interestTags: ['transition', 'marriage', 'purpose', 'retirement'],
  },
  {
    name: 'Single Parents',
    slug: 'single-parents',
    description: 'Strength, support, and practical help for those parenting solo. You are not alone.',
    iconName: ICONS.star,
    iconColor: COLORS.terracotta,
    lifeStages: ['Single Parents'],
    interestTags: ['parenting', 'support', 'resources', 'community'],
  },
  {
    name: 'Widowed & Widowers',
    slug: 'widowed',
    description: 'A safe space for those who\'ve lost a spouse. Grief, healing, and finding hope together.',
    iconName: ICONS.heart,
    iconColor: COLORS.plum,
    lifeStages: ['Widowed'],
    interestTags: ['grief', 'healing', 'support', 'hope'],
  },
  {
    name: 'Singles Over 30',
    slug: 'singles-over-30',
    description: 'Faithful, fulfilled, and still waiting. Community for Christian singles navigating life after 30.',
    iconName: ICONS.sparkles,
    iconColor: COLORS.ocean,
    lifeStages: ['Singles'],
    ageGroup: 'Adult',
    interestTags: ['singleness', 'contentment', 'dating', 'community'],
  },
  {
    name: 'Young Adults (18-25)',
    slug: 'young-adults',
    description: 'Faith formation during the transitional years. College, first jobs, and finding your way.',
    iconName: ICONS.flame,
    iconColor: COLORS.terracotta,
    ageGroup: 'Young Adult',
    interestTags: ['identity', 'purpose', 'community', 'growth'],
  },
  {
    name: 'Military Families',
    slug: 'military-families',
    description: 'Deployments, relocations, and faith on the move. Supporting those who serve.',
    iconName: ICONS.shield,
    iconColor: COLORS.slate,
    lifeStages: ['Military'],
    interestTags: ['military', 'deployment', 'moves', 'support'],
  },
  {
    name: 'Blended Families',
    slug: 'blended-families',
    description: 'Navigating step-parenting, co-parenting, and creating new family rhythms.',
    iconName: ICONS.people,
    iconColor: COLORS.sage,
    lifeStages: ['Blended Families'],
    interestTags: ['stepparenting', 'coparenting', 'family', 'unity'],
  },
  {
    name: 'Retirement & Beyond',
    slug: 'retirement-beyond',
    description: 'Purpose, service, and faith in the golden years. Your best chapters may be ahead!',
    iconName: ICONS.flower,
    iconColor: COLORS.gold,
    ageGroup: 'Seniors',
    lifeStages: ['Retirees'],
    interestTags: ['retirement', 'purpose', 'legacy', 'grandparenting'],
  },
];

// ============================================================================
// MINISTRY & INTEREST (15 communities)
// ============================================================================

const ministryCommunities: CommunityDef[] = [
  {
    name: 'Worship Leaders & Musicians',
    slug: 'worship-leaders',
    description: 'For those leading worship, playing instruments, or serving on worship teams.',
    iconName: ICONS.musical_notes,
    iconColor: COLORS.plum,
    ministryTypes: ['Worship'],
    interestTags: ['worship', 'music', 'leading', 'songwriting'],
  },
  {
    name: 'Bible Study Enthusiasts',
    slug: 'bible-study',
    description: 'Deep dives into Scripture. Exegesis, hermeneutics, and loving the Word together.',
    iconName: ICONS.book,
    iconColor: COLORS.forest,
    ministryTypes: ['Bible Study'],
    interestTags: ['bible', 'study', 'theology', 'scripture'],
  },
  {
    name: 'Prayer Warriors',
    slug: 'prayer-warriors',
    description: 'Intercessors united. Prayer requests, testimonies, and growing in prayer.',
    iconName: ICONS.hand_left,
    iconColor: COLORS.ocean,
    ministryTypes: ['Prayer'],
    interestTags: ['prayer', 'intercession', 'spiritual-warfare', 'fasting'],
  },
  {
    name: 'Apologetics & Theology',
    slug: 'apologetics-theology',
    description: 'Defending the faith and diving deep into doctrine. Thoughtful discussion welcome.',
    iconName: ICONS.chatbubbles,
    iconColor: COLORS.slate,
    ministryTypes: ['Apologetics'],
    interestTags: ['apologetics', 'theology', 'doctrine', 'philosophy'],
  },
  {
    name: 'Missions & Outreach',
    slug: 'missions-outreach',
    description: 'Local and global missions. Sharing the gospel and serving communities worldwide.',
    iconName: ICONS.globe,
    iconColor: COLORS.terracotta,
    ministryTypes: ['Missions'],
    interestTags: ['missions', 'evangelism', 'outreach', 'serving'],
  },
  {
    name: 'Church Planters',
    slug: 'church-planters',
    description: 'Starting new churches and faith communities. The joys and struggles of planting.',
    iconName: ICONS.leaf,
    iconColor: COLORS.moss,
    ministryTypes: ['Church Planting'],
    interestTags: ['church-planting', 'leadership', 'vision', 'multiplication'],
  },
  {
    name: 'Youth Ministry',
    slug: 'youth-ministry',
    description: 'Reaching and discipling the next generation. Resources, ideas, and encouragement.',
    iconName: ICONS.flame,
    iconColor: COLORS.terracotta,
    ministryTypes: ['Youth Ministry'],
    interestTags: ['youth', 'teenagers', 'discipleship', 'games'],
  },
  {
    name: "Women's Ministry",
    slug: 'womens-ministry',
    description: 'Sisters in Christ growing together. Bible study, mentorship, and authentic community.',
    iconName: ICONS.flower,
    iconColor: COLORS.rose,
    gender: "Women's Only",
    ministryTypes: ['Women'],
    interestTags: ['women', 'sisterhood', 'mentorship', 'growth'],
  },
  {
    name: "Men's Ministry",
    slug: 'mens-ministry',
    description: 'Iron sharpening iron. Brotherhood, accountability, and becoming godly men.',
    iconName: ICONS.shield,
    iconColor: COLORS.slate,
    gender: "Men's Only",
    ministryTypes: ['Men'],
    interestTags: ['men', 'brotherhood', 'accountability', 'leadership'],
  },
  {
    name: 'Small Group Leaders',
    slug: 'small-group-leaders',
    description: 'Tips, resources, and support for those leading community groups.',
    iconName: ICONS.people,
    iconColor: COLORS.sage,
    ministryTypes: ['Small Groups'],
    interestTags: ['small-groups', 'facilitation', 'community', 'discipleship'],
  },
  {
    name: 'Marriage Enrichment',
    slug: 'marriage-enrichment',
    description: 'Strengthening marriages through intentionality. Date ideas, resources, and real talk.',
    iconName: ICONS.heart,
    iconColor: COLORS.rose,
    ministryTypes: ['Marriage'],
    interestTags: ['marriage', 'date-nights', 'communication', 'intimacy'],
  },
  {
    name: 'Grief Support',
    slug: 'grief-support',
    description: 'Walking through loss together. A safe space for those grieving any kind of loss.',
    iconName: ICONS.heart,
    iconColor: COLORS.plum,
    recoverySupport: ['Grief Support'],
    interestTags: ['grief', 'loss', 'healing', 'support'],
  },
  {
    name: 'Recovery & Freedom',
    slug: 'recovery-freedom',
    description: 'Breaking free from addiction and destructive patterns. Grace-filled support.',
    iconName: ICONS.ribbon,
    iconColor: COLORS.ocean,
    recoverySupport: ['Addiction Recovery'],
    interestTags: ['recovery', 'addiction', 'freedom', 'sobriety'],
  },
  {
    name: 'Pro-Life Advocates',
    slug: 'pro-life',
    description: 'Defending life from conception to natural death. Resources, advocacy, and support.',
    iconName: ICONS.heart,
    iconColor: COLORS.terracotta,
    interestTags: ['pro-life', 'advocacy', 'pregnancy', 'adoption'],
  },
  {
    name: 'Christian Creatives',
    slug: 'christian-creatives',
    description: 'Writers, artists, designers, and creatives using gifts for the Kingdom.',
    iconName: ICONS.color_palette,
    iconColor: COLORS.plum,
    activities: ['Arts'],
    interestTags: ['creativity', 'art', 'writing', 'design'],
  },
];

// ============================================================================
// PROFESSION-BASED (10 communities)
// ============================================================================

const professionCommunities: CommunityDef[] = [
  {
    name: 'Healthcare Workers',
    slug: 'healthcare-workers',
    description: 'Doctors, nurses, and medical professionals navigating faith at work.',
    iconName: ICONS.medical,
    iconColor: COLORS.ocean,
    professions: ['Healthcare'],
    interestTags: ['healthcare', 'nursing', 'doctors', 'ethics'],
  },
  {
    name: 'Teachers & Educators',
    slug: 'teachers-educators',
    description: 'Shaping minds and hearts. Christian educators in public and private settings.',
    iconName: ICONS.school,
    iconColor: COLORS.forest,
    professions: ['Education'],
    interestTags: ['teaching', 'education', 'students', 'influence'],
  },
  {
    name: 'First Responders',
    slug: 'first-responders',
    description: 'Police, fire, EMT, and emergency personnel. Serving on the front lines.',
    iconName: ICONS.shield,
    iconColor: COLORS.slate,
    professions: ['First Responders'],
    interestTags: ['police', 'fire', 'emt', 'service'],
  },
  {
    name: 'Entrepreneurs & Business',
    slug: 'entrepreneurs-business',
    description: 'Building businesses with Kingdom values. Ethics, leadership, and stewardship.',
    iconName: ICONS.briefcase,
    iconColor: COLORS.gold,
    professions: ['Business'],
    interestTags: ['business', 'entrepreneur', 'leadership', 'ethics'],
  },
  {
    name: 'Tech Industry',
    slug: 'tech-industry',
    description: 'Faith in Silicon Valley and beyond. Engineers, developers, and tech professionals.',
    iconName: ICONS.sparkles,
    iconColor: COLORS.ocean,
    professions: ['Technology'],
    interestTags: ['tech', 'software', 'ai', 'ethics'],
  },
  {
    name: 'Stay-at-Home Parents',
    slug: 'stay-at-home-parents',
    description: 'The rewarding (and exhausting) work of being home with kids.',
    iconName: ICONS.home,
    iconColor: COLORS.sage,
    professions: ['Stay at Home'],
    interestTags: ['parenting', 'home', 'kids', 'purpose'],
  },
  {
    name: 'Trades & Blue Collar',
    slug: 'trades-blue-collar',
    description: 'Carpenters, electricians, mechanics, and skilled workers building with integrity.',
    iconName: ICONS.hammer,
    iconColor: COLORS.clay,
    professions: ['Blue Collar'],
    interestTags: ['trades', 'work', 'craftsmanship', 'integrity'],
  },
  {
    name: 'Legal Professionals',
    slug: 'legal-professionals',
    description: 'Lawyers, paralegals, and legal professionals pursuing justice faithfully.',
    iconName: ICONS.briefcase,
    iconColor: COLORS.slate,
    professions: ['Legal'],
    interestTags: ['law', 'justice', 'ethics', 'advocacy'],
  },
  {
    name: 'Finance & Accounting',
    slug: 'finance-accounting',
    description: 'Stewarding money with integrity. Christian finance professionals.',
    iconName: ICONS.briefcase,
    iconColor: COLORS.gold,
    professions: ['Finance'],
    interestTags: ['finance', 'accounting', 'stewardship', 'ethics'],
  },
  {
    name: 'Pastors & Ministry Staff',
    slug: 'pastors-ministry-staff',
    description: 'Peer support for those in vocational ministry. The joys and challenges of the call.',
    iconName: ICONS.megaphone,
    iconColor: COLORS.terracotta,
    professions: ['Ministry'],
    interestTags: ['pastor', 'ministry', 'preaching', 'leadership'],
  },
];

// ============================================================================
// INTEREST/HOBBY (10 communities)
// ============================================================================

const hobbyCommunities: CommunityDef[] = [
  {
    name: 'Christian Book Club',
    slug: 'christian-book-club',
    description: 'Reading and discussing books that grow our faith. Join the conversation!',
    iconName: ICONS.book,
    iconColor: COLORS.forest,
    activities: ['Reading'],
    interestTags: ['books', 'reading', 'discussion', 'growth'],
  },
  {
    name: 'Outdoor Adventures',
    slug: 'outdoor-adventures',
    description: 'Hiking, camping, and enjoying creation together. Get outside!',
    iconName: ICONS.leaf,
    iconColor: COLORS.moss,
    activities: ['Outdoors', 'Hiking'],
    interestTags: ['hiking', 'camping', 'nature', 'adventure'],
  },
  {
    name: 'Fitness & Wellness',
    slug: 'fitness-wellness',
    description: 'Honoring God with our bodies. Running, lifting, and healthy living.',
    iconName: ICONS.fitness,
    iconColor: COLORS.terracotta,
    activities: ['Sports', 'Fitness'],
    interestTags: ['fitness', 'running', 'health', 'wellness'],
  },
  {
    name: 'Sports Fans',
    slug: 'sports-fans',
    description: 'Game day chat, fantasy leagues, and fellowship around sports.',
    iconName: ICONS.star,
    iconColor: COLORS.ocean,
    activities: ['Sports'],
    interestTags: ['sports', 'football', 'basketball', 'baseball'],
  },
  {
    name: 'Foodies & Fellowship',
    slug: 'foodies-fellowship',
    description: 'Breaking bread together. Recipes, restaurant recommendations, and hospitality.',
    iconName: ICONS.cafe,
    iconColor: COLORS.clay,
    activities: ['Food'],
    interestTags: ['food', 'cooking', 'hospitality', 'fellowship'],
  },
  {
    name: 'Gardening & Homesteading',
    slug: 'gardening-homesteading',
    description: 'Growing food, tending gardens, and living closer to the land.',
    iconName: ICONS.flower,
    iconColor: COLORS.moss,
    activities: ['Gardening'],
    interestTags: ['gardening', 'homesteading', 'sustainability', 'nature'],
  },
  {
    name: 'Travel & Missions Trips',
    slug: 'travel-missions',
    description: 'Seeing the world and serving along the way. Tips, stories, and trip planning.',
    iconName: ICONS.airplane,
    iconColor: COLORS.ocean,
    activities: ['Travel'],
    interestTags: ['travel', 'missions', 'adventure', 'culture'],
  },
  {
    name: 'DIY & Home Projects',
    slug: 'diy-home-projects',
    description: 'Building, fixing, and creating. Share your projects and get advice.',
    iconName: ICONS.hammer,
    iconColor: COLORS.clay,
    activities: ['DIY'],
    interestTags: ['diy', 'home', 'projects', 'crafts'],
  },
  {
    name: 'Gaming Community',
    slug: 'gaming-community',
    description: 'Christian gamers unite! Video games, board games, and tabletop fun.',
    iconName: ICONS.game_controller,
    iconColor: COLORS.plum,
    activities: ['Gaming'],
    interestTags: ['gaming', 'video-games', 'board-games', 'community'],
  },
  {
    name: 'Pet Lovers',
    slug: 'pet-lovers',
    description: 'Celebrating our furry (and scaly) friends. Pet pics welcome!',
    iconName: ICONS.paw,
    iconColor: COLORS.sage,
    activities: ['Pets'],
    interestTags: ['pets', 'dogs', 'cats', 'animals'],
  },
];

// ============================================================================
// LOCATION-BASED (5 communities)
// ============================================================================

const locationCommunities: CommunityDef[] = [
  {
    name: 'Dallas/Fort Worth Christians',
    slug: 'dfw-christians',
    description: 'Connecting believers in the DFW metroplex. Local events, churches, and community.',
    iconName: ICONS.location,
    iconColor: COLORS.terracotta,
    isLocalCommunity: true,
    city: 'Dallas',
    state: 'TX',
    interestTags: ['dallas', 'fort-worth', 'local', 'texas'],
  },
  {
    name: 'Austin Faith Community',
    slug: 'austin-faith',
    description: 'Keep Austin weird and faithful. Connecting Christians in the capital city.',
    iconName: ICONS.location,
    iconColor: COLORS.moss,
    isLocalCommunity: true,
    city: 'Austin',
    state: 'TX',
    interestTags: ['austin', 'local', 'texas', 'community'],
  },
  {
    name: 'Houston Believers',
    slug: 'houston-believers',
    description: 'H-Town Christians connecting. Churches, events, and fellowship.',
    iconName: ICONS.location,
    iconColor: COLORS.ocean,
    isLocalCommunity: true,
    city: 'Houston',
    state: 'TX',
    interestTags: ['houston', 'local', 'texas', 'community'],
  },
  {
    name: 'San Antonio Christians',
    slug: 'san-antonio-christians',
    description: 'Believers in the Alamo City. Local church connections and community.',
    iconName: ICONS.location,
    iconColor: COLORS.clay,
    isLocalCommunity: true,
    city: 'San Antonio',
    state: 'TX',
    interestTags: ['san-antonio', 'local', 'texas', 'community'],
  },
  {
    name: 'Global Online Community',
    slug: 'global-online',
    description: 'For believers without a local community. Wherever you are, you belong here.',
    iconName: ICONS.globe,
    iconColor: COLORS.ocean,
    meetingType: 'Online',
    interestTags: ['online', 'global', 'international', 'remote'],
  },
];

// ============================================================================
// ALL COMMUNITIES
// ============================================================================

const ALL_COMMUNITIES: CommunityDef[] = [
  ...lifeStagesCommunities,
  ...ministryCommunities,
  ...professionCommunities,
  ...hobbyCommunities,
  ...locationCommunities,
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function clearExistingCommunities() {
  console.info('🗑️  Clearing existing communities...');

  // First delete community members
  await db.delete(communityMembers);
  console.info('   Deleted community members');

  // Then delete communities
  await db.delete(communities);
  console.info('   Deleted communities');

  console.info('✅ Cleared existing communities\n');
}

async function seedCommunities() {
  console.info('🌱 Seeding communities...\n');

  let created = 0;

  for (const comm of ALL_COMMUNITIES) {
    try {
      // Create the community using raw SQL to avoid schema mismatch
      const result = await db.execute(sql`
        INSERT INTO communities (
          name,
          slug,
          description,
          icon_name,
          icon_color,
          age_group,
          gender,
          ministry_types,
          life_stages,
          activities,
          professions,
          interest_tags,
          is_local_community,
          city,
          state,
          member_count,
          is_private,
          has_private_wall,
          has_public_wall
        ) VALUES (
          ${comm.name},
          ${comm.slug},
          ${comm.description},
          ${comm.iconName},
          ${comm.iconColor},
          ${comm.ageGroup || null},
          ${comm.gender || null},
          ${comm.ministryTypes ? `{${comm.ministryTypes.join(',')}}` : null}::text[],
          ${comm.lifeStages ? `{${comm.lifeStages.join(',')}}` : null}::text[],
          ${comm.activities ? `{${comm.activities.join(',')}}` : null}::text[],
          ${comm.professions ? `{${comm.professions.join(',')}}` : null}::text[],
          ${comm.interestTags ? `{${comm.interestTags.join(',')}}` : null}::text[],
          ${comm.isLocalCommunity || false},
          ${comm.city || null},
          ${comm.state || null},
          0,
          false,
          false,
          true
        )
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `);

      if (!result.rows || result.rows.length === 0) {
        console.info(`⏭️  Skipped (already exists): ${comm.name}`);
        continue;
      }

      const newCommunity = result.rows[0] as { id: number };
      created++;
      console.info(`✅ Created: ${comm.name}`);

      // NOTE: We do NOT auto-assign users to communities
      // Users should join communities voluntarily

    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        console.info(`⏭️  Skipped (already exists): ${comm.name}`);
      } else {
        console.error(`❌ Error creating ${comm.name}:`, error.message);
      }
    }
  }

  console.info('\n' + '='.repeat(50));
  console.info('✨ Seeding Complete!');
  console.info('='.repeat(50));
  console.info(`📦 Communities created: ${created}`);
  console.info('='.repeat(50) + '\n');
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  console.info('\n📊 Community Seeding Script');
  console.info(`   Total communities to create: ${ALL_COMMUNITIES.length}`);
  console.info(`   - Life Stages: ${lifeStagesCommunities.length}`);
  console.info(`   - Ministry & Interest: ${ministryCommunities.length}`);
  console.info(`   - Profession-Based: ${professionCommunities.length}`);
  console.info(`   - Interest/Hobby: ${hobbyCommunities.length}`);
  console.info(`   - Location-Based: ${locationCommunities.length}`);
  console.info('');

  if (shouldClear) {
    await clearExistingCommunities();
  }

  await seedCommunities();

  console.info('🎉 Done!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
