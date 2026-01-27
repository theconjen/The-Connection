-- Add view_count column to qa_library_posts for trending articles feature
-- This tracks how many times each article has been viewed

ALTER TABLE qa_library_posts
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Add index for efficient trending queries (sorting by view_count)
CREATE INDEX IF NOT EXISTS idx_qa_library_posts_view_count
ON qa_library_posts(view_count DESC)
WHERE status = 'published';

-- Add composite index for trending by domain
CREATE INDEX IF NOT EXISTS idx_qa_library_posts_trending_domain
ON qa_library_posts(domain, view_count DESC, published_at DESC)
WHERE status = 'published';
