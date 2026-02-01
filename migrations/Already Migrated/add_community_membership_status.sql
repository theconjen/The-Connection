-- Migration: Add community membership status and audit fields
-- Purpose: Enable explicit membership states (APPROVED, PENDING, REJECTED, REMOVED) and track who acted

-- Add status column with default 'APPROVED' for existing members
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'APPROVED';

-- Add acted_by_user_id to track who approved/rejected/removed
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS acted_by_user_id INTEGER REFERENCES users(id);

-- Add acted_at timestamp
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS acted_at TIMESTAMP;

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_community_members_status
ON community_members(community_id, status);

-- Create index for pending requests (common query pattern)
CREATE INDEX IF NOT EXISTS idx_community_members_pending
ON community_members(community_id, status)
WHERE status = 'PENDING';

-- Update existing members to APPROVED status (they are already members)
UPDATE community_members
SET status = 'APPROVED',
    acted_at = joined_at
WHERE status IS NULL OR status = '';

-- Add constraint to ensure valid status values
ALTER TABLE community_members
ADD CONSTRAINT valid_membership_status
CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED', 'REMOVED'));

-- Add comments for documentation
COMMENT ON COLUMN community_members.status IS 'Membership status: APPROVED (active member), PENDING (waiting approval), REJECTED (denied), REMOVED (kicked)';
COMMENT ON COLUMN community_members.acted_by_user_id IS 'User who last modified this membership (approved, rejected, removed)';
COMMENT ON COLUMN community_members.acted_at IS 'When the last status change occurred';
