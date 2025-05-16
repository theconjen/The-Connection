/**
 * Script to create an admin user account directly
 */
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    console.log('=== Creating Admin User ===');
    
    // Admin credentials
    const username = 'admin';
    const email = 'admin@example.com';
    const password = 'admin123'; // You should change this in production
    
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
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      
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
    console.log(`Password: ${password}`);
    console.log('You can now login with these credentials');
    
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
}

// Run the script
createAdminUser();