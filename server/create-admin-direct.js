/**
 * Script to create an admin user account directly
 *
 * SECURITY: Admin credentials must be provided via environment variables
 * Set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script
 */
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import argon2 from 'argon2';

async function createAdminUser() {
  try {
    console.log('=== Creating Admin User ===');

    // Get admin credentials from environment variables
    const username = process.env.ADMIN_USERNAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    // Validate environment variables
    if (!username || !email || !password) {
      console.error('ERROR: Admin credentials not provided!');
      console.error('Please set the following environment variables:');
      console.error('  - ADMIN_USERNAME');
      console.error('  - ADMIN_EMAIL');
      console.error('  - ADMIN_PASSWORD (minimum 12 characters with complexity requirements)');
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 12) {
      console.error('ERROR: Admin password must be at least 12 characters long');
      process.exit(1);
    }
    
    // First, check if the isAdmin column exists
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    
    if (checkColumn.length === 0) {
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false
      `);
      console.log('Added isAdmin field to users table');
    }
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.username, username));
    
    if (existingUser.length > 0) {
      // Update existing user to admin
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.username, username));
      
      console.log(`User ${username} has been updated to admin status`);
    } else {
      // Create new admin user with Argon2id hashing
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        isAdmin: true
      });

      console.log(`Admin user ${username} has been created successfully`);
    }

    console.log('Admin credentials:');
    console.log(`Username: ${username}`);
    console.log('You can now login with these credentials');
    
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
}

// Run the script
createAdminUser();