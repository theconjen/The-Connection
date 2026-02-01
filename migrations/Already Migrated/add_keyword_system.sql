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
