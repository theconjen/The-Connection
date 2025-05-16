/**
 * Script to update the admin user password to use scrypt hashing
 */
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

async function updateAdminPassword() {
  try {
    console.log('=== Updating Admin Password ===');
    
    // Admin credentials
    const username = 'admin';
    const password = 'admin123'; // Using the same password
    
    // Hash password using scrypt (same method as in auth.ts)
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    // Update the user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, username));
    
    console.log(`Admin password updated successfully`);
    console.log('Admin credentials:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('You can now login with these credentials at /auth');
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateAdminPassword();