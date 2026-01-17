/**
 * Grant inbox_access permission to a user
 */

import "dotenv/config";
import { db } from './db';
import { userPermissions } from '@shared/schema';

async function grantInboxAccess(userId: number) {
  try {
    console.info(`Granting inbox_access to user ${userId}...`);

    const result = await db
      .insert(userPermissions)
      .values({
        userId,
        permission: 'inbox_access',
        grantedBy: userId,
        grantedAt: new Date()
      } as any)
      .onConflictDoNothing()
      .returning();

    if (result.length > 0) {
      console.info('✅ Successfully granted inbox_access:', result[0]);
    } else {
      console.info('ℹ️  Permission already exists for this user');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error granting permission:', error);
    process.exit(1);
  }
}

// Get user ID from command line args, default to 19 (Janelle)
const userId = parseInt(process.argv[2] || '19');
grantInboxAccess(userId);
