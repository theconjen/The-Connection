-- Add push_tokens table and notification preference columns on users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_dms boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_communities boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_forums boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_feed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_privacy text DEFAULT 'everyone';

CREATE TABLE IF NOT EXISTS push_tokens (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
