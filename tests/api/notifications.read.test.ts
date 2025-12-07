import express from 'express';
import { createServer } from 'http';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../server/storage', () => {
  const markNotificationAsRead = vi.fn();
  const getUserNotifications = vi.fn().mockResolvedValue([]);

  return {
    storage: {
      getUserNotifications,
      markNotificationAsRead,
    },
  };
});

vi.mock('../../server/auth', () => ({
  setupAuth: vi.fn(),
  isAuthenticated: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as any).session = { userId: (req as any).session?.userId ?? 42 };
    next();
  },
  isAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('../../server/rate-limiters', () => ({
  contentCreationLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  messageCreationLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('../../server/services/pushService', () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock('../../server/utils/moderation', () => ({
  ensureCleanText: vi.fn(),
  ensureSafeBinaryUpload: vi.fn(),
  ensureAllowedMimeType: vi.fn(),
  handleModerationError: () => false,
}));

import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = { userId: 99 };
    next();
  });
  const server = createServer(app);
  registerRoutes(app, server);
  return app;
}

describe('PUT /api/notifications/:id/read', () => {
  const mockedStorage = storage as unknown as {
    getUserNotifications: ReturnType<typeof vi.fn>;
    markNotificationAsRead: ReturnType<typeof vi.fn> | undefined;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedStorage.getUserNotifications = vi.fn().mockResolvedValue([]);
    mockedStorage.markNotificationAsRead = vi.fn();
  });

  it('returns 400 for invalid notification id', async () => {
    const res = await request(createApp())
      .put('/api/notifications/not-a-number/read')
      .expect(400);

    expect(res.body).toEqual({ message: 'Invalid notification id' });
  });

  it('returns 404 when notification does not exist for the user', async () => {
    mockedStorage.markNotificationAsRead = vi.fn().mockResolvedValue(false);

    const res = await request(createApp())
      .put('/api/notifications/123/read')
      .expect(404);

    expect(res.body).toEqual({ message: 'Notification not found' });
  });

  it('returns 500 when storage implementation is missing', async () => {
    mockedStorage.markNotificationAsRead = undefined;

    const res = await request(createApp())
      .put('/api/notifications/123/read')
      .expect(500);

    expect(res.body).toEqual({ message: 'Error marking notification as read' });
  });
});
