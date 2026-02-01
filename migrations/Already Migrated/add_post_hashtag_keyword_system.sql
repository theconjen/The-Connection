-- Post-Hashtag junction table
CREATE TABLE IF NOT EXISTS post_hashtags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_hashtag_unique ON post_hashtags(post_id, hashtag_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- Post-Keyword junction table
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
