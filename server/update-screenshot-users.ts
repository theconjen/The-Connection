import 'dotenv/config';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SCREENSHOT_FLAG = '[SCREENSHOT]';

async function updateScreenshotUsers() {

  try {
    // Find all screenshot users
    const allUsers = await db.select().from(users);
    const screenshotUsers = allUsers.filter(u => u.bio?.includes(SCREENSHOT_FLAG));


    for (const user of screenshotUsers) {
      await db.update(users)
        .set({
          emailVerified: true,
          onboardingCompleted: true,
        })
        .where(eq(users.id, user.id));

    }

  } catch (error) {
    console.error('❌ Error updating screenshot users:', error);
    throw error;
  }

  process.exit(0);
}

updateScreenshotUsers().catch(console.error);
