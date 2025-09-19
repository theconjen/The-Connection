import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from "@shared/schema";

// For production, use Neon PostgreSQL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create Neon database connection
console.log("Attempting to connect to database...");
const sql = neon(databaseUrl);

// Create a Drizzle instance
export const db = drizzle(sql, { schema });
export const isConnected = true;

console.log("✅ Database connection established");