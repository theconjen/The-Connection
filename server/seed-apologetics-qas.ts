/**
 * Seed 5 High-Quality Apologetics Q&A entries
 * Creates areas, tags, and sample Q&A data for the Apologetics screen
 */

import { db } from './db';
import {
  qaAreas,
  qaTags,
  userQuestions,
  questionAssignments,
  questionMessages,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Connection Research Team User ID (adjust if different in your DB)
const RESEARCH_TEAM_USER_ID = 19;

// Seed asker user ID (use same as research team for demo, or any existing user)
const SEED_ASKER_USER_ID = 19;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type SeedEntry = {
  areaName: string;
  tagName: string;
  title: string;
  questionBody?: string;
  answerBody: string;
};

const SEEDS: SeedEntry[] = [
  {
    areaName: 'Evidence',
    tagName: 'Manuscripts',
    title: 'How many New Testament manuscripts do we actually have?',
    answerBody: [
      'We currently possess over **5,800 Greek manuscripts** of the New Testament. When early translations (Latin, Syriac, Coptic, Armenian, Ethiopic) and citations from Church Fathers are included, the total rises to **approximately 25,000 textual witnesses**.',
      '',
      'This volume of manuscript evidence is unmatched among ancient historical documents and enables scholars to reconstruct the original text with a very high degree of confidence.',
      '',
      '### Sources',
      '- Bruce M. Metzger, *The Text of the New Testament* (Oxford University Press, 2005)',
      '- Daniel B. Wallace (ed.), *Revisiting the Corruption of the New Testament* (Kregel, 2011)',
      '- Philip Comfort, *Encountering the Manuscripts* (Broadman & Holman, 2005)',
      '',
      '### Perspectives',
      '- Catholic',
      '- Orthodox',
      '- Evangelical',
      '- Reformed',
    ].join('\n'),
  },
  {
    areaName: 'Evidence',
    tagName: 'Resurrection',
    title: 'Do historians outside the Bible affirm Jesus\' crucifixion?',
    answerBody: [
      'Yes. Jesus\' crucifixion is widely treated as a bedrock historical claim within professional scholarship. It is affirmed in the New Testament and also referenced in **non-Christian sources** (Roman and Jewish) that place Jesus\' execution under **Pontius Pilate**.',
      '',
      'Tacitus (early 2nd century) reports that Christus suffered the extreme penalty during Tiberius\' reign at the hands of Pontius Pilate. Josephus (1st century) also refers to Jesus\' execution.',
      '',
      '### Sources',
      '- Tacitus, *Annals* 15.44',
      '- Josephus, *Antiquities* 18.3',
      '- Bart D. Ehrman, *Did Jesus Exist?* (HarperOne, 2012)',
      '',
      '### Perspectives',
      '- Catholic',
      '- Orthodox',
      '- Evangelical',
      '- Secular historical scholarship',
    ].join('\n'),
  },
  {
    areaName: 'Philosophy',
    tagName: 'Problem of Evil',
    title: 'If God is good, why does evil exist?',
    answerBody: [
      'Christian thought typically distinguishes **moral evil** (human sin) from **natural evil** (suffering/disorder in creation). Scripture portrays evil not as something God "creates" as a good thing, but as rebellion and corruption within a created order that is, in itself, good.',
      '',
      'The Christian response is not only philosophical but also historical and theological: God enters human suffering in the incarnation, bears evil\'s weight in the crucifixion, and promises final justice and restoration rather than immediate elimination of all suffering in the present age.',
      '',
      '### Sources',
      '- Augustine, *Confessions*',
      '- Alvin Plantinga, *God, Freedom, and Evil* (Eerdmans, 1977)',
      '- N.T. Wright, *Evil and the Justice of God* (IVP, 2006)',
      '',
      '### Perspectives',
      '- Catholic',
      '- Orthodox',
      '- Reformed',
      '- Evangelical',
    ].join('\n'),
  },
  {
    areaName: 'Theology',
    tagName: 'Trinity',
    title: 'Is the doctrine of the Trinity found in the Bible, or was it invented later?',
    answerBody: [
      'The word "Trinity" does not appear in Scripture, but the **doctrine** is a synthesis of biblical claims: the Father is God, the Son is God, the Spirit is God, and God is one. Early church councils did not *invent* the doctrine; they clarified language to guard the church\'s confession against misunderstandings and heresies.',
      '',
      'In short: the conceptual content is rooted in the Bible; later creedal language formalized terminology to describe what the church believed Scripture taught.',
      '',
      '### Sources',
      '- Matthew 28:19',
      '- John 1:1–14',
      '- Athanasius, *On the Incarnation*',
      '- Michael W. Holmes (ed.), *The Apostolic Fathers* (Baker Academic)',
      '',
      '### Perspectives',
      '- Catholic',
      '- Orthodox',
      '- Evangelical',
      '- Reformed',
    ].join('\n'),
  },
  {
    areaName: 'Science',
    tagName: 'Faith and Science',
    title: 'Does modern science conflict with belief in God?',
    answerBody: [
      'Modern science primarily addresses **how** the natural world operates; classical theism addresses **why** there is something rather than nothing and why the universe is intelligible. Historically, many foundational contributors to modern science were theists who saw scientific inquiry as exploring an ordered creation.',
      '',
      'Within Christianity, there are multiple faithful views about creation\'s timeline and mechanisms, while maintaining that God is the ultimate source and sustainer of reality.',
      '',
      '### Sources',
      '- Francis S. Collins, *The Language of God* (Free Press, 2006)',
      '- Alister McGrath, *Science and Religion* (Wiley-Blackwell, 2010)',
      '- John Polkinghorne, *Belief in God in an Age of Science* (Yale University Press, 1998)',
      '',
      '### Perspectives',
      '- Catholic',
      '- Orthodox',
      '- Evangelical',
      '- Reformed',
    ].join('\n'),
  },
];

async function upsertArea(domain: string, name: string, sortOrder: number = 0) {
  const slug = slugify(name);

  const existing = await db
    .select()
    .from(qaAreas)
    .where(and(eq(qaAreas.domain, domain), eq(qaAreas.slug, slug)))
    .limit(1);

  if (existing.length) return existing[0];

  const [inserted] = await db
    .insert(qaAreas)
    .values({
      domain,
      name,
      slug,
      order: sortOrder,
    } as any)
    .returning();

  return inserted;
}

async function upsertTag(areaId: number, name: string, sortOrder: number = 0) {
  const slug = slugify(name);

  const existing = await db
    .select()
    .from(qaTags)
    .where(and(eq(qaTags.areaId, areaId), eq(qaTags.slug, slug)))
    .limit(1);

  if (existing.length) return existing[0];

  const [inserted] = await db
    .insert(qaTags)
    .values({
      areaId,
      name,
      slug,
      order: sortOrder,
    } as any)
    .returning();

  return inserted;
}

async function seedOne(entry: SeedEntry) {
  const domain = 'apologetics';

  // Create/get area and tag
  const area = await upsertArea(domain, entry.areaName);
  const tag = await upsertTag(area.id, entry.tagName);

  // Create the question
  const [question] = await db
    .insert(userQuestions)
    .values({
      askerUserId: SEED_ASKER_USER_ID,
      domain,
      areaId: area.id,
      tagId: tag.id,
      questionText: entry.title,
      status: 'new',
    } as any)
    .returning();

  // Assign to Connection Research Team
  const [assignment] = await db
    .insert(questionAssignments)
    .values({
      questionId: question.id,
      assignedToUserId: RESEARCH_TEAM_USER_ID,
      status: 'answered',
      assignedAt: new Date(),
      respondedAt: new Date(),
    } as any)
    .returning();

  // Create question message
  await db.insert(questionMessages).values({
    questionId: question.id,
    senderUserId: SEED_ASKER_USER_ID,
    body: entry.title + (entry.questionBody ? `\n\n${entry.questionBody}` : ''),
  } as any);

  // Create answer message
  await db.insert(questionMessages).values({
    questionId: question.id,
    senderUserId: RESEARCH_TEAM_USER_ID,
    body: entry.answerBody,
  } as any);

  return { questionId: question.id, assignmentId: assignment.id };
}

export async function seedApologeticsQAs() {
  console.info('🌱 Seeding Apologetics Q&A data...\n');

  for (const entry of SEEDS) {
    try {
      const result = await seedOne(entry);
      console.info(`✓ Seeded: "${entry.title}"`);
      console.info(`  Question ID: ${result.questionId}, Assignment ID: ${result.assignmentId}\n`);
    } catch (error) {
      console.error(`✗ Failed to seed: "${entry.title}"`, error);
    }
  }

  console.info('✅ Done seeding 5 apologetics Q&As.');
}

// Allow running directly if needed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedApologeticsQAs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed script failed:', err);
      process.exit(1);
    });
}
