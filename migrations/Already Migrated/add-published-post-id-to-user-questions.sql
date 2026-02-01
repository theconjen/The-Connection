-- Add publishedPostId column to user_questions table
-- This links a user question to its published library post
-- UNIQUE constraint prevents accidental double-publishing

ALTER TABLE user_questions
ADD COLUMN IF NOT EXISTS published_post_id INTEGER REFERENCES qa_library_posts(id);

CREATE INDEX IF NOT EXISTS idx_user_questions_published_post
ON user_questions(published_post_id);

-- UNIQUE constraint: one question can only be published once
ALTER TABLE user_questions
ADD CONSTRAINT unique_published_post UNIQUE (published_post_id);
