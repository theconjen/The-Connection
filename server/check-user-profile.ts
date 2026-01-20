/**
 * Check user profile data in production database
 */
import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

async function checkUserProfile() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Find user named "Janelle"
    const result = await pool.query(`
      SELECT id, username, display_name, bio,
             location, denomination, home_church,
             favorite_bible_verse, testimony, interests,
             created_at, updated_at
      FROM users
      WHERE username = 'Janelle'
      LIMIT 1;
    `);

    if (result.rows.length === 0) {
      return;
    }

    );

    // Check if Christian fields are populated
    const user = result.rows[0];
    const hasChristianFields =
      user.location ||
      user.denomination ||
      user.home_church ||
      user.favorite_bible_verse ||
      user.testimony ||
      user.interests;

    if (hasChristianFields) {
    } else {
    }

  } catch (error) {
    console.error('[Check] ❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkUserProfile().catch(console.error);
