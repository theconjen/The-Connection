-- Create safety/moderation tables if they don't exist

-- Content Reports Table
CREATE TABLE IF NOT EXISTS content_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'post', 'microblog', 'comment', 'event', 'prayer_request', 'community'
  content_id INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'spam', 'harassment', 'inappropriate', 'hate_speech', 'false_info', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  moderator_id INTEGER REFERENCES users(id),
  moderator_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

-- User Reports Table
CREATE TABLE IF NOT EXISTS user_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);

-- User Blocks Table
CREATE TABLE IF NOT EXISTS user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);

-- Moderation Actions Table (audit log)
CREATE TABLE IF NOT EXISTS moderation_actions (
  id SERIAL PRIMARY KEY,
  moderator_id INTEGER NOT NULL REFERENCES users(id),
  action_type TEXT NOT NULL, -- 'warn', 'suspend', 'ban', 'delete_content', 'resolve_report'
  target_type TEXT NOT NULL, -- 'user', 'content'
  target_id INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);

-- Moderation Settings Table
CREATE TABLE IF NOT EXISTS moderation_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  auto_filter_profanity BOOLEAN DEFAULT false,
  require_approval_for_posts BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Safety tables created successfully!';
  RAISE NOTICE '   - content_reports';
  RAISE NOTICE '   - user_reports';
  RAISE NOTICE '   - user_blocks';
  RAISE NOTICE '   - moderation_actions';
  RAISE NOTICE '   - moderation_settings';
END $$;
