-- Migration: Add event_bookmarks table
-- This table tracks user bookmarks on events, similar to post_bookmarks

CREATE TABLE IF NOT EXISTS event_bookmarks (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS event_bookmarks_event_user_idx
ON event_bookmarks(event_id, user_id);

-- Add index for efficient lookups by user
CREATE INDEX IF NOT EXISTS event_bookmarks_user_idx
ON event_bookmarks(user_id);
