-- Migration: Add event status and enhanced location fields
-- Purpose: Enable soft delete (cancel) and better location tracking

-- Add status column for event state management
ALTER TABLE events
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- Add location provider for better geocoding
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location_provider TEXT;

-- Add place_id for Google Places / other providers
ALTER TABLE events
ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add location_text for human-readable address (fallback)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location_text TEXT;

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_events_status
ON events(status);

-- Create composite index for community events filtered by status
CREATE INDEX IF NOT EXISTS idx_events_community_status
ON events(community_id, status);

-- Create index for upcoming events (common query pattern)
CREATE INDEX IF NOT EXISTS idx_events_date_status
ON events(event_date, status)
WHERE status = 'ACTIVE';

-- Update existing events to ACTIVE status
UPDATE events
SET status = 'ACTIVE'
WHERE status IS NULL OR status = '';

-- Add constraint to ensure valid status values
ALTER TABLE events
ADD CONSTRAINT valid_event_status
CHECK (status IN ('ACTIVE', 'CANCELED', 'COMPLETED'));

-- Add comments for documentation
COMMENT ON COLUMN events.status IS 'Event status: ACTIVE (upcoming/ongoing), CANCELED (soft deleted), COMPLETED (past event)';
COMMENT ON COLUMN events.location_provider IS 'Provider used for location (google, mapbox, manual)';
COMMENT ON COLUMN events.place_id IS 'Place ID from location provider for consistent geocoding';
COMMENT ON COLUMN events.location_text IS 'Human-readable location text (full address)';
