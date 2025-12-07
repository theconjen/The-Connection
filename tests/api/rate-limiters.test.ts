import express from 'express';
import request from 'supertest';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';

import {
  contentCreationLimiter,
  messageCreationLimiter,
  dmSendLimiter,
  moderationReportLimiter,
} from '../../server/rate-limiters';

const TEST_IP = '203.0.113.1';

describe('rate limiting middleware', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.set('trust proxy', true);
    app.use(express.json());

    app.post('/api/posts', contentCreationLimiter, (_req, res) => res.json({ ok: true }));
    app.post('/api/comments', messageCreationLimiter, (_req, res) => res.json({ ok: true }));
    app.post('/api/dms/send', dmSendLimiter, (_req, res) => res.json({ ok: true }));
    app.post('/api/reports', moderationReportLimiter, (_req, res) => res.json({ ok: true }));
  });

  afterEach(() => {
    contentCreationLimiter.resetKey(TEST_IP);
    messageCreationLimiter.resetKey(TEST_IP);
    dmSendLimiter.resetKey(TEST_IP);
    moderationReportLimiter.resetKey(TEST_IP);
  });

  it('caps post creation requests', async () => {
    const limit = (contentCreationLimiter as any).options.max as number;

    for (let i = 0; i < limit; i++) {
      const res = await request(app).post('/api/posts').set('x-forwarded-for', TEST_IP);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post('/api/posts').set('x-forwarded-for', TEST_IP);
    expect(blocked.status).toBe(429);
    expect(blocked.text).toContain('Too many requests');
  });

  it('caps comment creation requests', async () => {
    const limit = (messageCreationLimiter as any).options.max as number;

    for (let i = 0; i < limit; i++) {
      const res = await request(app).post('/api/comments').set('x-forwarded-for', TEST_IP);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post('/api/comments').set('x-forwarded-for', TEST_IP);
    expect(blocked.status).toBe(429);
    expect(blocked.text).toContain('Too many messages');
  });

  it('caps dm send requests', async () => {
    const limit = (dmSendLimiter as any).options.max as number;

    for (let i = 0; i < limit; i++) {
      const res = await request(app).post('/api/dms/send').set('x-forwarded-for', TEST_IP);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post('/api/dms/send').set('x-forwarded-for', TEST_IP);
    expect(blocked.status).toBe(429);
    expect(blocked.text).toContain('You are sending messages too quickly');
  });

  it('caps moderation reports', async () => {
    const limit = (moderationReportLimiter as any).options.max as number;

    for (let i = 0; i < limit; i++) {
      const res = await request(app).post('/api/reports').set('x-forwarded-for', TEST_IP);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post('/api/reports').set('x-forwarded-for', TEST_IP);
    expect(blocked.status).toBe(429);
    expect(blocked.text).toContain('Too many reports submitted');
  });
});
