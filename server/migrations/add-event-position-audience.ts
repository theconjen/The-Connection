import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add image_position, target_gender, target_age_group columns to events table
 * - image_position: Controls which part of the flyer shows on event cards (0-100 or legacy top/center/bottom)
 * - target_gender: Target audience gender (men, women, or null for all)
 * - target_age_group: Target audience age group (comma-separated: kids, teens, young_adults, adults, seniors)
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add image_position, target_gender, target_age_group to events");

    await db.execute(
      sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center'`
    );
    log("Added image_position column to events table");

    await db.execute(
      sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS target_gender TEXT`
    );
    log("Added target_gender column to events table");

    await db.execute(
      sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS target_age_group TEXT`
    );
    log("Added target_age_group column to events table");

    log("Migration completed: add-event-position-audience");
    return true;
  } catch (error) {
    log(`Migration failed: add-event-position-audience - ${String(error)}`);
    return false;
  }
}
