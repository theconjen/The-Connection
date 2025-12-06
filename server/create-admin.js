/**
 * Script to create an admin user account
 */
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';
import argon2 from 'argon2';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdminUser() {
  try {
    console.log('=== Create Admin User ===');
    
    // First, run the migration to ensure the isAdmin field exists
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
    
    // Ask for admin credentials
    rl.question('Enter admin username: ', async (username) => {
      rl.question('Enter admin email: ', async (email) => {
        rl.question('Enter admin password: ', async (password) => {
          try {
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
            
            rl.close();
          } catch (error) {
            console.error('Error creating/updating admin user:', error);
            rl.close();
          }
        });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    rl.close();
  }
}

// Run the script
createAdminUser();