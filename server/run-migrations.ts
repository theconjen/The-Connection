import { log } from "./vite.js";
import { runMigration as addLocalityInterests } from "./migrations/add-locality-interests";
import { isConnected } from "./db";

/**
 * Run all pending migrations in the correct order
 */
export async function runAllMigrations() {
  if (!isConnected) {
    log("❌ Database connection not available. Skipping migrations.");
    return false;
  }

  try {
    log("Starting database migrations");
    
    // Run the locality and interests migration
    const localityResult = await addLocalityInterests();
    if (!localityResult) {
      log("❌ Locality and interests migration failed");
      return false;
    }

    // Add more migrations here as needed
    
    log("✅ All migrations completed successfully");
    return true;
  } catch (error) {
    log("❌ Error running migrations: " + String(error));
    return false;
  }
}