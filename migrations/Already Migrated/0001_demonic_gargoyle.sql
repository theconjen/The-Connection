ALTER TABLE "apologist_scholar_applications" ALTER COLUMN "reviewed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "apologist_scholar_applications" ALTER COLUMN "submitted_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "apologist_scholar_applications" ALTER COLUMN "submitted_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ALTER COLUMN "started_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ALTER COLUMN "started_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "challenge_participants" ALTER COLUMN "joined_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "challenge_participants" ALTER COLUMN "joined_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "collection_resources" ALTER COLUMN "added_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "collection_resources" ALTER COLUMN "added_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "livestream_gifts" ALTER COLUMN "sent_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "livestream_gifts" ALTER COLUMN "sent_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "livestreamer_applications" ALTER COLUMN "reviewed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "livestreamer_applications" ALTER COLUMN "submitted_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "livestreamer_applications" ALTER COLUMN "submitted_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_creator_tiers" ALTER COLUMN "assigned_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user_creator_tiers" ALTER COLUMN "assigned_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "latitude";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "longitude";