import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL as string);

console.log('neon client keys:', Object.keys(sql as any));

(async () => {
  try {
    // try a simple call to confirm functionality
    const now = await (sql as any)`SELECT NOW()`;
    console.log('select now result length:', (now && now.length) || 0);
  } catch (err) {
    console.error('neon call failed:', err);
  }
})();
