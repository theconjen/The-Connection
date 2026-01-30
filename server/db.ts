import { WebSocket } from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";
import { envConfig } from "./config/env";

// SECURITY: DATABASE_URL must be provided via environment variable
const databaseUrl = envConfig.databaseUrl;
const useDb = envConfig.useDb;

if (!databaseUrl) {
  if (useDb) {
    console.error("FATAL ERROR: DATABASE_URL environment variable is required when USE_DB=true");
    console.error("Please set DATABASE_URL in your environment variables");
    console.error("Example: postgresql://user:password@host:5432/database");
    throw new Error("DATABASE_URL must be set before enabling database access.");
  } else {
    console.warn("Skipping database initialization because DATABASE_URL is not set and USE_DB !== 'true'.");
  }
}

export const isConnected = Boolean(databaseUrl && useDb);

let sqlInstance: ReturnType<typeof neon> | undefined;
let poolInstance: Pool | undefined;

if (isConnected && databaseUrl) {
  sqlInstance = neon(databaseUrl);
  // Neon serverless pool - keep options minimal for compatibility
  poolInstance = new Pool({
    connectionString: databaseUrl,
    max: 10, // Maximum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Fail fast if can't connect
  });
}

export const sql = sqlInstance;
export const pool = poolInstance;
export const db = sqlInstance ? drizzle(sqlInstance, { schema }) : undefined;

