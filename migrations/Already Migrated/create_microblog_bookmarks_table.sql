-- Create microblog_bookmarks table for tracking user bookmarks
CREATE TABLE IF NOT EXISTS microblog_bookmarks (
  id SERIAL PRIMARY KEY,
  microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(microblog_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_microblog_id ON microblog_bookmarks(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_user_id ON microblog_bookmarks(user_id);
