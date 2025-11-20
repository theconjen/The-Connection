import { storage } from '../storage-optimized';

async function main() {
  console.log('storage.constructor.name=', (storage as any)?.constructor?.name);
  console.log('has getAllPosts=', typeof (storage as any)?.getAllPosts);
  try {
    const posts = await (storage as any).getAllPosts();
    console.log('getAllPosts length=', Array.isArray(posts) ? posts.length : typeof posts);
    if (Array.isArray(posts) && posts.length) console.log('first ids=', posts.slice(0,5).map((p:any)=>p.id));
  } catch (e) {
    console.error('getAllPosts error', e);
  }
}

main().catch(e=>{ console.error(e); process.exit(1); });
