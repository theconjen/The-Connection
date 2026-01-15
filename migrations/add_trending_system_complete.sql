-- ============================================================================
-- COMPLETE TRENDING SYSTEM MIGRATION
-- Adds hashtags + keywords tracking for trending content
-- ============================================================================

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

-- Junction table linking posts to hashtags
CREATE TABLE IF NOT EXISTS post_hashtags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_hashtag_unique ON post_hashtags(post_id, hashtag_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- Keywords table (extracted keywords without # symbol)
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  display_keyword TEXT NOT NULL,
  trending_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  is_proper_noun BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_keywords_trending ON keywords(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);

-- Junction table linking microblogs to keywords
CREATE TABLE IF NOT EXISTS microblog_keywords (
  id SERIAL PRIMARY KEY,
  microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
  keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_microblog_keyword_unique ON microblog_keywords(microblog_id, keyword_id);
CREATE INDEX IF NOT EXISTS idx_microblog_keywords_microblog ON microblog_keywords(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_keywords_keyword ON microblog_keywords(keyword_id);

-- Junction table linking posts to keywords
CREATE TABLE IF NOT EXISTS post_keywords (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_keyword_unique ON post_keywords(post_id, keyword_id);
CREATE INDEX IF NOT EXISTS idx_post_keywords_post ON post_keywords(post_id);
CREATE INDEX IF NOT EXISTS idx_post_keywords_keyword ON post_keywords(keyword_id);
