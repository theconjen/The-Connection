/**
 * Feed pagination tests (strict mode only).
 *
 * This suite now REQUIRES the paginated shape: { items, nextCursor }.
 * Any legacy array response will immediately fail the tests.
 *
 * Contract enforced:
 * - Initial request returns a PaginatedFeed object.
 * - Traversal follows nextCursor until null, with no duplicate IDs.
 * - Invalid cursor yields HTTP 400.
 */

import request from 'supertest';
// Use lightweight test app (no migrations, faster & deterministic)
import app from '../../server/test-app';
import { storage } from '../../server/storage-optimized';

type LegacyFeedItem = {
  id: string | number;
  title?: string;
  body?: string;
  createdAt?: string;
};

interface PaginatedFeed {
  items: LegacyFeedItem[];
  nextCursor: string | null;
}

// Always require pagination now; env flag retained only for future toggles.
const REQUIRE_PAGINATION = true;

// Provide deterministic posts so pagination traversal is stable.
beforeAll(() => {
  const posts = Array.from({ length: 55 }).map((_, i) => ({
    id: String(i + 1),
    title: `Post ${i + 1}`,
    body: `Body ${i + 1}`,
    createdAt: new Date(Date.now() - i * 1000).toISOString(),
    authorId: 1,
  }));
  // Newest-first assumption: storage.getAllPosts currently returns that; ensure same ordering.
  (storage as any).getAllPosts = async () => posts; // deterministic
  (storage as any).getBlockedUserIdsFor = async () => [];
});

describe('GET /api/feed pagination (strict)', () => {
  test('initial response returns paginated object', async () => {
    const res = await request(app).get('/api/feed').expect(200);
    if (Array.isArray(res.body)) {
      throw new Error('Expected paginated object but received legacy array feed response.');
    }
    assertPaginatedShape(res.body, 'first page');
  });

  test('full pagination traversal with no duplicate ids until end-of-feed', async () => {
    const first = await request(app).get('/api/feed').expect(200);
    if (Array.isArray(first.body)) {
      throw new Error('Expected paginated object but received legacy array feed response.');
    }

    const seenIds = new Set<string | number>();
    let page: PaginatedFeed = first.body;
    let safetyCounter = 0;

    while (true) {
      safetyCounter++;
      assertPaginatedShape(page, `page ${safetyCounter}`);
      for (const item of page.items) {
        const before = seenIds.size;
        seenIds.add(item.id);
        expect(seenIds.size).toBe(before + 1);
      }
      if (page.nextCursor == null) break;
      const nextRes = await request(app)
        .get('/api/feed')
        .query({ cursor: page.nextCursor })
        .expect(200);
      if (Array.isArray(nextRes.body)) {
        throw new Error('Received legacy array after initial paginated page.');
      }
      page = nextRes.body;
      if (safetyCounter > 50) {
        throw new Error('Pagination safety cap exceeded (possible infinite loop).');
      }
    }
    expect(seenIds.size).toBeGreaterThan(0);
  });

  test('invalid cursor yields 400', async () => {
    await request(app).get('/api/feed').query({ cursor: '___invalid___' }).expect(400);
  });
});

/* ----------------- Helpers ------------------ */

function assertPaginatedShape(body: any, label: string): asserts body is PaginatedFeed {
  expect(body).toBeInstanceOf(Object);
  expect(Array.isArray(body.items)).toBe(true);
  expect(body).toHaveProperty('nextCursor');
  for (const item of body.items) {
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('createdAt');
  }
}