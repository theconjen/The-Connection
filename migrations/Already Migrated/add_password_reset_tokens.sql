-- Password Reset Tokens Table
-- Stores hashed tokens for secure password reset functionality
-- Tokens are single-use and have expiration

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Index for fast token lookup by hash
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset_tokens(token_hash);

-- Index for finding tokens by user
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens(expires_at);

-- Clean up any expired tokens older than 24 hours (can be run periodically)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '24 hours';
