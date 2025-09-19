CREATE TABLE "apologetics_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"question_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"is_verified_answer" boolean DEFAULT false,
	"upvotes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apologetics_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer NOT NULL,
	"topic_id" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"answer_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apologetics_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"icon_name" text NOT NULL,
	"url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apologetics_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "apologetics_topics_name_unique" UNIQUE("name"),
	CONSTRAINT "apologetics_topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "apologist_scholar_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"full_name" text NOT NULL,
	"academic_credentials" text NOT NULL,
	"educational_background" text NOT NULL,
	"theological_perspective" text NOT NULL,
	"statement_of_faith" text NOT NULL,
	"areas_of_expertise" text NOT NULL,
	"published_works" text,
	"prior_apologetics_experience" text NOT NULL,
	"writing_sample" text NOT NULL,
	"online_social_handles" text,
	"reference_name" text NOT NULL,
	"reference_contact" text NOT NULL,
	"reference_institution" text NOT NULL,
	"motivation" text NOT NULL,
	"weekly_time_commitment" text NOT NULL,
	"agreed_to_guidelines" boolean NOT NULL,
	"reviewed_by" integer,
	"review_notes" text,
	"reviewed_at" text,
	"submitted_at" text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE "bible_reading_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"duration" integer NOT NULL,
	"readings" text NOT NULL,
	"creator_id" integer,
	"group_id" integer,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bible_reading_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"current_day" integer DEFAULT 1,
	"completed_days" text DEFAULT '[]',
	"started_at" text DEFAULT 'CURRENT_TIMESTAMP',
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "bible_study_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"group_id" integer,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"passage" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenge_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"progress" text DEFAULT '{}',
	"is_completed" boolean DEFAULT false,
	"joined_at" text DEFAULT 'CURRENT_TIMESTAMP',
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "challenge_testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"duration" integer NOT NULL,
	"goals" text NOT NULL,
	"creator_id" integer NOT NULL,
	"group_id" integer,
	"community_id" integer,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"chat_room_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"is_system_message" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collection_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"added_at" text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" integer,
	"parent_id" integer,
	"upvotes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"slug" text NOT NULL,
	"icon_name" text NOT NULL,
	"icon_color" text NOT NULL,
	"interest_tags" text,
	"city" text,
	"state" text,
	"is_local_community" boolean DEFAULT false,
	"latitude" text,
	"longitude" text,
	"member_count" integer DEFAULT 0,
	"is_private" boolean DEFAULT false,
	"has_private_wall" boolean DEFAULT false,
	"has_public_wall" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	CONSTRAINT "communities_name_unique" UNIQUE("name"),
	CONSTRAINT "communities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_chat_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"inviter_user_id" integer NOT NULL,
	"invitee_email" text NOT NULL,
	"invitee_user_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" text NOT NULL,
	CONSTRAINT "community_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_wall_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"community_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"is_private" boolean DEFAULT false,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_type" text NOT NULL,
	"content_id" integer NOT NULL,
	"score" integer NOT NULL,
	"reason" text,
	"is_viewed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text NOT NULL,
	"benefits" text NOT NULL,
	"icon_name" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"is_virtual" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"show_on_map" boolean DEFAULT true,
	"virtual_meeting_url" text,
	"event_date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"image_url" text,
	"latitude" text,
	"longitude" text,
	"community_id" integer,
	"group_id" integer,
	"creator_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_admin" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_name" text NOT NULL,
	"icon_color" text NOT NULL,
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "livestream_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"livestream_id" integer NOT NULL,
	"gift_id" integer NOT NULL,
	"sender_id" integer,
	"receiver_id" integer NOT NULL,
	"message" text,
	"sent_at" text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE "livestreamer_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ministry_name" text,
	"ministry_description" text NOT NULL,
	"ministerial_experience" text,
	"statement_of_faith" text NOT NULL,
	"social_media_links" text,
	"reference_name" text NOT NULL,
	"reference_contact" text NOT NULL,
	"reference_relationship" text NOT NULL,
	"sample_content_url" text NOT NULL,
	"livestream_topics" text NOT NULL,
	"target_audience" text NOT NULL,
	"agreed_to_terms" boolean NOT NULL,
	"reviewed_by" integer,
	"review_notes" text,
	"reviewed_at" text,
	"submitted_at" text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE "livestreams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"host_id" integer NOT NULL,
	"thumbnail" text,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"viewer_count" integer DEFAULT 0,
	"scheduled_for" text,
	"duration" text,
	"tags" text,
	"stream_url" text,
	"is_live" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentor_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"spiritual_gifts" text,
	"areas_of_expertise" text,
	"years_of_faith" integer,
	"short_bio" text NOT NULL,
	"availability" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentorship_relationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"mentee_id" integer NOT NULL,
	"start_date" text DEFAULT 'CURRENT_TIMESTAMP',
	"end_date" text,
	"is_active" boolean DEFAULT true,
	"goals" text
);
--> statement-breakpoint
CREATE TABLE "mentorship_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" integer NOT NULL,
	"mentee_id" integer NOT NULL,
	"message" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microblog_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"microblog_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "microblogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"author_id" integer NOT NULL,
	"community_id" integer,
	"group_id" integer,
	"like_count" integer DEFAULT 0,
	"repost_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member',
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"admin_user_id" integer NOT NULL,
	"plan" text DEFAULT 'free',
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"website" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"phone" text,
	"denomination" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"community_id" integer,
	"group_id" integer,
	"author_id" integer,
	"upvotes" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"privacy_level" text NOT NULL,
	"group_id" integer,
	"author_id" integer NOT NULL,
	"prayer_count" integer DEFAULT 0,
	"is_answered" boolean DEFAULT false,
	"answered_description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prayers" (
	"id" serial PRIMARY KEY NOT NULL,
	"prayer_request_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"creator_id" integer NOT NULL,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"author" text,
	"image_url" text,
	"tags" text,
	"average_rating" integer DEFAULT 0,
	"submitter_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"date" text,
	"start_time" text,
	"end_time" text,
	"organizer_id" integer NOT NULL,
	"community_id" integer,
	"group_id" integer,
	"volunteer_limit" integer,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_volunteers" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text NOT NULL,
	"hours_served" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" text PRIMARY KEY NOT NULL,
	"sess" text NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_creator_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tier_id" integer NOT NULL,
	"assigned_at" text DEFAULT 'CURRENT_TIMESTAMP',
	"valid_until" text
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"content_id" integer NOT NULL,
	"content_type" text NOT NULL,
	"interaction_type" text NOT NULL,
	"interaction_strength" integer DEFAULT 1,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"interests" text DEFAULT '[]',
	"favorite_topics" text DEFAULT '[]',
	"engagement_history" text DEFAULT '[]',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"latitude" text,
	"longitude" text,
	"onboarding_completed" boolean DEFAULT false,
	"is_verified_apologetics_answerer" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verse_memorization" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"verse" text NOT NULL,
	"reference" text NOT NULL,
	"start_date" text DEFAULT 'CURRENT_TIMESTAMP',
	"mastered_date" text,
	"review_dates" text DEFAULT '[]',
	"reminder_frequency" integer
);
--> statement-breakpoint
CREATE TABLE "virtual_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_name" text NOT NULL,
	"value" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "apologetics_answers" ADD CONSTRAINT "apologetics_answers_question_id_apologetics_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."apologetics_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apologetics_answers" ADD CONSTRAINT "apologetics_answers_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apologetics_questions" ADD CONSTRAINT "apologetics_questions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apologetics_questions" ADD CONSTRAINT "apologetics_questions_topic_id_apologetics_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."apologetics_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apologist_scholar_applications" ADD CONSTRAINT "apologist_scholar_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apologist_scholar_applications" ADD CONSTRAINT "apologist_scholar_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_reading_plans" ADD CONSTRAINT "bible_reading_plans_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_reading_plans" ADD CONSTRAINT "bible_reading_plans_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ADD CONSTRAINT "bible_reading_progress_plan_id_bible_reading_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."bible_reading_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_reading_progress" ADD CONSTRAINT "bible_reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_study_notes" ADD CONSTRAINT "bible_study_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bible_study_notes" ADD CONSTRAINT "bible_study_notes_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_testimonials" ADD CONSTRAINT "challenge_testimonials_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_testimonials" ADD CONSTRAINT "challenge_testimonials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_room_id_community_chat_rooms_id_fk" FOREIGN KEY ("chat_room_id") REFERENCES "public"."community_chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_resources" ADD CONSTRAINT "collection_resources_collection_id_resource_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."resource_collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_resources" ADD CONSTRAINT "collection_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_chat_rooms" ADD CONSTRAINT "community_chat_rooms_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_chat_rooms" ADD CONSTRAINT "community_chat_rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_inviter_user_id_users_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_invitee_user_id_users_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_wall_posts" ADD CONSTRAINT "community_wall_posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_wall_posts" ADD CONSTRAINT "community_wall_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_gifts" ADD CONSTRAINT "livestream_gifts_livestream_id_livestreams_id_fk" FOREIGN KEY ("livestream_id") REFERENCES "public"."livestreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_gifts" ADD CONSTRAINT "livestream_gifts_gift_id_virtual_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."virtual_gifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_gifts" ADD CONSTRAINT "livestream_gifts_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestream_gifts" ADD CONSTRAINT "livestream_gifts_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreamer_applications" ADD CONSTRAINT "livestreamer_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreamer_applications" ADD CONSTRAINT "livestreamer_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestreams" ADD CONSTRAINT "livestreams_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relationships" ADD CONSTRAINT "mentorship_relationships_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microblog_likes" ADD CONSTRAINT "microblog_likes_microblog_id_microblogs_id_fk" FOREIGN KEY ("microblog_id") REFERENCES "public"."microblogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microblog_likes" ADD CONSTRAINT "microblog_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microblogs" ADD CONSTRAINT "microblogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microblogs" ADD CONSTRAINT "microblogs_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microblogs" ADD CONSTRAINT "microblogs_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microblogs" ADD CONSTRAINT "microblogs_parent_id_microblogs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."microblogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_prayer_request_id_prayer_requests_id_fk" FOREIGN KEY ("prayer_request_id") REFERENCES "public"."prayer_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_collections" ADD CONSTRAINT "resource_collections_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_ratings" ADD CONSTRAINT "resource_ratings_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_ratings" ADD CONSTRAINT "resource_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_projects" ADD CONSTRAINT "service_projects_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_projects" ADD CONSTRAINT "service_projects_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_projects" ADD CONSTRAINT "service_projects_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_testimonials" ADD CONSTRAINT "service_testimonials_project_id_service_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."service_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_testimonials" ADD CONSTRAINT "service_testimonials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_volunteers" ADD CONSTRAINT "service_volunteers_project_id_service_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."service_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_volunteers" ADD CONSTRAINT "service_volunteers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_creator_tiers" ADD CONSTRAINT "user_creator_tiers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_creator_tiers" ADD CONSTRAINT "user_creator_tiers_tier_id_creator_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."creator_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_memorization" ADD CONSTRAINT "verse_memorization_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;