-- Add deleted_at column to community_wall_posts table
-- This enables soft deletes for community wall posts

ALTER TABLE community_wall_posts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_community_wall_posts_deleted_at
ON community_wall_posts(deleted_at);

-- Add comment
COMMENT ON COLUMN community_wall_posts.deleted_at IS 'Timestamp when the wall post was soft-deleted. NULL means not deleted.';
