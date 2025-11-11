/**
 * Script to update the admin user password with bcrypt hashing
 *
 * SECURITY: Provide credentials via environment variables
 * Set ADMIN_USERNAME and NEW_ADMIN_PASSWORD before running this script
 */
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function updateAdminPassword() {
  try {
    console.log('=== Updating Admin Password ===');

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

    // Hash password using bcrypt (salt rounds: 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username));

    console.log(`Admin password updated successfully for user: ${username}`);
    console.log('You can now login with the new credentials at /auth');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateAdminPassword();