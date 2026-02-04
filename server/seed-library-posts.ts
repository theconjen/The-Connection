/**
 * Seed Library Posts
 *
 * Populates the qaAreas, qaTags, and qaLibraryPosts tables with
 * curated apologetics and polemics content.
 *
 * Run with: npx tsx server/seed-library-posts.ts
 */

import { db } from './db';
import { qaAreas, qaTags, qaLibraryPosts } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { ALL_LIBRARY_POSTS, AREA_DEFINITIONS, type LibraryPostSeed } from './data/apologetics-library-content';

// Connection Research Team user ID
const AUTHOR_USER_ID = 19;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function upsertArea(domain: string, name: string, order: number) {
  const slug = slugify(name);

  const existing = await db
    .select()
    .from(qaAreas)
    .where(and(eq(qaAreas.domain, domain), eq(qaAreas.slug, slug)))
    .limit(1);

  if (existing.length) {
    console.info(`  Area exists: ${domain}/${name} (id=${existing[0].id})`);
    return existing[0];
  }

  const [inserted] = await db
    .insert(qaAreas)
    .values({ domain, name, slug, order } as any)
    .returning();

  console.info(`  Created area: ${domain}/${name} (id=${inserted.id})`);
  return inserted;
}

async function upsertTag(areaId: number, name: string, order: number) {
  const slug = slugify(name);

  const existing = await db
    .select()
    .from(qaTags)
    .where(and(eq(qaTags.areaId, areaId), eq(qaTags.slug, slug)))
    .limit(1);

  if (existing.length) {
    console.info(`  Tag exists: ${name} (id=${existing[0].id})`);
    return existing[0];
  }

  const [inserted] = await db
    .insert(qaTags)
    .values({ areaId, name, slug, order } as any)
    .returning();

  console.info(`  Created tag: ${name} (id=${inserted.id})`);
  return inserted;
}

// Cache for areas and tags to avoid repeated lookups
const areaCache = new Map<string, any>();
const tagCache = new Map<string, any>();

async function seedPost(post: LibraryPostSeed) {
  // Get or create area
  const areaKey = `${post.domain}:${post.areaName}`;
  let area = areaCache.get(areaKey);
  if (!area) {
    const areaDef = AREA_DEFINITIONS.find(
      (a) => a.domain === post.domain && a.name === post.areaName
    );
    area = await upsertArea(post.domain, post.areaName, areaDef?.order ?? 0);
    areaCache.set(areaKey, area);
  }

  // Get or create tag
  const tagKey = `${area.id}:${post.tagName}`;
  let tag = tagCache.get(tagKey);
  if (!tag) {
    tag = await upsertTag(area.id, post.tagName, 0);
    tagCache.set(tagKey, tag);
  }

  // Check if post already exists (by title + domain)
  const existing = await db
    .select()
    .from(qaLibraryPosts)
    .where(and(
      eq(qaLibraryPosts.domain, post.domain),
      eq(qaLibraryPosts.title, post.title),
    ))
    .limit(1);

  if (existing.length) {
    console.info(`  Post exists: "${post.title}" (id=${existing[0].id})`);
    return existing[0];
  }

  const now = new Date();
  const [inserted] = await db
    .insert(qaLibraryPosts)
    .values({
      domain: post.domain,
      areaId: area.id,
      tagId: tag.id,
      title: post.title,
      summary: post.tldr,
      tldr: post.tldr,
      keyPoints: JSON.stringify(post.keyPoints),
      scriptureRefs: JSON.stringify(post.scriptureRefs),
      bodyMarkdown: post.bodyMarkdown,
      perspectives: post.perspectives,
      sources: JSON.stringify(post.sources),
      authorUserId: AUTHOR_USER_ID,
      authorDisplayName: 'Connection Research Team',
      status: 'published',
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    } as any)
    .returning();

  console.info(`  Published: "${post.title}" (id=${inserted.id})`);
  return inserted;
}

async function main() {
  console.info('='.repeat(60));
  console.info('Seeding Apologetics & Polemics Library Posts');
  console.info('='.repeat(60));
  console.info(`Total posts to seed: ${ALL_LIBRARY_POSTS.length}\n`);

  // Seed all areas first
  console.info('--- Creating Areas ---');
  for (const areaDef of AREA_DEFINITIONS) {
    const area = await upsertArea(areaDef.domain, areaDef.name, areaDef.order);
    areaCache.set(`${areaDef.domain}:${areaDef.name}`, area);
  }

  // Seed all posts
  console.info('\n--- Creating Library Posts ---');
  let created = 0;
  let skipped = 0;

  for (const post of ALL_LIBRARY_POSTS) {
    try {
      const existing = await db
        .select()
        .from(qaLibraryPosts)
        .where(and(
          eq(qaLibraryPosts.domain, post.domain),
          eq(qaLibraryPosts.title, post.title),
        ))
        .limit(1);

      if (existing.length) {
        console.info(`  Skipped (exists): "${post.title}"`);
        skipped++;
        continue;
      }

      await seedPost(post);
      created++;
    } catch (error) {
      console.error(`  Failed: "${post.title}"`, error);
    }
  }

  console.info('\n' + '='.repeat(60));
  console.info(`Done! Created: ${created}, Skipped: ${skipped}, Total: ${ALL_LIBRARY_POSTS.length}`);
  console.info('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
