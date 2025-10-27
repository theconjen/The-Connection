import viteHelpers from "./vite.cjs";
const { log } = viteHelpers;
import { runMigration as addLocalityInterests } from "./migrations/add-locality-interests";
import { runMigration as createMvpTables } from "./migrations/0002_create_mvp_tables";
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

    // Create MVP tables
    const mvpResult = await createMvpTables();
    if (!mvpResult) {
      log("❌ MVP tables migration failed");
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