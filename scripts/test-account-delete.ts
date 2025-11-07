import { MemStorage } from '../server/storage';

async function run() {
  const storage = new MemStorage();

  // Create a user
  const user = await storage.createUser({ username: 'todelete', email: 'del@example.com', password: 'pw' });
  // Create a community by the user
  const comm = await storage.createCommunity({ name: 'Owned', description: 'owned', slug: 'owned', iconName: 'a', iconColor: 'b', interestTags: [], createdBy: user.id });
  // Create a post by the user in the community
  const post = await storage.createPost({ title: 'P', content: 'C', authorId: user.id, communityId: comm.id, groupId: null });
  // Create an event by the user via storage API
  const ev = await storage.createEvent({ title: 'E', description: 'E', location: null, address: null, city: null, state: null, zipCode: null, isVirtual: false, isPublic: true, showOnMap: true, virtualMeetingUrl: null, eventDate: new Date(), startTime: '10:00', endTime: '11:00', imageUrl: null, latitude: null, longitude: null, communityId: comm.id, groupId: null, creatorId: user.id } as any);

  console.log('before counts:', (await storage.getAllPosts()).length, (await storage.getAllCommunities()).length, (await storage.getAllEvents()).length);

  // Simulate account deletion (soft delete)
  user.deletedAt = new Date();
  comm.deletedAt = new Date();
  post.deletedAt = new Date();
  ev.deletedAt = new Date();

  console.log('after counts:', (await storage.getAllPosts()).length, (await storage.getAllCommunities()).length, (await storage.getAllEvents()).length);
  console.log('comm.deletedAt=', comm.deletedAt);
  console.log('store comm object=', (storage as any).data.communities.find((c:any)=>c.id===comm.id));

  // Verify that created items are now gone
  const postExists = await storage.getPost(post.id);
  const commExists = await storage.getCommunityBySlug((comm as any).slug || comm.slug || '');
  const evExists = await storage.getEvent(ev.id);

  const ok = !postExists && !commExists && !evExists;
  console.log('deleted checks (post,community,event):', !!postExists, !!commExists, !!evExists, ' => ok=', ok);
  process.exit(ok ? 0 : 2);
}

run().catch(e => { console.error(e); process.exit(1); });
