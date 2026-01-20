/**
 * Bible Verse Bot
 *
 * Automatically posts daily Bible verses to the feed
 * Uses Bible API to fetch verses
 */

import axios from 'axios';
import { db } from '../db';
import { users, microblogs } from '../../packages/shared/src/schema';
import { eq } from 'drizzle-orm';

const BOT_USERNAME = 'bibleverse_bot';

// Popular and impactful verses for daily posting
const VERSE_REFERENCES = [
  'John 3:16',
  'Philippians 4:13',
  'Jeremiah 29:11',
  'Romans 8:28',
  'Proverbs 3:5-6',
  'Psalm 23:1-4',
  'Isaiah 41:10',
  'Matthew 28:20',
  'Psalm 46:1',
  'Romans 8:38-39',
  'Joshua 1:9',
  'Psalm 119:105',
  'Matthew 6:33',
  'Proverbs 18:10',
  '2 Timothy 1:7',
  'Psalm 91:1-2',
  '1 Corinthians 13:4-7',
  'Galatians 5:22-23',
  'Ephesians 2:8-9',
  'Romans 12:2',
  'James 1:2-4',
  'Colossians 3:23',
  'Hebrews 11:1',
  'Matthew 5:14-16',
  'Psalm 27:1',
  '1 John 4:19',
  'Isaiah 40:31',
  'Proverbs 16:3',
  'Psalm 37:4',
  'Romans 5:8',
];

interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

/**
 * Fetch verse from Bible API
 * Using bible-api.com (free, no auth required)
 */
async function fetchBibleVerse(reference: string): Promise<BibleVerse | null> {
  try {
    // bible-api.com - Free Bible API
    const response = await axios.get(`https://bible-api.com/${encodeURIComponent(reference)}`);

    if (response.data && response.data.text) {
      return {
        reference: response.data.reference || reference,
        text: response.data.text.trim(),
        translation: response.data.translation_name || 'KJV'
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching verse ${reference}:`, error);
    return null;
  }
}

/**
 * Get random verse reference from the list
 */
function getRandomVerseReference(): string {
  const randomIndex = Math.floor(Math.random() * VERSE_REFERENCES.length);
  return VERSE_REFERENCES[randomIndex];
}

/**
 * Format verse for posting
 */
function formatVersePost(verse: BibleVerse): string {
  // Clean up the text (remove extra whitespace, newlines)
  const cleanText = verse.text.replace(/\s+/g, ' ').trim();

  return `📖 ${verse.reference} (${verse.translation})\n\n"${cleanText}"\n\n#BibleVerse #DailyScripture #Faith`;
}

/**
 * Get bot user ID
 */
async function getBotUserId(): Promise<number> {
  const [bot] = await db
    .select()
    .from(users)
    .where(eq(users.username, BOT_USERNAME))
    .limit(1);

  if (!bot) {
    throw new Error(`Bot user "${BOT_USERNAME}" not found. Run create-bot-users.ts first.`);
  }

  return bot.id;
}

/**
 * Post verse to feed (microblogs)
 */
async function postVerse(userId: number, content: string): Promise<void> {
  try {
    await db.insert(microblogs).values({
      userId,
      content,
      createdAt: new Date(),
    });

  } catch (error) {
    console.error('Error posting verse:', error);
    throw error;
  }
}

/**
 * Main function - Post a Bible verse
 */
async function main() {

  try {
    // Get bot user ID
    const botUserId = await getBotUserId();

    // Get random verse reference
    const reference = getRandomVerseReference();

    // Fetch verse from API
    const verse = await fetchBibleVerse(reference);

    if (!verse) {
      throw new Error(`Failed to fetch verse: ${reference}`);
    }


    // Format post
    const postContent = formatVersePost(verse);
    );
    );

    // Post to feed
    await postVerse(botUserId, postContent);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as postBibleVerse };
