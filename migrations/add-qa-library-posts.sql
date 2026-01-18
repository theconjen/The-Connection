-- Migration: Add Library Posts System
-- Wikipedia-style curated articles for apologetics and polemics
-- Author access restricted to verified apologists and user 19

CREATE TABLE IF NOT EXISTS qa_library_posts (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL CHECK (domain IN ('apologetics', 'polemics')),
  area_id INTEGER REFERENCES qa_areas(id) ON DELETE SET NULL,
  tag_id INTEGER REFERENCES qa_tags(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT NOT NULL,
  perspectives TEXT[] DEFAULT '{}',
  sources JSONB DEFAULT '[]',
  author_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_display_name TEXT NOT NULL DEFAULT 'Connection Research Team',
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qa_library_posts_domain_area_tag
  ON qa_library_posts(domain, area_id, tag_id);

CREATE INDEX IF NOT EXISTS idx_qa_library_posts_status_published
  ON qa_library_posts(status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_qa_library_posts_author
  ON qa_library_posts(author_user_id);

CREATE INDEX IF NOT EXISTS idx_qa_library_posts_domain
  ON qa_library_posts(domain);

-- Full text search index (optional, for future search functionality)
-- CREATE INDEX IF NOT EXISTS idx_qa_library_posts_search
--   ON qa_library_posts USING gin(to_tsvector('english', title || ' ' || COALESCE(summary, '') || ' ' || body_markdown));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qa_library_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_qa_library_posts_updated_at
  BEFORE UPDATE ON qa_library_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_qa_library_posts_updated_at();
