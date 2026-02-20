/**
 * Create Bot Users
 *
 * This script creates bot accounts for automated posting:
 * - Bible Verse Bot: Posts daily Bible verses
 * - Theology Quote Bot: Posts quotes from Christian theologians
 */

import { db } from '../db';
import { users } from '../../packages/shared/src/schema';
import { hashPassword } from '../utils/passwords';
import { eq } from 'drizzle-orm';

interface BotConfig {
  username: string;
  email: string;
  displayName: string;
  bio: string;
  password: string;
}

const BOT_CONFIGS: BotConfig[] = [
  {
    username: 'bibleverse_bot',
    email: 'bibleverse@theconnection.app',
    displayName: '📖 Daily Bible Verse',
    bio: 'Sharing God\'s Word daily. "Your word is a lamp to my feet and a light to my path." - Psalm 119:105',
    password: process.env.BOT_PASSWORD || 'SecureBot123!@#' // Set in env vars
  },
  {
    username: 'theology_quote_bot',
    email: 'quotes@theconnection.app',
    displayName: '✝️ Christian Wisdom',
    bio: 'Daily quotes from sound Christian theologians, pastors, and historical figures. Building faith through wisdom.',
    password: process.env.BOT_PASSWORD || 'SecureBot123!@#'
  }
];

async function createBotUser(config: BotConfig) {
  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, config.username))
      .limit(1);

    if (existingUser) {
      console.info(`Bot user "${config.username}" already exists (id: ${existingUser.id})`);
      return existingUser;
    }

    // Hash password
    const hashedPassword = await hashPassword(config.password);

    // Create bot user
    const [newUser] = await db
      .insert(users)
      .values({
        username: config.username,
        email: config.email,
        displayName: config.displayName,
        bio: config.bio,
        password: hashedPassword,
        emailVerified: true,
        onboardingCompleted: true,
        profileVisibility: 'public',
        showLocation: false,
      })
      .returning();

    console.info(`Created bot user "${config.username}" (id: ${newUser.id})`);
    return newUser;
  } catch (error) {
    console.error(`✗ Error creating bot "${config.username}":`, error);
    throw error;
  }
}

async function main() {
  console.info('Creating bot users...\n');

  for (const config of BOT_CONFIGS) {
    await createBotUser(config);
  }

  console.info('\n✓ All bot users ready');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
