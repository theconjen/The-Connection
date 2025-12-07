import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';

const fixtures = vi.hoisted(() => ({
  blocks: [] as Array<{ id: number; blockerId: number; blockedId: number; reason: string | null; createdAt: Date }>,
  users: [
    { id: 1, username: 'user1', password: 'secret' },
    { id: 2, username: 'user2', password: 'secret' },
  ],
  nextId: 1,
}));

vi.mock('../../server/storage-optimized', () => {
  const storage = {
    createUserBlock: vi.fn(async (block: any) => {
      const existing = fixtures.blocks.find(
        (b) => b.blockerId === block.blockerId && b.blockedId === block.blockedId,
      );
      if (existing) return existing;

      const record = {
        id: fixtures.nextId++,
        blockerId: block.blockerId,
        blockedId: block.blockedId,
        reason: block.reason ?? null,
        createdAt: new Date(),
      } as const;
      fixtures.blocks.push(record);
      return record;
    }),
    getBlockedUserIdsFor: vi.fn(async (blockerId: number) =>
      fixtures.blocks.filter((b) => b.blockerId === blockerId).map((b) => b.blockedId),
    ),
    removeUserBlock: vi.fn(async (blockerId: number, blockedId: number) => {
      const idx = fixtures.blocks.findIndex(
        (b) => b.blockerId === blockerId && b.blockedId === blockedId,
      );
      if (idx === -1) return false;
      fixtures.blocks.splice(idx, 1);
      return true;
    }),
    getUser: vi.fn(async (id: number) => fixtures.users.find((u) => u.id === id) ?? null),
    createContentReport: vi.fn(),
  } as const;

  return { storage };
});

import safetyRoutes from '../../server/routes/safety';
import moderationRoutes from '../../server/routes/moderation';
import { storage } from '../../server/storage-optimized';

describe('User block lifecycle', () => {
  let app: express.Express;
  let agent: request.SuperTest<request.Test>;

  beforeEach(() => {
    fixtures.blocks.splice(0, fixtures.blocks.length);
    fixtures.nextId = 1;
    vi.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));

    app.post('/test/login', (req, res) => {
      req.session.userId = req.body.userId;
      res.status(204).end();
    });

    app.use('/api', safetyRoutes);
    app.use('/api', moderationRoutes);

    agent = request.agent(app);
  });

  const loginAs = async (userId: number) => {
    await agent.post('/test/login').send({ userId }).expect(204);
  };

  it('requires authentication to delete a block', async () => {
    await agent.delete('/api/blocks/2').expect(401);
  });

  it('creates and removes a block through the safety routes', async () => {
    await loginAs(1);

    const blockRes = await agent.post('/api/blocks').send({ userId: 2, reason: 'spam' }).expect(200);
    expect(blockRes.body.block).toMatchObject({ blockerId: 1, blockedId: 2 });

    const list = await agent.get('/api/blocked-users').expect(200);
    expect(list.body).toHaveLength(1);

    await agent.delete('/api/blocks/2').expect(200);
    expect(fixtures.blocks).toHaveLength(0);
    expect(storage.removeUserBlock).toHaveBeenCalledWith(1, 2);

    const afterList = await agent.get('/api/blocked-users').expect(200);
    expect(afterList.body).toEqual([]);
  });

  it('redirects legacy moderation aliases to canonical safety endpoints', async () => {
    await loginAs(1);

    const preModerationList = await agent.get('/api/moderation/blocked-users');
    expect(preModerationList.status).toBe(307);
    expect(preModerationList.headers.location).toBe('/api/blocked-users');
    expect(preModerationList.headers.deprecation).toBe('true');

    const unblockRedirect = await agent.delete('/api/moderation/block/2');
    expect(unblockRedirect.status).toBe(307);
    expect(unblockRedirect.headers.location).toBe('/api/blocks/2');
  });
});
