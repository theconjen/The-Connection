/**
 * Script to update the admin user password with Argon2 hashing
 *
 * SECURITY: Provide credentials via environment variables
 * Set ADMIN_USERNAME and NEW_ADMIN_PASSWORD before running this script
 */
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './utils/passwords';

async function updateAdminPassword() {
  try {

    // Get credentials from environment variables
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.NEW_ADMIN_PASSWORD;

    // Validate environment variables
    if (!username || !password) {
      console.error('ERROR: Admin credentials not provided!');
      console.error('Please set the following environment variables:');
      console.error('  - ADMIN_USERNAME (username of the admin to update)');
      console.error('  - NEW_ADMIN_PASSWORD (minimum 12 characters with complexity requirements)');
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 12) {
      console.error('ERROR: Admin password must be at least 12 characters long');
      process.exit(1);
    }

    // Hash password using Argon2id
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username));

    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateAdminPassword();