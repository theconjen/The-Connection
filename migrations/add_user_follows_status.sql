-- Migration: Add status column to user_follows for pending/accepted follow requests
-- Date: 2026-01-19

-- Add status column with default 'accepted' for existing rows (backward compatible)
ALTER TABLE user_follows
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_follows_status_check'
  ) THEN
    ALTER TABLE user_follows
    ADD CONSTRAINT user_follows_status_check
    CHECK (status IN ('pending', 'accepted'));
  END IF;
END $$;

-- Add index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON user_follows(status);

-- Add composite index for checking pending requests
CREATE INDEX IF NOT EXISTS idx_user_follows_following_status ON user_follows(following_id, status);
