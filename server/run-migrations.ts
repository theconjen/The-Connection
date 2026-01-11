import { log } from "./vite-shim";
import { runMigration as addLocalityInterests } from "./migrations/add-locality-interests";
import { runMigration as createMvpTables } from "./migrations/0002_create_mvp_tables";
import { runMigration as addMessageReadStatus } from "./migrations/add-message-read-status";
import { runMigration as addDeletedAtColumns } from "./migrations/add-deleted-at-columns";
import { runMigration as addFeedFeatures } from "./migrations/add-feed-features";
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

    // Add message read status fields
    const messageReadStatusResult = await addMessageReadStatus();
    if (!messageReadStatusResult) {
      log("❌ Message read status migration failed");
      return false;
    }

    // Add deleted_at columns to posts and comments
    const deletedAtResult = await addDeletedAtColumns();
    if (!deletedAtResult) {
      log("❌ Add deleted_at columns migration failed");
      return false;
    }

    // Add feed and forum features (downvotes, reposts, bookmarks)
    const feedFeaturesResult = await addFeedFeatures();
    if (!feedFeaturesResult) {
      log("❌ Add feed features migration failed");
      return false;
    }

    log("✅ All migrations completed successfully");
    return true;
  } catch (error) {
    log("❌ Error running migrations: " + String(error));
    return false;
  }
}