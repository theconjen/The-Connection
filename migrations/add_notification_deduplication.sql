-- Migration: Add notification deduplication and tracking fields
-- Purpose: Enable deduplication of notifications and structured tracking

-- Add new columns for notification source tracking and deduplication
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS source_type TEXT,
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- Create unique partial index on dedupe_key for unread notifications
-- This prevents duplicate unread notifications for the same action
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
ON notifications(user_id, dedupe_key)
WHERE is_read = false AND dedupe_key IS NOT NULL;

-- Create index for efficient unread notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- Create index for querying by source (useful for bulk operations)
CREATE INDEX IF NOT EXISTS idx_notifications_source
ON notifications(source_type, source_id)
WHERE source_type IS NOT NULL;

-- Add comment explaining the schema
COMMENT ON COLUMN notifications.source_type IS 'Type of entity that triggered notification (post, comment, community, event, dm, follow)';
COMMENT ON COLUMN notifications.source_id IS 'ID of the source entity as a string';
COMMENT ON COLUMN notifications.dedupe_key IS 'Unique key for deduplication: "{source_type}:{source_id}:{action}" e.g. "post:123:comment"';
