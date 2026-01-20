-- Migration: Make events.community_id required
-- Events must always belong to a community

-- First, update any existing events without a community_id to a default/dummy value
-- (This step may not be needed if all events already have community_id set)
-- UPDATE events SET community_id = (SELECT id FROM communities LIMIT 1) WHERE community_id IS NULL;

-- Add NOT NULL constraint to community_id column
ALTER TABLE events
ALTER COLUMN community_id SET NOT NULL;

-- Add comment to document the requirement
COMMENT ON COLUMN events.community_id IS 'Events must belong to a community - this field is required';
