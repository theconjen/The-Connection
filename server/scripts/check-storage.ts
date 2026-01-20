import { storage } from '../storage-optimized';

async function main() {
  ?.constructor?.name);
  ?.getAllPosts);
  try {
    const posts = await (storage as any).getAllPosts();
     ? posts.length : typeof posts);
    if (Array.isArray(posts) && posts.length) .map((p:any)=>p.id));
  } catch (e) {
    console.error('getAllPosts error', e);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
