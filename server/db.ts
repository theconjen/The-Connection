import { WebSocket } from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;
const useDb = process.env.USE_DB === 'true';

if (!databaseUrl) {
  if (useDb) {
    throw new Error('DATABASE_URL must be set when USE_DB=true');
  } else {
    console.warn('DATABASE_URL not set; database connections are disabled. Set USE_DB=true with a valid URL to enable Postgres features.');
  }
}

export const isConnected = Boolean(databaseUrl && useDb);

let sqlInstance: ReturnType<typeof neon> | undefined;
let poolInstance: Pool | undefined;

if (isConnected && databaseUrl) {
  console.log("Attempting to connect to database...");
  sqlInstance = neon(databaseUrl);
  poolInstance = new Pool({ connectionString: databaseUrl });
}

export const sql = sqlInstance;
export const pool = poolInstance;
export const db = sqlInstance ? drizzle(sqlInstance, { schema }) : undefined;

// Test the database connection
// sql`SELECT NOW()`
//   .then(() => {
//     console.log('✅ Database connection successful');
//   })
//   .catch(err => {
//     console.error('❌ Database connection failed:', err.message);
//   });