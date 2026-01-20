import "dotenv/config";
import { storage } from './storage-optimized';

async function seedForumPosts() {
  console.log('🌱 Seeding forum posts...');

  try {
    // Get first few users
    const users = await storage.getAllUsers();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please seed users first.');
      return;
    }

    const testPosts = [
      {
        title: 'Welcome to The Connection Forums!',
        content: 'This is a Christian community forum where we can discuss faith, theology, and support each other. Feel free to share your thoughts and questions! #Welcome #Faith',
        authorId: users[0].id,
      },
      {
        title: 'Daily Bible Study: Romans 8:28',
        content: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose. What does this verse mean to you? #BibleStudy #Romans',
        authorId: users[Math.min(1, users.length - 1)].id,
      },
      {
        title: 'Prayer Request: Healing for my mother',
        content: 'Brothers and sisters, I am asking for your prayers. My mother was recently diagnosed with cancer and we are trusting God for her healing. Thank you for your support. #PrayerRequest #Healing',
        authorId: users[Math.min(2, users.length - 1)].id,
      },
      {
        title: 'Discussion: Faith vs. Works',
        content: 'I have been thinking about James 2:17 - "faith by itself, if it is not accompanied by action, is dead." How do we balance faith and works in our Christian walk? #Theology #Discussion',
        authorId: users[Math.min(3, users.length - 1)].id,
      },
      {
        title: 'Testimony: God Provided a Job!',
        content: 'Praise God! After 6 months of unemployment, I finally got a job offer. God is faithful! Thank you all for your prayers and support during this time. #Testimony #Blessing',
        authorId: users[Math.min(4, users.length - 1)].id,
      },
      {
        title: 'Question: Best Bible translation?',
        content: 'I am looking to buy a new Bible. What translation do you recommend for in-depth study? I am currently reading NIV but interested in ESV or NASB. #Bible #Question',
        authorId: users[0].id,
      },
      {
        title: 'Encouragement for Today',
        content: 'Remember: God never said the journey would be easy, but He did say the arrival would be worthwhile. Keep the faith! Philippians 4:13 #Encouragement #Faith',
        authorId: users[Math.min(1, users.length - 1)].id,
      },
      {
        title: 'Sunday Service Discussion',
        content: 'Our pastor preached on forgiveness today. It really convicted me about holding grudges. Anyone else struggle with forgiving others? #Sunday #Forgiveness',
        authorId: users[Math.min(2, users.length - 1)].id,
      },
    ];

    for (const post of testPosts) {
      await storage.createPost(post as any);
    }

    console.log(`✅ Seeded ${testPosts.length} forum posts`);
  } catch (error) {
    console.error('❌ Error seeding forum posts:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedForumPosts()
    .then(() => {
      console.log('✅ Forum posts seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to seed forum posts:', error);
      process.exit(1);
    });
}

export { seedForumPosts };
