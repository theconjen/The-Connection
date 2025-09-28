-- Content Moderation System Schema
-- This adds the tables needed for content moderation and reporting

-- Content Reports Table
CREATE TABLE content_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'post', 'microblog', 'comment', 'event', 'prayer_request'
  content_id INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL, -- 'spam', 'harassment', 'inappropriate', 'hate_speech', 'false_info', 'other'
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
  moderator_id INTEGER REFERENCES users(id),
  moderator_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Blocks Table
CREATE TABLE user_blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100), -- 'harassment', 'spam', 'inappropriate', 'other'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Content Moderation Actions Table
CREATE TABLE moderation_actions (
  id SERIAL PRIMARY KEY,
  moderator_id INTEGER NOT NULL REFERENCES users(id),
  content_type VARCHAR(50) NOT NULL,
  content_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'warn', 'hide', 'delete', 'ban_user'
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Moderation Settings Table
CREATE TABLE moderation_settings (
  id SERIAL PRIMARY KEY,
  auto_moderate_enabled BOOLEAN DEFAULT true,
  profanity_filter_enabled BOOLEAN DEFAULT true,
  spam_detection_enabled BOOLEAN DEFAULT true,
  review_threshold INTEGER DEFAULT 3, -- Number of reports before auto-hide
  contact_email VARCHAR(255) DEFAULT 'support@theconnection.app',
  response_time_sla_hours INTEGER DEFAULT 24,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default moderation settings
-- Use explicit conflict target to be compatible with PostgreSQL
INSERT INTO moderation_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX idx_moderation_actions_content ON moderation_actions(content_type, content_id);