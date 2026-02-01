-- Create vote tracking tables for posts and comments
-- These tables track which users have upvoted which posts/comments

-- Create post_votes table
CREATE TABLE IF NOT EXISTS post_votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index to prevent duplicate votes
CREATE UNIQUE INDEX IF NOT EXISTS post_votes_post_user_idx ON post_votes(post_id, user_id);

-- Create comment_votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index to prevent duplicate votes
CREATE UNIQUE INDEX IF NOT EXISTS comment_votes_comment_user_idx ON comment_votes(comment_id, user_id);
