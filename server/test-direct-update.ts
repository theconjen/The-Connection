/**
 * Test direct database update for Christian fields
 */
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';
import 'dotenv/config';

async function testDirectUpdate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // Test update using Drizzle ORM
    const testData = {
      location: 'Shelby Township, MI',
      denomination: 'Baptist',
      homeChurch: 'First Baptist Church of Rochester Hills',
      favoriteBibleVerse: 'Psalm 86:5-7',
      testimony: 'Sinner saved by grace, through faith.',
      interests: 'Jesus'
    };

    console.info('[Test] Updating user 19 with:', testData);

    const result = await db.update(users)
      .set(testData)
      .where(eq(users.id, 19))
      .returning();

    console.info('[Test] Update result:', result.length > 0 ? 'success' : 'no rows affected');

    // Verify by reading back
    const readResult = await db.select().from(users).where(eq(users.id, 19));

    if (readResult.length > 0) {
      console.info('[Test] Verified fields:', {
        location: readResult[0].location,
        denomination: readResult[0].denomination,
        homeChurch: readResult[0].homeChurch,
        favoriteBibleVerse: readResult[0].favoriteBibleVerse,
        testimony: readResult[0].testimony,
        interests: readResult[0].interests
      });
    }

  } catch (error) {
    console.error('[Test] ❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

testDirectUpdate().catch(console.error);
