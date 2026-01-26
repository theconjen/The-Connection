import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import session from 'express-session';
import request from 'supertest';
import { createServer } from 'http';
import { storage } from '../../server/storage';

const fixtures = vi.hoisted(() => ({
  users: [
    { id: 1, isAdmin: false },
    { id: 2, isAdmin: false },
    { id: 3, isAdmin: true },
  ],
  events: [
    {
      id: 10,
      title: 'Private Gathering',
      creatorId: 1,
      isPublic: false,
      communityId: 1,
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
    isUserInvitedToEvent: vi.fn(async () => false),
    upsertEventRSVP: vi.fn(async (_eventId: number, userId: number, status: string) => ({ eventId: _eventId, userId, status })),
    getAllEvents: vi.fn(async () => fixtures.events),
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
    fixtures.users.splice(
      0,
      fixtures.users.length,
      { id: 1, isAdmin: false },
      { id: 2, isAdmin: false },
      { id: 3, isAdmin: true }
    );
    fixtures.events.splice(0, fixtures.events.length, {
      id: 10,
      title: 'Private Gathering',
      creatorId: 1,
      isPublic: false,
      communityId: 1,
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

  it('requires community membership or invitation to RSVP to private events', async () => {
    fixtures.events.splice(0, fixtures.events.length, {
      id: 10,
      title: 'Community Event',
      creatorId: 1,
      isPublic: false,
      communityId: 25,
      groupId: null,
    });

    await agent.post('/test/login').send({ userId: 2 }).expect(204);

    await agent
      .patch('/api/events/10/rsvp')
      .send({ status: 'going' })
      .expect(403);

    expect(storage.isCommunityMember).toHaveBeenCalledWith(2, 25);
    expect(storage.isUserInvitedToEvent).toHaveBeenCalledWith(2, 10);
  });

  it('returns 404 when attempting to RSVP to a missing event', async () => {
    fixtures.events.splice(0, fixtures.events.length);

    await agent.post('/test/login').send({ userId: 1 }).expect(204);

    await agent
      .patch('/api/events/10/rsvp')
      .send({ status: 'going' })
      .expect(404);
  });

  it('records RSVP updates with both event and user identifiers', async () => {
    fixtures.events.push({
      id: 11,
      title: 'Public Meetup',
      creatorId: 1,
      isPublic: true,
      communityId: null,
      groupId: null,
    });

    await agent.post('/test/login').send({ userId: 2 }).expect(204);

    const response = await agent
      .patch('/api/events/11/rsvp')
      .send({ status: 'going' })
      .expect(200);

    expect(response.body).toMatchObject({ eventId: 11, userId: 2, status: 'going' });
    expect(storage.upsertEventRSVP).toHaveBeenCalledWith(11, 2, 'going');
  });

  it('rejects RSVP payloads with unsupported statuses', async () => {
    await agent.post('/test/login').send({ userId: 1 }).expect(204);

    await agent
      .patch('/api/events/10/rsvp')
      .send({ status: 'invalid_status' })
      .expect(400);

    expect(storage.upsertEventRSVP).not.toHaveBeenCalled();
  });

  it('validates event filters before querying', async () => {
    const response = await agent.get('/api/events?filter=unknown').expect(400);
    expect(response.body.message).toBe('Invalid event filters');
  });

  it('enforces pagination bounds for event listings', async () => {
    await agent.get('/api/events?limit=5000').expect(400);

    const valid = await agent.get('/api/events?limit=1&communityId=1&filter=all').expect(200);
    expect(valid.body.length).toBeLessThanOrEqual(1);
  });

  it('prevents non-owners from deleting an event', async () => {
    await agent.post('/test/login').send({ userId: 2 }).expect(204);

    await agent.delete('/api/events/10').expect(403);
    expect(fixtures.events).toHaveLength(1);
  });

  it('allows organizers to delete their own events', async () => {
    await agent.post('/test/login').send({ userId: 1 }).expect(204);

    const response = await agent.delete('/api/events/10').expect(200);
    expect(response.body.message).toBe('Event deleted successfully');
    expect(fixtures.events).toHaveLength(0);
  });

  it('allows admins to delete events they did not create', async () => {
    await agent.post('/test/login').send({ userId: 3 }).expect(204);

    const response = await agent.delete('/api/events/10').expect(200);
    expect(response.body.message).toBe('Event deleted successfully');
    expect(fixtures.events).toHaveLength(0);
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

  /**
   * REGRESSION TEST: Event creation hostUserId hardening
   *
   * Verifies that:
   * 1. hostUserId is always set to the authenticated user's ID
   * 2. Client cannot override hostUserId via request body
   * 3. GET /api/events/:id returns the correct hostUserId
   *
   * Manual QA steps:
   * 1. Log in as User A
   * 2. Create an event via POST /api/events
   * 3. Call GET /api/events/:id on the created event
   * 4. Verify response contains hostUserId = User A's id
   * 5. Verify response contains host.id = User A's id
   * 6. Try creating event with hostUserId in body set to different user
   * 7. Verify the created event still has hostUserId = User A's id (ignored client value)
   */
  describe('Event creation hostUserId hardening', () => {
    beforeEach(() => {
      // Add mock for createEvent
      (storage as any).createEvent = vi.fn(async (data: any) => {
        const newEvent = {
          id: 100,
          ...data,
          createdAt: new Date().toISOString(),
        };
        fixtures.events.push(newEvent as any);
        return newEvent;
      });

      // Add mock for getCommunity
      (storage as any).getCommunity = vi.fn(async (id: number) => {
        if (id === 1) return { id: 1, name: 'Test Community' };
        return null;
      });

      // Add mock for isCommunityModerator
      (storage as any).isCommunityModerator = vi.fn(async (communityId: number, userId: number) => {
        // User 1 is a moderator of community 1
        return communityId === 1 && userId === 1;
      });
    });

    it('sets hostUserId to authenticated user, ignoring client-provided value', async () => {
      // Login as user 1
      await agent.post('/test/login').send({ userId: 1 }).expect(204);

      // Attempt to create event with a different hostUserId in body
      const response = await agent
        .post('/api/events')
        .send({
          title: 'Test Event',
          description: 'Test Description',
          eventDate: '2026-12-25',
          startTime: '10:00:00',
          endTime: '12:00:00',
          communityId: 1,
          isPublic: true,
          // Malicious attempt to set hostUserId to a different user
          hostUserId: 999,
          creatorId: 888,
        })
        .expect(201);

      // Verify hostUserId is set to the authenticated user (1), not the client value (999)
      expect(response.body.hostUserId).toBe(1);
      expect(response.body.creatorId).toBe(1);

      // Verify host object contains correct user
      expect(response.body.host).toBeDefined();
      expect(response.body.host.id).toBe(1);

      // Verify storage.createEvent was called with correct creatorId
      expect((storage as any).createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: 1,
        })
      );
    });

    it('GET /api/events/:id returns correct hostUserId for created event', async () => {
      // Add an event created by user 1
      fixtures.events.push({
        id: 50,
        title: 'User 1 Event',
        creatorId: 1,
        isPublic: true,
        communityId: 1,
        groupId: null,
      } as any);

      const response = await agent.get('/api/events/50').expect(200);

      // Verify hostUserId matches creatorId
      expect(response.body.hostUserId).toBe(1);
    });
  });
});
