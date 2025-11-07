import { MemStorage } from '../server/storage';

async function run() {
  const storage = new MemStorage();

  // Create a post
  const post = await storage.createPost({ title: 'Hello', content: 'World', authorId: 1, communityId: null, groupId: null });
  console.log('created post id=', post.id);

  let all = await storage.getAllPosts();
  console.log('posts count (should be 1):', all.length);

  // Soft-delete the post in-memory
  (post as any).deletedAt = new Date();

  all = await storage.getAllPosts();
  console.log('posts count after delete (should be 0):', all.length);

  process.exit(all.length === 0 ? 0 : 2);
}

run().catch(err => { console.error(err); process.exit(1); });
