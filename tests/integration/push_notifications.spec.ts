import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { createServer } from 'http';

// Provide the mocked module using an inline factory to avoid hoisting issues
vi.mock('../../server/storage', () => {
  let nextId = 1;
  const users: any[] = [];
  const pushTokens: any[] = [];
  const notifications: any[] = [];

  const ms = {
    // user methods
    getUser: async (id: number) => users.find(u => u.id === id),
    getUserById: async (id: number) => users.find(u => u.id === id),
    getUserByUsername: async (username: string) => users.find(u => u.username === username),
    getUserByEmail: async (email: string) => users.find(u => u.email === email),
    createUser: async (payload: any) => {
      const user = { id: nextId++, ...payload, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
      users.push(user);
      return user;
    },

    // push token methods
    savePushToken: async (t: any) => {
      const found = pushTokens.find(p => p.token === t.token);
      if (found) {
        Object.assign(found, t, { lastUsed: new Date() });
        return found;
      }
      const tokenObj = { id: nextId++, ...t };
      pushTokens.push(tokenObj);
      return tokenObj;
    },
    getUserPushTokens: async (userId: number) => pushTokens.filter(p => p.userId === userId),
    deletePushToken: async (token: string, userId: number) => {
      const idx = pushTokens.findIndex(p => p.token === token);
      if (idx === -1) return 'notfound';
      if (pushTokens[idx].userId !== userId) return 'forbidden';
      pushTokens.splice(idx, 1);
      return 'deleted';
    },

    // notifications
    getUserNotifications: async (userId: number) => notifications.filter(n => n.userId === userId),
    markNotificationAsRead: async (id: number, userId: number) => {
      const n = notifications.find(x => x.id === id);
      if (!n) return false;
      if (n.userId !== userId) return false;
      n.isRead = true;
      return true;
    },
    // helper for tests to insert a notification
    _createNotification: async (n: any) => {
      const notif = { id: nextId++, createdAt: new Date(), isRead: false, ...n };
      notifications.push(notif);
      return notif;
    }
  };

  return { storage: ms };
});

// Now import registerRoutes after the mock is in place
import { registerRoutes } from '../../server/routes';
// Import the mocked storage to access test-only helpers (Vitest will return the mock)
import { storage as mockedStorage } from '../../server/storage';

let app: express.Express;
let agent: request.SuperTest<request.Test>;

beforeAll(() => {
  process.env.USE_DB = 'false'; // ensure in-memory flows

  app = express();
  app.use(express.json());

  app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  const httpServer = createServer(app);
  registerRoutes(app, httpServer);

  agent = request.agent(app);
});

describe('Auth + Push integration (in-memory mock)', () => {
  it('registers a user, returns current user, registers and unregisters push token', async () => {
    // Register
    const regRes = await agent.post('/api/register').send({ username: 'alice', email: 'alice@example.com', password: 'password123' }).expect(201);
    expect(regRes.body).toHaveProperty('id');
    expect(regRes.body.username).toBe('alice');

    // Get current user
    const userRes = await agent.get('/api/user').expect(200);
    expect(userRes.body.username).toBe('alice');
    const userId = userRes.body.id as number;

    // Register push token
    const token = 'ExponentPushToken[test-token]';
    const pushRes = await agent.post('/api/push/register').send({ token, platform: 'expo' }).expect(200);
    expect(pushRes.body).toHaveProperty('id');
    expect(pushRes.body.token).toBe(token);

  // Insert a notification via mocked helper
  const notif = await (mockedStorage as any)._createNotification({ userId, title: 'Test', body: 'Hello' });

    // Fetch notifications
    const notifsRes = await agent.get('/api/notifications').expect(200);
    expect(Array.isArray(notifsRes.body)).toBe(true);
    expect(notifsRes.body.length).toBeGreaterThanOrEqual(1);

    // Mark notification as read
    const markRes = await agent.put(`/api/notifications/${notif.id}/read`).expect(200);
    expect(markRes.body).toHaveProperty('message');

    // Unregister push token
    await agent.post('/api/push/unregister').send({ token }).expect(204);
  });
});
