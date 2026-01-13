/**
 * Seed script for App Store screenshot users
 * Run: npx tsx server/seed-screenshot-users.ts
 * Remove: npx tsx server/seed-screenshot-users.ts --remove
 */

import 'dotenv/config';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Flag users as screenshot data
const SCREENSHOT_FLAG = '[SCREENSHOT]';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const screenshotUsers = [
  {
    username: 'sarahjohnson',
    email: 'sarah.johnson@example.com',
    displayName: 'Sarah Johnson',
    bio: `${SCREENSHOT_FLAG} Young professional passionate about prayer and community. Coffee addict ☕ | Austin, TX`,
    denomination: 'Non-denominational',
    interests: ['Prayer', 'Worship', 'Community Service'],
    age: 28,
    gender: 'Female',
  },
  {
    username: 'davidmartinez',
    email: 'david.martinez@example.com',
    displayName: 'David Martinez',
    bio: `${SCREENSHOT_FLAG} Husband, father, worship leader. Seeking to serve God's kingdom through music and discipleship.`,
    denomination: 'Baptist',
    interests: ['Worship Music', 'Bible Study', 'Family Ministry'],
    age: 34,
    gender: 'Male',
  },
  {
    username: 'emilychen',
    email: 'emily.chen@example.com',
    displayName: 'Emily Chen',
    bio: `${SCREENSHOT_FLAG} College student. Apologetics enthusiast. Seeking truth and sharing Christ's love on campus 📖`,
    denomination: 'Presbyterian',
    interests: ['Apologetics', 'Campus Ministry', 'Philosophy'],
    age: 21,
    gender: 'Female',
  },
  {
    username: 'michaelthompson',
    email: 'michael.thompson@example.com',
    displayName: 'Michael Thompson',
    bio: `${SCREENSHOT_FLAG} Pastor, teacher, friend. Leading young adults to discover their purpose in Christ.`,
    denomination: 'Methodist',
    interests: ['Teaching', 'Youth Ministry', 'Discipleship'],
    age: 42,
    gender: 'Male',
  },
  {
    username: 'rachelwilliams',
    email: 'rachel.williams@example.com',
    displayName: 'Rachel Williams',
    bio: `${SCREENSHOT_FLAG} Mom of 3. Finding joy in the chaos. Prayer warrior. Love sharing God's faithfulness in everyday life 🙏`,
    denomination: 'Pentecostal',
    interests: ['Parenting', 'Prayer', 'Women\'s Ministry'],
    age: 36,
    gender: 'Female',
  },
  {
    username: 'jamesanderson',
    email: 'james.anderson@example.com',
    displayName: 'James Anderson',
    bio: `${SCREENSHOT_FLAG} Tech worker. Recovering skeptic. Sharing how Christ changed everything.`,
    denomination: 'Non-denominational',
    interests: ['Apologetics', 'Tech Ministry', 'Evangelism'],
    age: 29,
    gender: 'Male',
  },
  {
    username: 'gracetaylor',
    email: 'grace.taylor@example.com',
    displayName: 'Grace Taylor',
    bio: `${SCREENSHOT_FLAG} Seminary student. Future missionary. Heart for the lost and love for God's Word.`,
    denomination: 'Reformed',
    interests: ['Missions', 'Bible Study', 'Theology'],
    age: 25,
    gender: 'Female',
  },
  {
    username: 'danielbrown',
    email: 'daniel.brown@example.com',
    displayName: 'Daniel Brown',
    bio: `${SCREENSHOT_FLAG} Business owner. Men's ministry leader. Helping guys grow in faith and brotherhood 💪`,
    denomination: 'Baptist',
    interests: ['Men\'s Ministry', 'Business', 'Mentoring'],
    age: 45,
    gender: 'Male',
  },
  {
    username: 'oliviadavis',
    email: 'olivia.davis@example.com',
    displayName: 'Olivia Davis',
    bio: `${SCREENSHOT_FLAG} Nurse. Worship team vocalist. Serving God through healthcare and song 🎵`,
    denomination: 'Catholic',
    interests: ['Worship', 'Healthcare Ministry', 'Prayer'],
    age: 31,
    gender: 'Female',
  },
  {
    username: 'noahwilson',
    email: 'noah.wilson@example.com',
    displayName: 'Noah Wilson',
    bio: `${SCREENSHOT_FLAG} Youth pastor. Gamer. Reaching the next generation with the Gospel, one TikTok at a time.`,
    denomination: 'Non-denominational',
    interests: ['Youth Ministry', 'Gaming', 'Social Media'],
    age: 27,
    gender: 'Male',
  },
  {
    username: 'sophiagarcia',
    email: 'sophia.garcia@example.com',
    displayName: 'Sophia Garcia',
    bio: `${SCREENSHOT_FLAG} Artist. Poet. Using creativity to worship and point others to Christ's beauty 🎨`,
    denomination: 'Episcopal',
    interests: ['Arts & Crafts', 'Writing', 'Creative Worship'],
    age: 33,
    gender: 'Female',
  },
  {
    username: 'ethanmiller',
    email: 'ethan.miller@example.com',
    displayName: 'Ethan Miller',
    bio: `${SCREENSHOT_FLAG} Firefighter. Recovery ministry volunteer. 2 years sober by God's grace. He's faithful!`,
    denomination: 'Lutheran',
    interests: ['Recovery Ministry', 'First Responders', 'Testimony'],
    age: 38,
    gender: 'Male',
  },
  {
    username: 'isabellarodriguez',
    email: 'isabella.rodriguez@example.com',
    displayName: 'Isabella Rodriguez',
    bio: `${SCREENSHOT_FLAG} Teacher. Bilingual ministry. Compartiendo el amor de Cristo / Sharing Christ's love 🌎`,
    denomination: 'Pentecostal',
    interests: ['Teaching', 'Bilingual Ministry', 'Kids Ministry'],
    age: 30,
    gender: 'Female',
  },
  {
    username: 'masonlee',
    email: 'mason.lee@example.com',
    displayName: 'Mason Lee',
    bio: `${SCREENSHOT_FLAG} Married 5 years. Small group leader. Learning to love like Christ loved the church.`,
    denomination: 'Presbyterian',
    interests: ['Marriage Ministry', 'Small Groups', 'Discipleship'],
    age: 32,
    gender: 'Male',
  },
  {
    username: 'avaharris',
    email: 'ava.harris@example.com',
    displayName: 'Ava Harris',
    bio: `${SCREENSHOT_FLAG} Single. 30-something. Trust God's timing. Living fully while waiting faithfully ✨`,
    denomination: 'Non-denominational',
    interests: ['Singles Ministry', 'Prayer', 'Community'],
    age: 34,
    gender: 'Female',
  },
];

async function seedScreenshotUsers() {
  console.info('🌱 Seeding screenshot users...');

  try {
    const password = await hashPassword('Screenshot123!');
    let created = 0;
    let skipped = 0;

    for (const userData of screenshotUsers) {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, userData.username));

      if (existingUser.length > 0) {
        console.info(`⏭️  Skipped (already exists): ${userData.displayName} (@${userData.username})`);
        skipped++;
        continue;
      }

      await db.insert(users).values({
        ...userData,
        password,
        emailVerified: true, // Screenshot users can login immediately
        onboardingCompleted: true, // Skip onboarding
      });

      console.info(`✅ Created user: ${userData.displayName} (@${userData.username})`);
      created++;
    }

    console.info(`\n✨ Summary: ${created} created, ${skipped} skipped (already existed)`);
    if (created > 0) {
      console.info('\n📸 Users are ready for App Store screenshots!');
      console.info('\n🔑 All users have password: Screenshot123!');
    }
    console.info('\n🗑️  To remove all screenshot data, run: npx tsx server/seed-all-screenshots.ts --remove');
  } catch (error) {
    console.error('❌ Error seeding screenshot users:', error);
    throw error;
  }
}

async function removeScreenshotUsers() {
  console.info('🗑️  Removing screenshot users...');

  try {
    // Find all users with screenshot bio flag
    const allUsers = await db.select().from(users);
    const screenshotUsersList = allUsers.filter(u =>
      u.bio?.includes(SCREENSHOT_FLAG)
    );

    if (screenshotUsersList.length === 0) {
      console.info('ℹ️  No screenshot users found.');
      return;
    }

    // Delete users
    for (const user of screenshotUsersList) {
      await db.delete(users).where(eq(users.id, user.id));
      console.info(`✅ Removed user: ${user.displayName}`);
    }

    console.info(`\n✨ Successfully removed ${screenshotUsersList.length} screenshot users!`);
  } catch (error) {
    console.error('❌ Error removing screenshot users:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isRemove = args.includes('--remove');

  if (isRemove) {
    await removeScreenshotUsers();
  } else {
    await seedScreenshotUsers();
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
