import { WebSocket } from "ws";
globalThis.WebSocket = WebSocket;
import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./shared/schema.js";
const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/theconnection";
if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
console.log("Attempting to connect to database...");
const sql = neon(databaseUrl);
const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(sql, { schema });
const isConnected = true;
export {
  db,
  isConnected,
  pool,
  sql
};
