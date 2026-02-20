/**
 * Seed Demo Account for App Store Screenshots
 *
 * Creates a demo account with attractive content for taking screenshots
 * Username: DemoUser
 * Password: Demo123!
 */

import { neon } from '@neondatabase/serverless';
import { hashPassword } from './utils/passwords';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function seedDemoAccount() {
  console.info('🌱 Creating demo account for App Store screenshots...\n');

  try {
    // Hash the password
    const password = 'Demo123!';
    const hashedPassword = await hashPassword(password);

    // Create demo user
    const existingUser = await sql`
      SELECT id FROM users WHERE username = 'DemoUser'
    `;

    let userId: number;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.info(`✅ Demo user already exists (ID: ${userId}), updating...`);

      await sql`
        UPDATE users SET
          display_name = 'Sarah Grace',
          bio = '🙏 Follower of Christ | ☕ Coffee enthusiast | 📖 Bible study leader at Faith Community Church',
          avatar_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
          city = 'Austin',
          state = 'Texas',
          onboarding_completed = true,
          email_verified = true,
          profile_visibility = 'public'
        WHERE id = ${userId}
      `;
    } else {
      const result = await sql`
        INSERT INTO users (
          username, email, password, display_name, bio, avatar_url,
          city, state, onboarding_completed, email_verified, profile_visibility
        ) VALUES (
          'DemoUser',
          'demo@theconnection.app',
          ${hashedPassword},
          'Sarah Grace',
          '🙏 Follower of Christ | ☕ Coffee enthusiast | 📖 Bible study leader at Faith Community Church',
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
          'Austin',
          'Texas',
          true,
          true,
          'public'
        )
        RETURNING id
      `;
      userId = result[0].id;
      console.info(`✅ Created demo user (ID: ${userId})`);
    }

    // Create sample microblogs
    console.info('\n📝 Creating demo microblogs...');

    const microblogs = [
      {
        content: 'Just finished an amazing Bible study on Romans 8. "If God is for us, who can be against us?" What a powerful reminder! 🙌',
      },
      {
        content: 'Sunday morning worship was incredible today! The choir brought tears to my eyes with "How Great Thou Art" 🎵✨',
      },
      {
        content: 'Grateful for this community! Found my small group through this app and it has changed my life. God is good! 💕',
      },
      {
        content: 'Coffee and devotionals - the perfect start to the day ☕📖 What are you reading this morning?',
      },
    ];

    for (let i = 0; i < microblogs.length; i++) {
      const blog = microblogs[i];
      // Check if similar microblog exists
      const existing = await sql`
        SELECT id FROM microblogs WHERE author_id = ${userId} AND content LIKE ${blog.content.substring(0, 30) + '%'}
      `;

      if (existing.length === 0) {
        const daysAgo = i + 1; // Stagger the posts
        await sql`
          INSERT INTO microblogs (author_id, content, created_at)
          VALUES (${userId}, ${blog.content}, NOW() - INTERVAL '1 day' * ${daysAgo})
        `;
        console.info(`  ✅ Added microblog: "${blog.content.substring(0, 40)}..."`);
      } else {
        console.info(`  ⏭️ Microblog already exists: "${blog.content.substring(0, 40)}..."`);
      }
    }

    // Join demo user to communities
    console.info('\n🏘️ Joining demo user to communities...');

    const communities = await sql`
      SELECT id, name FROM communities LIMIT 5
    `;

    for (const community of communities) {
      const existingMember = await sql`
        SELECT * FROM community_members WHERE community_id = ${community.id} AND user_id = ${userId}
      `;

      if (existingMember.length === 0) {
        await sql`
          INSERT INTO community_members (community_id, user_id, role, joined_at)
          VALUES (${community.id}, ${userId}, 'member', NOW())
        `;
        console.info(`  ✅ Joined: ${community.name}`);
      } else {
        console.info(`  ⏭️ Already member of: ${community.name}`);
      }
    }

    // Add some followers for the demo user
    console.info('\n👥 Setting up follower relationships...');

    const otherUsers = await sql`
      SELECT id, username FROM users WHERE id != ${userId} LIMIT 10
    `;

    let followersAdded = 0;
    let followingAdded = 0;

    for (const user of otherUsers) {
      // Make some users follow demo user
      if (followersAdded < 5) {
        const existingFollow = await sql`
          SELECT * FROM user_follows WHERE follower_id = ${user.id} AND following_id = ${userId}
        `;
        if (existingFollow.length === 0) {
          await sql`
            INSERT INTO user_follows (follower_id, following_id, created_at)
            VALUES (${user.id}, ${userId}, NOW())
          `;
          followersAdded++;
        }
      }

      // Make demo user follow some users
      if (followingAdded < 7) {
        const existingFollow = await sql`
          SELECT * FROM user_follows WHERE follower_id = ${userId} AND following_id = ${user.id}
        `;
        if (existingFollow.length === 0) {
          await sql`
            INSERT INTO user_follows (follower_id, following_id, created_at)
            VALUES (${userId}, ${user.id}, NOW())
          `;
          followingAdded++;
        }
      }
    }

    console.info(`  ✅ Added ${followersAdded} followers`);
    console.info(`  ✅ Following ${followingAdded} users`);

    // RSVP to some events
    console.info('\n📅 RSVPing to events...');

    const upcomingEvents = await sql`
      SELECT id, title FROM events
      WHERE event_date >= CURRENT_DATE
      LIMIT 3
    `;

    for (const event of upcomingEvents) {
      const existingRsvp = await sql`
        SELECT * FROM event_rsvps WHERE event_id = ${event.id} AND user_id = ${userId}
      `;

      if (existingRsvp.length === 0) {
        await sql`
          INSERT INTO event_rsvps (event_id, user_id, status, created_at)
          VALUES (${event.id}, ${userId}, 'going', NOW())
        `;
        console.info(`  ✅ RSVP'd to: ${event.title}`);
      } else {
        console.info(`  ⏭️ Already RSVP'd to: ${event.title}`);
      }
    }

    console.info('\n✨ Demo account setup complete!\n');
    console.info('═══════════════════════════════════════');
    console.info('  Demo Account Credentials');
    console.info('═══════════════════════════════════════');
    console.info(`  Username: DemoUser`);
    console.info(`  Password: Demo123!`);
    console.info(`  Display Name: Sarah Grace`);
    console.info(`  User ID: ${userId}`);
    console.info('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding demo account:', error);
    throw error;
  }
}

seedDemoAccount()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
