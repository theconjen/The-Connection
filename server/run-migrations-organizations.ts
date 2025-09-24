import { db } from "./db";
import { organizations, organizationUsers } from "@shared/schema";

export async function runOrganizationMigrations() {
  console.log("🏛️ [express] Starting organization schema migrations");
  
  try {
    // Create organizations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        admin_user_id INTEGER NOT NULL,
        plan TEXT DEFAULT 'free',
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        phone TEXT,
        denomination TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("✅ Organizations table created/verified");
    
    // Create organization_users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS organization_users (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("✅ Organization users table created/verified");
    
    // Add indexes for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
    `);
    
    console.log("✅ Organization indexes created");
    
    console.log("🏛️ [express] Organization migrations completed successfully");
  } catch (error) {
    console.error("❌ Organization migration failed:", error);
    throw error;
  }
}