// IMPORTANT: Load dotenv FIRST before any other imports
import "dotenv/config";

import { db, isConnected } from "./db";
import { sql } from "drizzle-orm";

/**
 * Migration: Make events.community_id required
 * Events must always belong to a community
 */
export async function runMigration(): Promise<boolean> {
  if (!isConnected) {
    console.log("❌ Database connection not available");
    return false;
  }

  try {
    console.log("🔄 Starting migration: Make events.community_id required");

    // Step 1: Check if there are any events without a community_id
    const eventsWithoutCommunity = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM events
      WHERE community_id IS NULL
    `);

    const count = eventsWithoutCommunity.rows[0]?.count || 0;

    if (parseInt(count as string) > 0) {
      console.log(`⚠️  Found ${count} events without a community_id`);
      console.log("❌ Cannot proceed: All events must have a community_id before making it required");
      console.log("   Please assign communities to these events first, or delete them");
      return false;
    }

    console.log("✓ All events have a community_id");

    // Step 2: Add NOT NULL constraint
    await db.execute(sql`
      ALTER TABLE events
      ALTER COLUMN community_id SET NOT NULL
    `);

    console.log("✓ Added NOT NULL constraint to events.community_id");

    // Step 3: Add documentation comment
    await db.execute(sql`
      COMMENT ON COLUMN events.community_id IS 'Events must belong to a community - this field is required'
    `);

    console.log("✓ Added column comment");

    console.log("✅ Migration completed successfully: events.community_id is now required");
    return true;
  } catch (error) {
    console.log("❌ Migration failed:", error);
    return false;
  }
}

// Run migration if this file is executed directly
const isMainModule = process.argv[1]?.endsWith('run-community-id-required-migration.ts');

if (isMainModule) {
  runMigration()
    .then((success) => {
      if (success) {
        console.log("✅ Migration completed successfully");
        process.exit(0);
      } else {
        console.log("❌ Migration failed");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.log("❌ Migration error:", error);
      process.exit(1);
    });
}
