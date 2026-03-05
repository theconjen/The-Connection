-- Full-Text Search Migration
-- Adds tsvector columns with GIN indexes for fast ranked search
-- Run with: psql $DATABASE_URL -f migrations/add_fulltext_search.sql

-- Users: search by username, display_name, bio
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_users_search_vector ON users USING GIN (search_vector);

-- Communities: search by name, description
ALTER TABLE communities ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_communities_search_vector ON communities USING GIN (search_vector);

-- Events: search by title, description, location
ALTER TABLE events ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING GIN (search_vector);

-- Microblogs: search by content
ALTER TABLE microblogs ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_microblogs_search_vector ON microblogs USING GIN (search_vector);

-- Posts: search by title, content
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN (search_vector);
