-- Add GIF support to microblogs and posts
-- Migration: add_gif_support.sql

-- Add gifUrl to microblogs
ALTER TABLE microblogs
ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Add gifUrl to posts
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS gif_url TEXT;

-- Create indexes for GIF columns
CREATE INDEX IF NOT EXISTS idx_microblogs_has_gif ON microblogs (gif_url) WHERE gif_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_has_gif ON posts (gif_url) WHERE gif_url IS NOT NULL;
