-- Migration: Add constraints and indexes to user_follows table
-- Date: 2026-01-19

-- Add UNIQUE constraint to prevent duplicate follows
-- Using DO $$ block to handle case where constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_follows_follower_following_unique'
  ) THEN
    ALTER TABLE user_follows
    ADD CONSTRAINT user_follows_follower_following_unique
    UNIQUE (follower_id, following_id);
  END IF;
END $$;

-- Add CHECK constraint to prevent self-follow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_follows_no_self_follow'
  ) THEN
    ALTER TABLE user_follows
    ADD CONSTRAINT user_follows_no_self_follow
    CHECK (follower_id != following_id);
  END IF;
END $$;

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
