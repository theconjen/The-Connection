import { log } from "./vite.js";
import { runMigration as addLocalityInterests } from "./migrations/add-locality-interests.js";
import { runMigration as createMvpTables } from "./migrations/0002_create_mvp_tables.js";
import { isConnected } from "./db.js";
async function runAllMigrations() {
  if (!isConnected) {
    log("\u274C Database connection not available. Skipping migrations.");
    return false;
  }
  try {
    log("Starting database migrations");
    const localityResult = await addLocalityInterests();
    if (!localityResult) {
      log("\u274C Locality and interests migration failed");
      return false;
    }
    const mvpResult = await createMvpTables();
    if (!mvpResult) {
      log("\u274C MVP tables migration failed");
      return false;
    }
    log("\u2705 All migrations completed successfully");
    return true;
  } catch (error) {
    log("\u274C Error running migrations: " + String(error));
    return false;
  }
}
export {
  runAllMigrations
};
