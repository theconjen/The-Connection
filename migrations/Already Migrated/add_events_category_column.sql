-- Migration: Add category column to events table
-- This column was defined in the schema but never added to the database
-- It allows categorizing events (Sunday Service, Worship, Bible Study, etc.)

-- Add category column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN events.category IS 'Event type: Sunday Service, Worship, Bible Study, Prayer Meeting, Activity, etc.';
