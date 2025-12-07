import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app, { testMemStorage } from '../../server/test-app';

const authHeader = { 'x-test-user-id': '1' };

beforeEach(() => {
  const data = (testMemStorage as any).data;
  data.posts = [];
  data.comments = [];
  data.microblogs = [];
  data.microblogLikes = [];
  (testMemStorage as any).nextId = 1;
});

describe('POST/PATCH/DELETE /api/posts - ownership', () => {
  it('allows the author to update and delete their post but blocks others', async () => {
    const createRes = await request(app)
      .post('/api/posts')
      .set(authHeader)
      .send({ text: 'initial content' })
      .expect(201);

    const postId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/api/posts/${postId}`)
      .set(authHeader)
      .send({ text: 'updated content' })
      .expect(200);

    expect(updateRes.body.content).toBe('updated content');
    expect(updateRes.body.authorId).toBe(1);

    await request(app)
      .patch(`/api/posts/${postId}`)
      .set({ 'x-test-user-id': '2' })
      .send({ text: 'hijack attempt' })
      .expect(403);

    await request(app)
      .delete(`/api/posts/${postId}`)
      .set({ 'x-test-user-id': '2' })
      .expect(403);

    await request(app)
      .delete(`/api/posts/${postId}`)
      .set(authHeader)
      .expect(200);

    await request(app)
      .get(`/api/posts/${postId}`)
      .expect(404);
  });
});

describe('DELETE /api/microblogs - ownership', () => {
  it('allows deletion by the author and denies others', async () => {
    const createRes = await request(app)
      .post('/api/microblogs')
      .set(authHeader)
      .send({ content: 'micro', imageUrl: null, communityId: null, groupId: null, parentId: null })
      .expect(201);

    const microblogId = createRes.body.id;

    await request(app)
      .delete(`/api/microblogs/${microblogId}`)
      .set({ 'x-test-user-id': '2' })
      .expect(403);

    await request(app)
      .delete(`/api/microblogs/${microblogId}`)
      .set(authHeader)
      .expect(200);

    await request(app)
      .get(`/api/microblogs/${microblogId}`)
      .expect(404);
  });
});

describe('POST /api/microblogs/:id/comments', () => {
  it('creates a comment tied to the microblog', async () => {
    const createRes = await request(app)
      .post('/api/microblogs')
      .set(authHeader)
      .send({ content: 'comment me', imageUrl: null, communityId: null, groupId: null, parentId: null })
      .expect(201);

    const microblogId = createRes.body.id;

    const commentRes = await request(app)
      .post(`/api/microblogs/${microblogId}/comments`)
      .set({ 'x-test-user-id': '2' })
      .send({ content: 'first comment', parentId: null })
      .expect(201);

    expect(commentRes.body.postId).toBe(microblogId);
    expect(commentRes.body.authorId).toBe(2);
    expect(commentRes.body.content).toBe('first comment');
  });
});
