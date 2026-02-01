-- Add Christian-focused profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS denomination TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_church TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_bible_verse TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS testimony TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT;
