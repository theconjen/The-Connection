-- Migration: Add Age Assurance fields to users table
-- Purpose: Support Apple App Store Age Assurance requirements
-- Date: 2026-01-21

-- Add date_of_birth column (nullable for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add age_gate_passed column with default false
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_gate_passed BOOLEAN NOT NULL DEFAULT false;

-- Add age_verified_at timestamp column
ALTER TABLE users ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ;

-- Create index on age_gate_passed for potential reporting queries
CREATE INDEX IF NOT EXISTS idx_users_age_gate_passed ON users(age_gate_passed);

-- Comment for documentation
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth for age verification (COPPA/App Store compliance)';
COMMENT ON COLUMN users.age_gate_passed IS 'Whether user passed the age gate (13+ verification) at signup';
COMMENT ON COLUMN users.age_verified_at IS 'Timestamp when age was verified during registration';
