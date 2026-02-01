ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_receiver_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "bible_reading_plans" ALTER COLUMN "readings" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ALTER COLUMN "completed_days" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ALTER COLUMN "completed_days" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ALTER COLUMN "completed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "challenge_participants" ALTER COLUMN "progress" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "challenge_participants" ALTER COLUMN "progress" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "challenge_participants" ALTER COLUMN "completed_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "goals" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "start_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "end_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "communities" ALTER COLUMN "interest_tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "community_invitations" ALTER COLUMN "expires_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "event_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "start_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "end_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "livestreams" ALTER COLUMN "scheduled_for" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ALTER COLUMN "spiritual_gifts" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "mentor_profiles" ALTER COLUMN "areas_of_expertise" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ALTER COLUMN "start_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ALTER COLUMN "start_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ALTER COLUMN "end_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ALTER COLUMN "goals" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "tags" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "service_projects" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "service_projects" ALTER COLUMN "start_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "service_projects" ALTER COLUMN "end_time" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "sid" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "sess" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_creator_tiers" ALTER COLUMN "valid_until" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "user_interactions" ALTER COLUMN "metadata" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "interests" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "interests" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "favorite_topics" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "favorite_topics" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "engagement_history" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "engagement_history" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "verse_memorization" ALTER COLUMN "start_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "verse_memorization" ALTER COLUMN "start_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verse_memorization" ALTER COLUMN "mastered_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "verse_memorization" ALTER COLUMN "review_dates" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "verse_memorization" ALTER COLUMN "review_dates" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "mission" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "service_times" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "social_media" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "founded_date" date;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "congregation_size" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "latitude" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "longitude" text;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
ALTER TABLE "livestreams" DROP COLUMN "stream_url";--> statement-breakpoint
ALTER TABLE "livestreams" DROP COLUMN "is_live";