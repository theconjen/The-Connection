/**
 * Seed Q&A Taxonomy - Areas and Tags for Apologetics/Polemics
 *
 * This seeds the qa_areas and qa_tags tables with the complete taxonomy
 * for the private Q&A inbox system.
 */

import { db } from './db';
import { qaAreas, qaTags } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface AreaSeed {
  domain: 'apologetics' | 'polemics';
  name: string;
  slug: string;
  description: string;
  order: number;
  tags: {
    name: string;
    slug: string;
    description: string;
    order: number;
  }[];
}

const taxonomyData: AreaSeed[] = [
  // ============================================================================
  // APOLOGETICS AREAS & TAGS
  // ============================================================================
  {
    domain: 'apologetics',
    name: 'Evidence',
    slug: 'evidence',
    description: 'Historical and archaeological evidence for Christianity',
    order: 1,
    tags: [
      { name: 'Manuscripts', slug: 'manuscripts', description: 'Biblical manuscript evidence', order: 1 },
      { name: 'Archaeology', slug: 'archaeology', description: 'Archaeological findings supporting biblical accounts', order: 2 },
      { name: 'Resurrection', slug: 'resurrection', description: 'Historical evidence for the resurrection of Jesus', order: 3 },
      { name: 'Old Testament Prophecy', slug: 'old-testament-prophecy', description: 'Messianic prophecies and their fulfillment', order: 4 },
      { name: 'Fulfilled Prophecy', slug: 'fulfilled-prophecy', description: 'Prophecies fulfilled in history', order: 5 },
      { name: 'Eyewitness Testimony', slug: 'eyewitness-testimony', description: 'Gospel eyewitness accounts', order: 6 },
    ],
  },
  {
    domain: 'apologetics',
    name: 'Theology',
    slug: 'theology',
    description: 'Core Christian doctrines and theological concepts',
    order: 2,
    tags: [
      { name: 'Trinity', slug: 'trinity', description: 'The doctrine of the Trinity', order: 1 },
      { name: 'Christology', slug: 'christology', description: 'The nature and person of Christ', order: 2 },
      { name: 'Soteriology', slug: 'soteriology', description: 'Doctrine of salvation', order: 3 },
      { name: 'Pneumatology', slug: 'pneumatology', description: 'Doctrine of the Holy Spirit', order: 4 },
      { name: 'Ecclesiology', slug: 'ecclesiology', description: 'Doctrine of the Church', order: 5 },
      { name: 'Eschatology', slug: 'eschatology', description: 'End times and future events', order: 6 },
      { name: 'Theistic Arguments', slug: 'theistic-arguments', description: 'Arguments for the existence of God', order: 7 },
    ],
  },
  {
    domain: 'apologetics',
    name: 'History',
    slug: 'history',
    description: 'Church history and historical Christianity',
    order: 3,
    tags: [
      { name: 'Early Church', slug: 'early-church', description: 'First centuries of Christianity', order: 1 },
      { name: 'Church Fathers', slug: 'church-fathers', description: 'Patristic writings and teachings', order: 2 },
      { name: 'Councils', slug: 'councils', description: 'Ecumenical councils and creeds', order: 3 },
      { name: 'Reformation', slug: 'reformation', description: 'Protestant Reformation history', order: 4 },
      { name: 'Canon Formation', slug: 'canon-formation', description: 'How the biblical canon was formed', order: 5 },
      { name: 'Historical Jesus', slug: 'historical-jesus', description: 'Historical evidence for Jesus of Nazareth', order: 6 },
    ],
  },
  {
    domain: 'apologetics',
    name: 'Objections',
    slug: 'objections',
    description: 'Common objections to Christianity',
    order: 4,
    tags: [
      { name: 'Problem of Evil', slug: 'problem-of-evil', description: 'Why does God allow suffering?', order: 1 },
      { name: 'Science vs Faith', slug: 'science-vs-faith', description: 'Perceived conflicts between science and Christianity', order: 2 },
      { name: 'Biblical Contradictions', slug: 'biblical-contradictions', description: 'Alleged contradictions in Scripture', order: 3 },
      { name: 'Textual Criticism', slug: 'textual-criticism', description: 'Questions about biblical manuscript transmission', order: 4 },
      { name: 'Moral Objections', slug: 'moral-objections', description: 'Moral and ethical objections to Christianity', order: 5 },
      { name: 'Other Religions', slug: 'other-religions', description: 'Pluralism and exclusive truth claims', order: 6 },
    ],
  },
  {
    domain: 'apologetics',
    name: 'Philosophy',
    slug: 'philosophy',
    description: 'Philosophical arguments and reasoning about God and faith',
    order: 5,
    tags: [
      { name: 'Problem of Evil', slug: 'problem-of-evil', description: 'Philosophical responses to suffering and evil', order: 1 },
      { name: 'Existence of God', slug: 'existence-of-god', description: 'Arguments for God\'s existence', order: 2 },
      { name: 'Moral Philosophy', slug: 'moral-philosophy', description: 'Ethics and moral foundations', order: 3 },
      { name: 'Epistemology', slug: 'epistemology', description: 'How we know what we know', order: 4 },
      { name: 'Free Will', slug: 'free-will', description: 'Human freedom and divine sovereignty', order: 5 },
    ],
  },
  {
    domain: 'apologetics',
    name: 'Science',
    slug: 'science',
    description: 'Exploring the relationship between science and Christian faith',
    order: 6,
    tags: [
      { name: 'Faith and Science', slug: 'faith-and-science', description: 'How faith and science relate', order: 1 },
      { name: 'Origins', slug: 'origins', description: 'Creation, evolution, and origins of life', order: 2 },
      { name: 'Cosmology', slug: 'cosmology', description: 'The origin and nature of the universe', order: 3 },
      { name: 'Miracles', slug: 'miracles', description: 'Scientific considerations of miraculous events', order: 4 },
      { name: 'Intelligent Design', slug: 'intelligent-design', description: 'Design arguments in nature', order: 5 },
    ],
  },
  {
    domain: 'apologetics',
    name: 'Perspectives',
    slug: 'perspectives',
    description: 'Different Christian traditions and viewpoints',
    order: 7,
    tags: [
      { name: 'Orthodox', slug: 'orthodox', description: 'Eastern Orthodox perspective', order: 1 },
      { name: 'Catholic', slug: 'catholic', description: 'Roman Catholic perspective', order: 2 },
      { name: 'Protestant', slug: 'protestant', description: 'Protestant perspective', order: 3 },
      { name: 'Reformed', slug: 'reformed', description: 'Reformed theology perspective', order: 4 },
      { name: 'Icons', slug: 'icons', description: 'Theology and use of icons', order: 5 },
      { name: 'Sacraments', slug: 'sacraments', description: 'Sacramental theology across traditions', order: 6 },
      { name: 'Mary', slug: 'mary', description: 'Mariology across traditions', order: 7 },
    ],
  },

  // ============================================================================
  // POLEMICS AREAS & TAGS
  // ============================================================================
  {
    domain: 'polemics',
    name: 'Evidence',
    slug: 'evidence',
    description: 'Examining claims and evidence of other worldviews',
    order: 1,
    tags: [
      { name: 'Islamic Claims', slug: 'islamic-claims', description: 'Examining Islamic historical and textual claims', order: 1 },
      { name: 'Mormon Claims', slug: 'mormon-claims', description: 'Examining LDS historical claims', order: 2 },
      { name: 'Atheist Arguments', slug: 'atheist-arguments', description: 'Responding to atheistic arguments', order: 3 },
      { name: 'Historical Reliability', slug: 'historical-reliability', description: 'Comparing historical reliability of religious texts', order: 4 },
    ],
  },
  {
    domain: 'polemics',
    name: 'Theology',
    slug: 'theology',
    description: 'Theological differences with other religions',
    order: 2,
    tags: [
      { name: 'Islamic Theology', slug: 'islamic-theology', description: 'Differences in core doctrines', order: 1 },
      { name: 'Mormon Theology', slug: 'mormon-theology', description: 'LDS doctrinal differences', order: 2 },
      { name: 'Jehovah\'s Witnesses', slug: 'jehovahs-witnesses', description: 'JW theological differences', order: 3 },
      { name: 'New Age', slug: 'new-age', description: 'New Age and Eastern religious concepts', order: 4 },
    ],
  },
  {
    domain: 'polemics',
    name: 'History',
    slug: 'history',
    description: 'Historical analysis of other religious movements',
    order: 3,
    tags: [
      { name: 'Origins of Islam', slug: 'origins-of-islam', description: 'Historical development of Islam', order: 1 },
      { name: 'Mormon History', slug: 'mormon-history', description: 'Historical examination of LDS church', order: 2 },
      { name: 'Cult Origins', slug: 'cult-origins', description: 'Historical origins of modern religious movements', order: 3 },
    ],
  },
  {
    domain: 'polemics',
    name: 'Objections',
    slug: 'objections',
    description: 'Addressing critiques from other worldviews',
    order: 4,
    tags: [
      { name: 'Quran vs Bible', slug: 'quran-vs-bible', description: 'Islamic critiques of the Bible', order: 1 },
      { name: 'Biblical Corruption', slug: 'biblical-corruption', description: 'Claims of biblical text corruption', order: 2 },
      { name: 'Trinity Objections', slug: 'trinity-objections', description: 'Non-Christian objections to Trinity', order: 3 },
      { name: 'Deity of Christ', slug: 'deity-of-christ', description: 'Objections to Christ\'s divinity', order: 4 },
    ],
  },
  {
    domain: 'polemics',
    name: 'Perspectives',
    slug: 'perspectives',
    description: 'Interfaith dialogue and understanding',
    order: 5,
    tags: [
      { name: 'Interfaith Dialogue', slug: 'interfaith-dialogue', description: 'Approaches to interfaith conversation', order: 1 },
      { name: 'Cultural Context', slug: 'cultural-context', description: 'Cultural considerations in dialogue', order: 2 },
      { name: 'Evangelism Strategy', slug: 'evangelism-strategy', description: 'Effective evangelism approaches', order: 3 },
    ],
  },
];

async function seedQaTaxonomy() {
  console.info('🌱 Starting Q&A taxonomy seed...');

  try {
    // Seed areas and tags
    for (const areaSeed of taxonomyData) {
      console.info(`\n📁 Seeding area: ${areaSeed.domain}/${areaSeed.name}`);

      // Check if area exists
      const existingArea = await db.select()
        .from(qaAreas)
        .where(and(
          eq(qaAreas.domain, areaSeed.domain),
          eq(qaAreas.slug, areaSeed.slug)
        ))
        .limit(1);

      let areaId: number;

      if (existingArea.length > 0) {
        console.info(`  ✓ Area already exists, using ID ${existingArea[0].id}`);
        areaId = existingArea[0].id;
      } else {
        const [newArea] = await db.insert(qaAreas)
          .values({
            domain: areaSeed.domain,
            name: areaSeed.name,
            slug: areaSeed.slug,
            description: areaSeed.description,
            order: areaSeed.order,
          } as any)
          .returning();

        console.info(`  ✓ Created area with ID ${newArea.id}`);
        areaId = newArea.id;
      }

      // Seed tags for this area
      console.info(`  📝 Seeding ${areaSeed.tags.length} tags...`);
      for (const tagSeed of areaSeed.tags) {
        const existingTag = await db.select()
          .from(qaTags)
          .where(and(
            eq(qaTags.areaId, areaId),
            eq(qaTags.slug, tagSeed.slug)
          ))
          .limit(1);

        if (existingTag.length > 0) {
          console.info(`    - ${tagSeed.name} (exists)`);
        } else {
          await db.insert(qaTags)
            .values({
              areaId,
              name: tagSeed.name,
              slug: tagSeed.slug,
              description: tagSeed.description,
              order: tagSeed.order,
            } as any);
          console.info(`    ✓ ${tagSeed.name}`);
        }
      }
    }

    console.info('\n✅ Q&A taxonomy seed completed successfully!');

    // Summary
    const areaCount = await db.select().from(qaAreas);
    const tagCount = await db.select().from(qaTags);
    console.info(`\n📊 Summary:`);
    console.info(`   - ${areaCount.length} areas`);
    console.info(`   - ${tagCount.length} tags`);

  } catch (error) {
    console.error('❌ Error seeding Q&A taxonomy:', error);
    throw error;
  }
}

// Run if called directly (ES module check)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedQaTaxonomy()
    .then(() => {
      console.info('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { seedQaTaxonomy };
