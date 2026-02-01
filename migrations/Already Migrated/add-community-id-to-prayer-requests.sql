-- Add communityId column to prayer_requests table
-- This enables prayer requests to be associated with communities

ALTER TABLE prayer_requests
ADD COLUMN IF NOT EXISTS community_id INTEGER REFERENCES communities(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_community_id
ON prayer_requests(community_id);

-- Add comment
COMMENT ON COLUMN prayer_requests.community_id IS 'ID of the community this prayer request belongs to. NULL means not community-specific.';
