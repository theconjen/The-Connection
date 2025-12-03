-- Add email verification columns to users table
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verification_token" text;
ALTER TABLE "users" ADD COLUMN "verification_token_expires" timestamp;
ALTER TABLE "users" ADD COLUMN "password_reset_token" text;
ALTER TABLE "users" ADD COLUMN "password_reset_expires" timestamp;

-- Create index for faster token lookups
CREATE INDEX "users_verification_token_idx" ON "users" ("verification_token");
CREATE INDEX "users_password_reset_token_idx" ON "users" ("password_reset_token");
