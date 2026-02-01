-- Create microblog_reposts table for tracking user reposts
CREATE TABLE IF NOT EXISTS microblog_reposts (
  id SERIAL PRIMARY KEY,
  microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(microblog_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_microblog_reposts_microblog_id ON microblog_reposts(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_reposts_user_id ON microblog_reposts(user_id);
