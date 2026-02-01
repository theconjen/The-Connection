-- Migration: Add event_end_date column for multi-day events (conferences)
-- This allows events to span multiple days with separate start and end dates

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_end_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN events.event_end_date IS 'End date for multi-day events like conferences. NULL for single-day events.';
