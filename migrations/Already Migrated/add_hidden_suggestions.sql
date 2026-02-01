-- Migration: Add hidden_suggestions table for friend suggestion dismissals
-- Date: 2026-01-19

CREATE TABLE IF NOT EXISTS hidden_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  hidden_user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, hidden_user_id)
);

-- Index for quick lookups when fetching suggestions
CREATE INDEX IF NOT EXISTS idx_hidden_suggestions_user_id ON hidden_suggestions(user_id);
