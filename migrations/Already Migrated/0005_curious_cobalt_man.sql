ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_verification_code" text;