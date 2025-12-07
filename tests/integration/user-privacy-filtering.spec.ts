import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';

const fixtures = vi.hoisted(() => ({
  communities: [
    { id: 1, name: 'User One Community', userId: 1 },
    { id: 2, name: 'User Two Community', userId: 2 },
  ],
  posts: [
    { id: 10, content: 'User One Post', userId: 1, createdAt: new Date().toISOString() },
    { id: 11, content: 'User Two Post', userId: '2', createdAt: new Date().toISOString() },
  ],
  events: [
    { id: 20, title: 'User One Event', userId: 1, createdAt: new Date().toISOString() },
    { id: 21, title: 'User Two Event', userId: '2', createdAt: new Date().toISOString() },
  ],
}));

vi.mock('../../server/storage-optimized', () => {
  const storage = {
    getUserCommunities: vi.fn(async () => fixtures.communities),
    getUserPosts: vi.fn(async () => fixtures.posts),
    getUserEvents: vi.fn(async () => fixtures.events),
    getUserPrayerRequests: vi.fn(async () => []),
  } as const;

  return { storage };
});

import userRoutes from '../../server/routes/api/user';

describe('User data filtering by session user', () => {
  let app: express.Express;
  let agent: request.SuperTest<request.Test>;

  beforeEach(() => {
    fixtures.communities.splice(0, fixtures.communities.length,
      { id: 1, name: 'User One Community', userId: 1 },
      { id: 2, name: 'User Two Community', userId: 2 },
    );

    fixtures.posts.splice(0, fixtures.posts.length,
      { id: 10, content: 'User One Post', userId: 1, createdAt: new Date().toISOString() },
      { id: 11, content: 'User Two Post', userId: '2', createdAt: new Date().toISOString() },
    );

    fixtures.events.splice(0, fixtures.events.length,
      { id: 20, title: 'User One Event', userId: 1, createdAt: new Date().toISOString() },
      { id: 21, title: 'User Two Event', userId: '2', createdAt: new Date().toISOString() },
    );

    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));

    app.post('/test/login', (req, res) => {
      req.session.userId = req.body.userId;
      res.status(204).end();
    });

    app.use('/api/user', userRoutes);

    agent = request.agent(app);
  });

  const loginAs = async (userId: string | number) => {
    await agent.post('/test/login').send({ userId }).expect(204);
  };

  it('returns only the authenticated user\'s communities', async () => {
    await loginAs('1');

    const res = await agent.get('/api/user/communities').expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({ id: 1, name: 'User One Community', userId: 1 }),
    ]);
  });

  it('returns only the authenticated user\'s posts', async () => {
    await loginAs('1');

    const res = await agent.get('/api/user/posts').expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({ id: 10, content: 'User One Post', userId: 1 }),
    ]);
  });

  it('returns only the authenticated user\'s events', async () => {
    await loginAs('2');

    const res = await agent.get('/api/user/events').expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({ id: 21, title: 'User Two Event', userId: '2' }),
    ]);
  });
});
