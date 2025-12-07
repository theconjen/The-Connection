import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import apologeticsRouter from '../../server/routes/apologetics';
import { storage } from '../../server/storage-optimized';

vi.mock('../../server/storage-optimized', () => ({
  storage: {
    getAllApologeticsResources: vi.fn(),
  },
}));

function createApp() {
  const app = express();
  app.use('/api', apologeticsRouter);
  return app;
}

describe('/api/apologetics error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 500 when storage throws while loading resources', async () => {
    const mockedStorage = storage as unknown as { getAllApologeticsResources: ReturnType<typeof vi.fn> };
    mockedStorage.getAllApologeticsResources.mockRejectedValue(new Error('DB offline'));

    const res = await request(createApp()).get('/api/apologetics').expect(500);

    expect(res.body).toEqual({ message: 'Error loading apologetics resources' });
  });

  it('returns 500 when storage implementation is missing', async () => {
    const mockedStorage = storage as unknown as { getAllApologeticsResources?: ReturnType<typeof vi.fn> };
    mockedStorage.getAllApologeticsResources = undefined;

    const res = await request(createApp()).get('/api/apologetics').expect(500);

    expect(res.body).toEqual({ message: 'Error loading apologetics resources' });
  });
});
