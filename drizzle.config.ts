import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Export it or place it in your .env before running Drizzle commands.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./packages/shared/src/schema.ts",
  driver: "pg",
  dbCredentials: {
    url: databaseUrl,
  },
});
