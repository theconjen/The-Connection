ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
