/**
 * Seed Bot Users with Realistic Profiles
 *
 * Creates bot user accounts that look like real users to enable
 * realistic engagement on Community Advice posts.
 *
 * Run: npx tsx server/scripts/seed-bot-users.ts
 */

import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { BOT_PERSONAS } from '../data/advice-questions';
import crypto from 'crypto';

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedBotUsers() {
  console.info('\n🤖 Seeding Bot Users with Realistic Profiles...\n');

  try {
    let created = 0;
    let skipped = 0;

    for (const persona of BOT_PERSONAS) {
      // Check if user already exists using raw SQL
      const existing = await db.execute(
        sql`SELECT id FROM users WHERE username = ${persona.username} LIMIT 1`
      );

      if (existing.rows && existing.rows.length > 0) {
        console.info(`⏭️  Skipping ${persona.username} (already exists)`);
        skipped++;
        continue;
      }

      // Create a placeholder password hash (bots don't need to login)
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = crypto.createHash('sha256').update(randomPassword).digest('hex');

      // Create random date in last 90 days
      const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);

      // Convert interests array to PostgreSQL array format
      const interestsArray = `{${persona.interests.join(',')}}`;

      // Insert using raw SQL to avoid schema mismatch issues
      await db.execute(sql`
        INSERT INTO users (
          username,
          email,
          password,
          display_name,
          bio,
          city,
          home_church,
          favorite_bible_verse,
          interests,
          email_verified,
          created_at
        ) VALUES (
          ${persona.username},
          ${`${persona.username}@theconnection.app`},
          ${passwordHash},
          ${persona.displayName},
          ${persona.bio},
          ${persona.location},
          ${persona.church || null},
          ${persona.favoriteVerse},
          ${interestsArray}::text[],
          ${true},
          ${createdAt}
        )
      `);

      console.info(`✅ Created: ${persona.displayName} (@${persona.username})`);
      console.info(`   📍 ${persona.location}`);
      console.info(`   📖 "${persona.favoriteVerse}"`);
      console.info(`   🏛️  ${persona.church || 'No church listed'}`);
      console.info('');

      created++;
    }

    console.info('='.repeat(50));
    console.info('✨ Bot Users Seeding Complete!');
    console.info('='.repeat(50));
    console.info(`✅ Created: ${created}`);
    console.info(`⏭️  Skipped: ${skipped}`);
    console.info(`📊 Total personas: ${BOT_PERSONAS.length}`);
    console.info('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error seeding bot users:', error);
    throw error;
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main() {
  console.info('\n📊 Creating bot user accounts from personas...\n');

  await seedBotUsers();

  console.info('🎉 Done!\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
