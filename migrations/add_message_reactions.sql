-- Message Reactions Table
-- Stores heart/like reactions on DM messages
-- Supports both senders and recipients reacting to any message in a conversation

CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMP DEFAULT NOW(),

  -- Each user can only have one reaction of each type per message
  UNIQUE(message_id, user_id, reaction)
);

-- Index for fast lookup of reactions by message
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- Index for fast lookup of a user's reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
