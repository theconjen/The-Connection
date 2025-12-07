import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import dmRouter from '../../server/routes/dmRoutes';
import { storage } from '../../server/storage-optimized';

vi.mock('../../server/storage-optimized', () => ({
  storage: {
    getUserConversations: vi.fn(),
    getUnreadMessageCount: vi.fn(),
    getBlockedUserIdsFor: vi.fn(),
    getDirectMessages: vi.fn(),
    createDirectMessage: vi.fn(),
    getUserPushTokens: vi.fn(),
    getUser: vi.fn(),
    markMessageAsRead: vi.fn(),
    markConversationAsRead: vi.fn(),
  },
}));

vi.mock('../../server/services/pushService', () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock('../../server/utils/moderation', () => ({
  ensureCleanText: vi.fn(),
  handleModerationError: () => false,
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = { userId: 123 };
    next();
  });
  app.use('/api/dms', dmRouter);
  return app;
}

describe('dmRoutes error responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns message JSON shape when conversation retrieval fails', async () => {
    const mockedStorage = storage as unknown as {
      getUserConversations: ReturnType<typeof vi.fn>;
      getUnreadMessageCount: ReturnType<typeof vi.fn>;
    };
    mockedStorage.getUserConversations.mockRejectedValue(new Error('Database unavailable'));

    const res = await request(createApp())
      .get('/api/dms/conversations')
      .expect(500);

    expect(res.body).toEqual({ message: 'Error fetching conversations' });
  });

  it('returns message JSON shape when unread count retrieval fails', async () => {
    const mockedStorage = storage as unknown as {
      getUserConversations: ReturnType<typeof vi.fn>;
      getUnreadMessageCount: ReturnType<typeof vi.fn>;
    };
    mockedStorage.getUnreadMessageCount.mockRejectedValue(new Error('Database unavailable'));

    const res = await request(createApp())
      .get('/api/dms/unread-count')
      .expect(500);

    expect(res.body).toEqual({ message: 'Error fetching unread count' });
  });
});
