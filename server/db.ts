import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// For development MVP, use a simple DATABASE_URL if not set
const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/theconnection";

if (!databaseUrl) {
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