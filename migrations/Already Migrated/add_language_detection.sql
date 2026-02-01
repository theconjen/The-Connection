-- Add language detection and personalization
-- Migration: add_language_detection.sql

-- Add language field to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10);
CREATE INDEX IF NOT EXISTS idx_posts_language ON posts(detected_language);

-- Add language field to microblogs
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10);
CREATE INDEX IF NOT EXISTS idx_microblogs_language ON microblogs(detected_language);

-- Add preferred languages to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_languages JSONB DEFAULT '["en"]'::jsonb;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS language_engagement JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Create function to update language engagement when user likes content
CREATE OR REPLACE FUNCTION update_language_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be called when a user likes a post or microblog
  -- Update user_preferences.language_engagement based on liked content's language
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN posts.detected_language IS 'ISO 639-1 language code (e.g., en, ar, es)';
COMMENT ON COLUMN microblogs.detected_language IS 'ISO 639-1 language code (e.g., en, ar, es)';
COMMENT ON COLUMN user_preferences.preferred_languages IS 'Array of preferred language codes based on engagement';
COMMENT ON COLUMN user_preferences.language_engagement IS 'JSON object tracking engagement per language: {"en": 45, "ar": 12, "es": 3}';
