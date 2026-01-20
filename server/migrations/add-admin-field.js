/**
 * Migration to add the isAdmin field to the users table
 */
import { db } from '../db.ts';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    
    // Check if the column already exists
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
    } else {
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runMigration();