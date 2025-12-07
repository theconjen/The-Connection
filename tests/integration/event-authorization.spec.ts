import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { createServer } from 'http';

const fixtures = vi.hoisted(() => ({
  users: [
    { id: 1, isAdmin: false },
    { id: 2, isAdmin: false },
  ],
  events: [
    {
      id: 10,
      title: 'Private Gathering',
      creatorId: 1,
      isPublic: false,
      communityId: null,
      groupId: null,
    },
  ],
  posts: [
    { id: 20, content: 'Hello world', authorId: 1, upvotes: 0 },
  ],
  postVotes: [] as { postId: number; userId: number }[],
}));

vi.mock('../../server/auth', () => ({
  setupAuth: () => {},
  isAuthenticated: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.session?.userId) return next();
    return res.status(401).json({ message: 'Unauthorized' });
  },
  isAdmin: (_req: express.Request, res: express.Response) => res.status(403).json({ message: 'Unauthorized: Admin access required' }),
}));

vi.mock('../../server/storage', () => {
  const getUser = vi.fn(async (id: number) => fixtures.users.find(u => u.id === id) || null);
  const storage = {
    getUser,
    getEvent: vi.fn(async (id: number) => fixtures.events.find(e => e.id === id) || null),
    isCommunityMember: vi.fn(async () => false),
    isGroupMember: vi.fn(async () => false),
    upsertEventRSVP: vi.fn(async (_eventId: number, userId: number, status: string) => ({ eventId: _eventId, userId, status })),
    deleteEvent: vi.fn(async (id: number) => {
      const idx = fixtures.events.findIndex(e => e.id === id);
      if (idx === -1) return false;
      fixtures.events.splice(idx, 1);
      return true;
    }),
    getPost: vi.fn(async (id: number) => fixtures.posts.find(p => p.id === id) || null),
    togglePostVote: vi.fn(async (postId: number, userId: number) => {
      const post = fixtures.posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');
      const existingIdx = fixtures.postVotes.findIndex(v => v.postId === postId && v.userId === userId);
      if (existingIdx !== -1) {
        fixtures.postVotes.splice(existingIdx, 1);
        post.upvotes = Math.max(0, post.upvotes - 1);
        return { voted: false, post };
      }
      fixtures.postVotes.push({ postId, userId });
      post.upvotes += 1;
      return { voted: true, post };
    }),
    getCommentsByPostId: vi.fn(async () => []),
    getAllPosts: vi.fn(async () => fixtures.posts),
    getBlockedUserIdsFor: vi.fn(async () => []),
    createComment: vi.fn(),
    createPost: vi.fn(),
  } as any;

  return { storage };
});

import { registerRoutes } from '../../server/routes';

describe('Event and post authorization', () => {
  let app: express.Express;
  let agent: request.SuperTest<request.Test>;

  beforeEach(() => {
    fixtures.users.splice(0, fixtures.users.length, { id: 1, isAdmin: false }, { id: 2, isAdmin: false });
    fixtures.events.splice(0, fixtures.events.length, {
      id: 10,
      title: 'Private Gathering',
      creatorId: 1,
      isPublic: false,
      communityId: null,
      groupId: null,
    });
    fixtures.posts.splice(0, fixtures.posts.length, { id: 20, content: 'Hello world', authorId: 1, upvotes: 0 });
    fixtures.postVotes.splice(0, fixtures.postVotes.length);

    app = express();
    app.use(express.json());
    app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));

    app.post('/test/login', (req, res) => {
      req.session.userId = req.body.userId;
      res.status(204).end();
    });

    const httpServer = createServer(app);
    registerRoutes(app, httpServer);

    agent = request.agent(app);
  });

  it('rejects RSVP attempts from users without access to a private event', async () => {
    await agent.post('/test/login').send({ userId: 2 }).expect(204);

    await agent
      .patch('/api/events/10/rsvp')
      .send({ status: 'going' })
      .expect(403);
  });

  it('prevents non-owners from deleting an event', async () => {
    await agent.post('/test/login').send({ userId: 2 }).expect(204);

    await agent.delete('/api/events/10').expect(403);
  });

  it('tracks post upvotes per-user and toggles properly', async () => {
    await agent.post('/test/login').send({ userId: 1 }).expect(204);

    const first = await agent.post('/api/posts/20/upvote').expect(200);
    expect(first.body.upvotes).toBe(1);
    expect(first.body.userHasUpvoted).toBe(true);

    const second = await agent.post('/api/posts/20/upvote').expect(200);
    expect(second.body.upvotes).toBe(0);
    expect(second.body.userHasUpvoted).toBe(false);
  });

  it('blocks anonymous post upvotes', async () => {
    await agent.post('/api/posts/20/upvote').expect(401);
  });
});
