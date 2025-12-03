-- Add hashed email verification token, expiry and timestamps
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_verification_last_sent_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_verification_token_hash ON users (email_verification_token_hash);
