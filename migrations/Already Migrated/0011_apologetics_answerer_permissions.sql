CREATE TABLE IF NOT EXISTS apologetics_answerer_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL REFERENCES apologetics_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_apologetics_answerer_permissions_user_topic
  ON apologetics_answerer_permissions (user_id, topic_id);
