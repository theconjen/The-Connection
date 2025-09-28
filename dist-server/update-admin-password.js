import { db } from "./db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
async function updateAdminPassword() {
  try {
    console.log("=== Updating Admin Password ===");
    const username = "admin";
    const password = "admin123";
    const scryptAsync = promisify(scrypt);
    const salt = randomBytes(16).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    const result = await db.update(users).set({ password: hashedPassword }).where(eq(users.username, username));
    console.log(`Admin password updated successfully`);
    console.log("Admin credentials:");
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("You can now login with these credentials at /auth");
  } catch (error) {
    console.error("Error updating admin password:", error);
  } finally {
    process.exit(0);
  }
}
updateAdminPassword();
