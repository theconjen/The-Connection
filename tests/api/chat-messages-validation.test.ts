import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app, { testMemStorage } from '../../server/test-app';

beforeEach(() => {
  const data = (testMemStorage as any).data;
  data.chatMessages = [];
  (testMemStorage as any).nextId = 1;
});

describe('GET /api/chat-rooms/:roomId/messages validation', () => {
  it('rejects negative limits', async () => {
    const res = await request(app)
      .get('/api/chat-rooms/1/messages')
      .query({ limit: -5 })
      .expect(400);

    expect(res.body.message).toContain('limit must be non-negative');
  });
});

