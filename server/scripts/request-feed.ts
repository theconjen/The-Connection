import request from 'supertest';
import app from '../test-app';
import { storage } from '../storage-optimized';

async function main() {
  process.env.NODE_ENV = 'test';

  const posts = Array.from({ length: 55 }).map((_, i) => ({
    id: String(i + 1),
    title: `Post ${i + 1}`,
    body: `Body ${i + 1}`,
    createdAt: new Date(Date.now() - i * 1000).toISOString(),
    authorId: 1,
  }));

  (storage as any).getAllPosts = async () => posts;
  (storage as any).getBlockedUserIdsFor = async () => [];

  const res = await request(app).get('/api/feed');
   ? res.body.items.length : 'not-array');
   ? res.body.items.slice(0,5).map((p:any)=>p.id) : null);
}

main().catch(e=>{ console.error(e); process.exit(1); });
