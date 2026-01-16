-- Fix duplicate community members and add unique constraint
-- Migration: fix_duplicate_members.sql

-- Step 1: Remove duplicate membership records, keeping only the oldest one for each (community_id, user_id) pair
DELETE FROM community_members
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY community_id, user_id
        ORDER BY joined_at ASC, id ASC
      ) as row_num
    FROM community_members
  ) duplicates
  WHERE row_num > 1
);

-- Step 2: Add unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS community_members_unique_idx
ON community_members(community_id, user_id);

-- Verify the fix
SELECT
  community_id,
  user_id,
  COUNT(*) as member_count
FROM community_members
GROUP BY community_id, user_id
HAVING COUNT(*) > 1;
-- This should return 0 rows if successful
