-- Safe create for reports table: handles legacy integer PKs and UUID PKs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='users' AND column_name='id' AND data_type='uuid'
  ) THEN
    -- users.id is uuid
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('post','event','community')),
      subject_id UUID NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  ELSE
    -- users.id is not uuid (legacy integer IDs)
    CREATE TABLE IF NOT EXISTS reports (
      id BIGSERIAL PRIMARY KEY,
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('post','event','community')),
      subject_id INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
    );
  END IF;
END
$$;

-- Show result
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema='public' AND table_name='reports'
ORDER BY ordinal_position;
