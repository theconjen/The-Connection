-- Migration: Make events.community_id nullable
-- Date: 2026-01-18
-- Description: Allow events without a community (hosted by "The Connection")
-- Only the app owner (rawaselou) can create these events

-- Drop the NOT NULL constraint on community_id
ALTER TABLE events ALTER COLUMN community_id DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN events.community_id IS 'FK to communities table - nullable for app-wide events hosted by The Connection';
