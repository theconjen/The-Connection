import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app, { testMemStorage } from '../../server/test-app';

const authHeader = { 'x-test-user-id': '1' };

beforeEach(() => {
  const data = (testMemStorage as any).data;
  data.posts = [];
  (testMemStorage as any).nextId = 1;
});

describe('POST /api/posts validation', () => {
  it('rejects content longer than 500 characters', async () => {
    const longText = 'a'.repeat(501);

    const res = await request(app)
      .post('/api/posts')
      .set(authHeader)
      .send({ text: longText })
      .expect(400);

    expect(res.body.message).toContain('text must be between 1 and 500 characters');
  });

  it('rejects implicit titles longer than 60 characters', async () => {
    const overlongTitle = 'a'.repeat(61);

    const res = await request(app)
      .post('/api/posts')
      .set(authHeader)
      .send({ text: overlongTitle })
      .expect(400);

    expect(res.body.message).toContain('title must be at most 60 characters');
  });

  it('accepts long content when an explicit short title is provided', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set(authHeader)
      .send({ title: 'Concise', text: 'b'.repeat(120) })
      .expect(201);

    expect(res.body.title).toBe('Concise');
    expect(res.body.content).toHaveLength(120);
  });
});

