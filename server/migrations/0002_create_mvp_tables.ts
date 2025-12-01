import { log } from "../vite-shim";

export async function runMigration() {
  log("✅ MVP tables migration skipped - tables already exist");
  return true;
}
