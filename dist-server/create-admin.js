import { db } from "./db.js";
import { users } from "../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
async function createAdminUser() {
  try {
    console.log("=== Creating Admin User ===");
    const username = "admin";
    const email = "admin@example.com";
    const password = "admin123";
    const checkColumnResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_admin'
    `);
    const checkColumn = checkColumnResult.rows;
    if (checkColumn.length === 0) {
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false
      `);
      console.log("Added isAdmin field to users table");
    }
    const existingUser = await db.select().from(users).where(eq(users.username, username));
    if (existingUser.length > 0) {
      await db.execute(sql`
        UPDATE users SET is_admin = true WHERE username = ${username}
      `);
      console.log(`User ${username} has been updated to admin status`);
    } else {
      const scryptAsync = promisify(scrypt);
      const salt = randomBytes(16).toString("hex");
      const buf = await scryptAsync(password, salt, 64);
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      await db.execute(sql`
        INSERT INTO users (username, email, password, is_admin) VALUES (${username}, ${email}, ${hashedPassword}, true)
      `);
      console.log(`Admin user ${username} has been created successfully`);
    }
    console.log("Admin credentials:");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("You can now login with these credentials at /auth");
  } catch (error) {
    console.error("Error creating/updating admin user:", error);
  } finally {
    process.exit(0);
  }
}
createAdminUser();
