import { storage } from '../storage-optimized';

async function main() {
  console.info('Storage type:', storage?.constructor?.name);
  console.info('Has getAllPosts:', typeof (storage as Record<string, unknown>)?.getAllPosts);

  try {
    const posts = await (storage as any).getAllPosts();
    console.info('Posts result:', Array.isArray(posts) ? posts.length : typeof posts);
    if (Array.isArray(posts) && posts.length) {
      console.info('Post IDs (sample):', posts.slice(0, 5).map((p: any) => p.id));
    }
  } catch (e) {
    console.error('getAllPosts error', e);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
