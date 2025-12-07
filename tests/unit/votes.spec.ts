import { describe, expect, it } from 'vitest';
import { MemStorage } from '../../server/storage';

function createUser(storage: MemStorage, idx: number) {
  return storage.createUser({
    username: `user${idx}`,
    email: `user${idx}@example.com`,
    password: 'hashed-password'
  } as any);
}

describe('vote tracking', () => {
  it('tracks and toggles post votes per user', async () => {
    const storage = new MemStorage();
    const user = await createUser(storage, 1);
    const post = await storage.createPost({
      title: 'Toggle me',
      content: 'Testing votes',
      imageUrl: null,
      communityId: null,
      groupId: null,
      authorId: user.id
    });

    const first = await storage.togglePostVote(post.id, user.id);
    expect(first.voted).toBe(true);
    expect(first.post?.upvotes).toBe(1);

    const second = await storage.togglePostVote(post.id, user.id);
    expect(second.voted).toBe(false);
    expect(second.post?.upvotes).toBe(0);
  });

  it('enforces one post vote per user while allowing multiple voters', async () => {
    const storage = new MemStorage();
    const user1 = await createUser(storage, 1);
    const user2 = await createUser(storage, 2);
    const post = await storage.createPost({
      title: 'Shared post',
      content: 'Votes from many',
      imageUrl: null,
      communityId: null,
      groupId: null,
      authorId: user1.id
    });

    await storage.togglePostVote(post.id, user1.id);
    const repeat = await storage.togglePostVote(post.id, user1.id);
    expect(repeat.voted).toBe(false);
    expect(repeat.post?.upvotes).toBe(0);

    await storage.togglePostVote(post.id, user2.id);
    const third = await storage.togglePostVote(post.id, user1.id);
    expect(third.voted).toBe(true);
    expect(third.post?.upvotes).toBe(2);
  });

  it('tracks and removes comment votes', async () => {
    const storage = new MemStorage();
    const user = await createUser(storage, 1);
    const post = await storage.createPost({
      title: 'Comment target',
      content: 'Base post',
      imageUrl: null,
      communityId: null,
      groupId: null,
      authorId: user.id
    });
    const comment = await storage.createComment({
      content: 'Great point',
      postId: post.id,
      authorId: user.id,
      parentId: null
    });

    const first = await storage.toggleCommentVote(comment.id, user.id);
    expect(first.voted).toBe(true);
    expect(first.comment?.upvotes).toBe(1);

    const second = await storage.toggleCommentVote(comment.id, user.id);
    expect(second.voted).toBe(false);
    expect(second.comment?.upvotes).toBe(0);
  });
});
