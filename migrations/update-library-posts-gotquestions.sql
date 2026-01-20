-- Migration: Update Library Posts for GotQuestions-style UX
-- Adds TL;DR, key points, scripture references, and multi-apologist contributions

-- Add new fields to qa_library_posts
ALTER TABLE qa_library_posts
ADD COLUMN IF NOT EXISTS tldr TEXT,
ADD COLUMN IF NOT EXISTS key_points JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS scripture_refs JSONB DEFAULT '[]';

-- Create contributions table for multi-apologist collaboration
CREATE TABLE IF NOT EXISTS qa_library_contributions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES qa_library_posts(id) ON DELETE CASCADE,
  contributor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('edit_suggestion', 'additional_perspective', 'add_sources', 'clarification')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for contributions
CREATE INDEX IF NOT EXISTS idx_qa_library_contributions_post_id
  ON qa_library_contributions(post_id);

CREATE INDEX IF NOT EXISTS idx_qa_library_contributions_contributor
  ON qa_library_contributions(contributor_user_id);

CREATE INDEX IF NOT EXISTS idx_qa_library_contributions_status
  ON qa_library_contributions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_qa_library_contributions_reviewer
  ON qa_library_contributions(reviewed_by_user_id);

-- Comments for clarity
COMMENT ON TABLE qa_library_contributions IS 'Collaborative contributions from qualified apologists to library posts';
COMMENT ON COLUMN qa_library_contributions.type IS 'Type of contribution: edit_suggestion, additional_perspective, add_sources, clarification';
COMMENT ON COLUMN qa_library_contributions.payload IS 'JSON payload specific to contribution type';
COMMENT ON COLUMN qa_library_contributions.status IS 'Approval status: pending (awaiting review), approved (merged/visible), rejected';
