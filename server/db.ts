import { WebSocket } from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// SECURITY: DATABASE_URL must be provided via environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("FATAL ERROR: DATABASE_URL environment variable is required");
  console.error("Please set DATABASE_URL in your environment variables");
  console.error("Example: postgresql://user:password@host:5432/database");
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a Neon connection
console.log("Attempting to connect to database...");
export const sql = neon(databaseUrl);

// Create a pool for session store
export const pool = new Pool({ connectionString: databaseUrl });

// Create a Drizzle instance
export const db = drizzle(sql, { schema });
export const isConnected = true;

// Test the database connection
// sql`SELECT NOW()`
//   .then(() => {
//     console.log('✅ Database connection successful');
//   })
//   .catch(err => {
//     console.error('❌ Database connection failed:', err.message);
//   });