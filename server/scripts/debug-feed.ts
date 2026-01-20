import request from 'supertest';
import app from '../test-app';
import { storage } from '../storage-optimized';

async function debug() {
  // Provide deterministic posts
  const posts = Array.from({ length: 55 }).map((_, i) => ({
    id: String(i + 1),
    title: `Post ${i + 1}`,
    body: `Body ${i + 1}`,
    createdAt: new Date(Date.now() - i * 1000).toISOString(),
    authorId: 1,
  }));

  (storage as any).getAllPosts = async () => posts;
  (storage as any).getBlockedUserIdsFor = async () => [];

  let res = await request(app).get('/api/feed');
   ? res.body.items.length : 'legacy array');

  // traverse a few pages
  let page = res.body;
  for (let i = 0; i < 5; i++) {
    if (!page || !Array.isArray(page.items)) break;
    if (!page.nextCursor) break;
    const next = await request(app).get('/api/feed').query({ cursor: page.nextCursor });
    page = next.body;
  }
}

debug().catch((e) => { console.error(e); process.exit(1); });
