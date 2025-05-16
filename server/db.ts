import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Create a dummy pool and database connection for fallback when real DB is unavailable
const createConnection = () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    console.log("Attempting to connect to database...");
    const realPool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
      pool: realPool,
      db: drizzle({ client: realPool, schema }),
      isConnected: true
    };
  } catch (error) {
    console.error("Database connection failed, using mock mode:", error);
    // Return a mock DB object that won't throw errors
    const mockPool = {
      query: async () => ({ rows: [] }),
      end: async () => {},
      connect: async () => ({
        release: () => {},
        query: async () => ({ rows: [] })
      })
    } as unknown as Pool;
    
    return {
      pool: mockPool,
      db: drizzle({ client: mockPool, schema }),
      isConnected: false
    };
  }
};

const connection = createConnection();
export const pool = connection.pool;
export const db = connection.db;
export const isConnected = connection.isConnected;