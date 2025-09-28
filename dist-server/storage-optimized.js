import { DbStorage } from "./storage-db-only.js";
const storage = new DbStorage();
if (process.env.NODE_ENV === "development") {
  console.log("\u{1F680} Using optimized database-only storage (MemStorage removed for performance)");
}
export {
  storage
};
