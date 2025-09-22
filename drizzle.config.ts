import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("psql 'postgresql://neondb_owner:npg_MfB8mlWiSkN4@ep-hidden-band-adzjfzr3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
