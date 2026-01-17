-- Migration: Create Private Q&A Inbox System
-- Description: Tables for apologetics/polemics Q&A with routing, assignments, and threaded messages
-- Date: 2026-01-16

-- ============================================================================
-- User Permissions (controls access to inbox and admin features)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL, -- 'inbox_access', 'manage_experts'
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT user_permissions_unique_idx UNIQUE (user_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);

-- ============================================================================
-- Q&A Areas (Evidence, Theology, History, Objections, Perspectives)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qa_areas (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL, -- 'apologetics' or 'polemics'
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT qa_areas_domain_slug_idx UNIQUE (domain, slug)
);

CREATE INDEX IF NOT EXISTS idx_qa_areas_domain ON qa_areas(domain);
CREATE INDEX IF NOT EXISTS idx_qa_areas_order ON qa_areas("order");

-- ============================================================================
-- Q&A Tags (specific topics within areas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qa_tags (
  id SERIAL PRIMARY KEY,
  area_id INTEGER NOT NULL REFERENCES qa_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT qa_tags_area_slug_idx UNIQUE (area_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_qa_tags_area_id ON qa_tags(area_id);
CREATE INDEX IF NOT EXISTS idx_qa_tags_order ON qa_tags("order");

-- ============================================================================
-- Apologist Profiles (verified scholars/experts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS apologist_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title TEXT, -- Dr., Rev., etc.
  credentials_short TEXT,
  bio_long TEXT,
  verification_status TEXT NOT NULL DEFAULT 'none', -- none, internal, pending, verified
  inbox_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apologist_profiles_user_id ON apologist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_apologist_profiles_inbox_enabled ON apologist_profiles(inbox_enabled);

-- ============================================================================
-- Apologist Expertise (maps experts to areas/tags they can answer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS apologist_expertise (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id INTEGER NOT NULL REFERENCES qa_areas(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES qa_tags(id) ON DELETE CASCADE, -- null = area-level expertise
  level TEXT NOT NULL DEFAULT 'secondary', -- 'primary' or 'secondary'
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT apologist_expertise_unique_idx UNIQUE (user_id, area_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_apologist_expertise_user_id ON apologist_expertise(user_id);
CREATE INDEX IF NOT EXISTS idx_apologist_expertise_area_id ON apologist_expertise(area_id);
CREATE INDEX IF NOT EXISTS idx_apologist_expertise_tag_id ON apologist_expertise(tag_id);
CREATE INDEX IF NOT EXISTS idx_apologist_expertise_level ON apologist_expertise(level);

-- ============================================================================
-- User Questions (private questions submitted by users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_questions (
  id SERIAL PRIMARY KEY,
  asker_user_id INTEGER NOT NULL REFERENCES users(id),
  domain TEXT NOT NULL, -- 'apologetics' or 'polemics'
  area_id INTEGER NOT NULL REFERENCES qa_areas(id),
  tag_id INTEGER NOT NULL REFERENCES qa_tags(id),
  question_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'routed', 'answered', 'closed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_questions_asker_user_id ON user_questions(asker_user_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_domain ON user_questions(domain);
CREATE INDEX IF NOT EXISTS idx_user_questions_area_id ON user_questions(area_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_tag_id ON user_questions(tag_id);
CREATE INDEX IF NOT EXISTS idx_user_questions_status ON user_questions(status);
CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at);

-- ============================================================================
-- Question Assignments (routes questions to experts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_assignments (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
  assigned_to_user_id INTEGER NOT NULL REFERENCES users(id),
  assigned_by_user_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'accepted', 'declined', 'answered'
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_assignments_question_id ON question_assignments(question_id);
CREATE INDEX IF NOT EXISTS idx_question_assignments_assigned_to ON question_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_question_assignments_status ON question_assignments(status);

-- ============================================================================
-- Question Messages (threaded conversation between asker and answerer)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_messages (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
  sender_user_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL, -- markdown allowed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_messages_question_id ON question_messages(question_id);
CREATE INDEX IF NOT EXISTS idx_question_messages_sender_user_id ON question_messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_question_messages_created_at ON question_messages(created_at);

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify tables were created
SELECT 'user_permissions' as table_name, COUNT(*) as row_count FROM user_permissions
UNION ALL
SELECT 'qa_areas', COUNT(*) FROM qa_areas
UNION ALL
SELECT 'qa_tags', COUNT(*) FROM qa_tags
UNION ALL
SELECT 'apologist_profiles', COUNT(*) FROM apologist_profiles
UNION ALL
SELECT 'apologist_expertise', COUNT(*) FROM apologist_expertise
UNION ALL
SELECT 'user_questions', COUNT(*) FROM user_questions
UNION ALL
SELECT 'question_assignments', COUNT(*) FROM question_assignments
UNION ALL
SELECT 'question_messages', COUNT(*) FROM question_messages;
