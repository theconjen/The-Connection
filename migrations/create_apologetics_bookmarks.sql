-- Create apologetics bookmarks table for synced user saves
-- This allows users to bookmark Q&A entries and sync across devices

CREATE TABLE IF NOT EXISTS apologetics_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint: user can only bookmark a question once
CREATE UNIQUE INDEX IF NOT EXISTS idx_apologetics_bookmarks_user_question
  ON apologetics_bookmarks(user_id, question_id);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_apologetics_bookmarks_user_id
  ON apologetics_bookmarks(user_id);

-- Index for fast lookups by question
CREATE INDEX IF NOT EXISTS idx_apologetics_bookmarks_question_id
  ON apologetics_bookmarks(question_id);

-- Add comment
COMMENT ON TABLE apologetics_bookmarks IS 'User bookmarked apologetics Q&A entries for cross-device sync';
