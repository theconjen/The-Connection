/**
 * Check user permissions
 */

import "dotenv/config";
import { db } from './db';
import { userPermissions } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function checkPermissions(userId: number) {
  try {
    console.info(`Checking permissions for user ${userId}...`);

    const result = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    if (result.length > 0) {
      console.info('✅ User permissions found:');
      result.forEach(perm => {
        console.info(`  - ${perm.permission} (granted by user ${perm.grantedBy} at ${perm.grantedAt})`);
      });
    } else {
      console.info('❌ No permissions found for this user');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    process.exit(1);
  }
}

// Get user ID from command line args, default to 19 (Janelle)
const userId = parseInt(process.argv[2] || '19');
checkPermissions(userId);
