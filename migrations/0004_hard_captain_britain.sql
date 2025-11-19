ALTER TABLE "users" ADD COLUMN "notify_dms" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_communities" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_forums" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_feed" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dm_privacy" text DEFAULT 'everyone';