-- Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id SERIAL PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  display_tag TEXT NOT NULL,
  trending_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);

-- Junction table linking microblogs to hashtags
CREATE TABLE IF NOT EXISTS microblog_hashtags (
  id SERIAL PRIMARY KEY,
  microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_microblog_hashtag_unique ON microblog_hashtags(microblog_id, hashtag_id);
CREATE INDEX IF NOT EXISTS idx_microblog_hashtags_microblog ON microblog_hashtags(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_hashtags_hashtag ON microblog_hashtags(hashtag_id);
