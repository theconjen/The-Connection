-- Migration: Add Polls System and Microblog Topics
-- Date: 2026-01-18
-- Description: Adds topic categorization, post types, and polls to microblogs

-- ============================================================================
-- 1. Add new columns to microblogs table
-- ============================================================================

-- Topic category for posts
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'OTHER';

-- Post type: STANDARD or POLL
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'STANDARD';

-- Foreign key to polls table (nullable, only set for POLL type posts)
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS poll_id INTEGER;

-- Source URL for NEWS/CULTURE/ENTERTAINMENT posts
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Cached counts for ranking algorithm
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0;
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS unique_replier_count INTEGER DEFAULT 0;

-- Create index for topic filtering
CREATE INDEX IF NOT EXISTS idx_microblogs_topic ON microblogs(topic);
CREATE INDEX IF NOT EXISTS idx_microblogs_post_type ON microblogs(post_type);
CREATE INDEX IF NOT EXISTS idx_microblogs_poll_id ON microblogs(poll_id);

-- ============================================================================
-- 2. Create polls table
-- ============================================================================

CREATE TABLE IF NOT EXISTS polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  ends_at TIMESTAMP,
  allow_multiple BOOLEAN DEFAULT FALSE,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_ends_at ON polls(ends_at);

-- ============================================================================
-- 3. Create poll_options table
-- ============================================================================

CREATE TABLE IF NOT EXISTS poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);

-- ============================================================================
-- 4. Create poll_votes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS poll_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint: one vote per user per option (allows multiple options if poll.allow_multiple)
CREATE UNIQUE INDEX IF NOT EXISTS idx_poll_votes_user_option ON poll_votes(poll_id, option_id, user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);

-- ============================================================================
-- 5. Add foreign key from microblogs to polls
-- ============================================================================

-- Add FK constraint (if column exists without constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'microblogs_poll_id_fkey'
  ) THEN
    ALTER TABLE microblogs ADD CONSTRAINT microblogs_poll_id_fkey
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 6. Update existing microblogs to have topic = 'OTHER' and post_type = 'STANDARD'
-- ============================================================================

UPDATE microblogs SET topic = 'OTHER' WHERE topic IS NULL;
UPDATE microblogs SET post_type = 'STANDARD' WHERE post_type IS NULL;

-- ============================================================================
-- 7. Create composite index for explore feed queries
-- ============================================================================

-- Index for filtering by topic and sorting by created_at (latest tab)
CREATE INDEX IF NOT EXISTS idx_microblogs_topic_created ON microblogs(topic, created_at DESC);

-- Index for filtering by post_type and sorting by created_at
CREATE INDEX IF NOT EXISTS idx_microblogs_posttype_created ON microblogs(post_type, created_at DESC);

-- Composite index for popular tab ranking (will use like_count, bookmark_count, etc.)
CREATE INDEX IF NOT EXISTS idx_microblogs_ranking ON microblogs(like_count DESC, bookmark_count DESC, created_at DESC);

COMMENT ON TABLE polls IS 'Polls for microblog posts - stores poll metadata';
COMMENT ON TABLE poll_options IS 'Options/choices for each poll';
COMMENT ON TABLE poll_votes IS 'Tracks user votes on poll options';
COMMENT ON COLUMN microblogs.topic IS 'Post category: OBSERVATION, QUESTION, NEWS, CULTURE, ENTERTAINMENT, SCRIPTURE, TESTIMONY, PRAYER, OTHER';
COMMENT ON COLUMN microblogs.post_type IS 'Post type: STANDARD or POLL';
COMMENT ON COLUMN microblogs.poll_id IS 'FK to polls table for POLL type posts';
COMMENT ON COLUMN microblogs.source_url IS 'External URL for NEWS/CULTURE/ENTERTAINMENT posts';
