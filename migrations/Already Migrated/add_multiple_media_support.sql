-- Add multiple media support to microblogs and posts
-- Migration: add_multiple_media_support.sql

-- Add imageUrls (JSONB array) and videoUrl to microblogs
ALTER TABLE microblogs
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add imageUrls (JSONB array) and videoUrl to posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_microblogs_has_images ON microblogs ((image_urls != '[]'::jsonb));
CREATE INDEX IF NOT EXISTS idx_microblogs_has_video ON microblogs (video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_has_images ON posts ((image_urls != '[]'::jsonb));
CREATE INDEX IF NOT EXISTS idx_posts_has_video ON posts (video_url) WHERE video_url IS NOT NULL;

-- Migrate existing imageUrl data to imageUrls array
UPDATE microblogs
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != '' AND image_urls = '[]'::jsonb;

UPDATE posts
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != '' AND image_urls = '[]'::jsonb;
