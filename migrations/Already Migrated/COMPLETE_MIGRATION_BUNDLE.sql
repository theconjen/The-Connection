-- ============================================================================
-- COMPLETE MIGRATION BUNDLE FOR THE CONNECTION
-- ============================================================================
-- This file contains all recent critical migrations that need to be applied
-- Run this entire file in your Neon database SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Fix Wall Posts (CRITICAL - Fixes 500 error)
-- ============================================================================

ALTER TABLE community_wall_posts
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_community_wall_posts_deleted_at
ON community_wall_posts(deleted_at);

COMMENT ON COLUMN community_wall_posts.deleted_at IS 'Timestamp when the wall post was soft-deleted. NULL means not deleted.';

-- ============================================================================
-- MIGRATION 2: Prayer Requests for Communities
-- ============================================================================

ALTER TABLE prayer_requests
ADD COLUMN IF NOT EXISTS community_id INTEGER REFERENCES communities(id);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_community_id
ON prayer_requests(community_id);

COMMENT ON COLUMN prayer_requests.community_id IS 'ID of the community this prayer request belongs to. NULL means not community-specific.';

-- ============================================================================
-- MIGRATION 3: Vote Tracking Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS post_votes_post_user_idx ON post_votes(post_id, user_id);

CREATE TABLE IF NOT EXISTS comment_votes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS comment_votes_comment_user_idx ON comment_votes(comment_id, user_id);

-- ============================================================================
-- MIGRATION 4: Feed Features (Downvotes, Reposts, Bookmarks)
-- ============================================================================

-- Add vote_type to post_votes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'post_votes' AND column_name = 'vote_type'
    ) THEN
        ALTER TABLE post_votes ADD COLUMN vote_type VARCHAR(10) DEFAULT 'upvote';
        ALTER TABLE post_votes ADD CONSTRAINT vote_type_check CHECK (vote_type IN ('upvote', 'downvote'));
    END IF;
END $$;

-- Add vote_type to comment_votes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comment_votes' AND column_name = 'vote_type'
    ) THEN
        ALTER TABLE comment_votes ADD COLUMN vote_type VARCHAR(10) DEFAULT 'upvote';
        ALTER TABLE comment_votes ADD CONSTRAINT comment_vote_type_check CHECK (vote_type IN ('upvote', 'downvote'));
    END IF;
END $$;

-- Add downvotes to posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'downvotes'
    ) THEN
        ALTER TABLE posts ADD COLUMN downvotes INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add downvotes to comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'downvotes'
    ) THEN
        ALTER TABLE comments ADD COLUMN downvotes INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create microblog_reposts table
CREATE TABLE IF NOT EXISTS microblog_reposts (
    id SERIAL PRIMARY KEY,
    microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(microblog_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_microblog_reposts_microblog_id ON microblog_reposts(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_reposts_user_id ON microblog_reposts(user_id);

-- Create microblog_bookmarks table
CREATE TABLE IF NOT EXISTS microblog_bookmarks (
    id SERIAL PRIMARY KEY,
    microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(microblog_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_microblog_id ON microblog_bookmarks(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_user_id ON microblog_bookmarks(user_id);

-- ============================================================================
-- MIGRATION 5: Community Filter Fields
-- ============================================================================

ALTER TABLE communities
ADD COLUMN IF NOT EXISTS age_group TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS ministry_types TEXT[],
ADD COLUMN IF NOT EXISTS activities TEXT[],
ADD COLUMN IF NOT EXISTS professions TEXT[],
ADD COLUMN IF NOT EXISTS recovery_support TEXT[],
ADD COLUMN IF NOT EXISTS meeting_type TEXT,
ADD COLUMN IF NOT EXISTS frequency TEXT,
ADD COLUMN IF NOT EXISTS life_stages TEXT[],
ADD COLUMN IF NOT EXISTS parent_categories TEXT[];

CREATE INDEX IF NOT EXISTS idx_communities_age_group ON communities(age_group);
CREATE INDEX IF NOT EXISTS idx_communities_gender ON communities(gender);
CREATE INDEX IF NOT EXISTS idx_communities_meeting_type ON communities(meeting_type);
CREATE INDEX IF NOT EXISTS idx_communities_frequency ON communities(frequency);

-- GIN indexes for array columns
CREATE INDEX IF NOT EXISTS idx_communities_ministry_types ON communities USING GIN(ministry_types);
CREATE INDEX IF NOT EXISTS idx_communities_activities ON communities USING GIN(activities);
CREATE INDEX IF NOT EXISTS idx_communities_professions ON communities USING GIN(professions);
CREATE INDEX IF NOT EXISTS idx_communities_recovery_support ON communities USING GIN(recovery_support);
CREATE INDEX IF NOT EXISTS idx_communities_life_stages ON communities USING GIN(life_stages);
CREATE INDEX IF NOT EXISTS idx_communities_parent_categories ON communities USING GIN(parent_categories);

-- ============================================================================
-- MIGRATION 6: Performance Indexes (CRITICAL)
-- ============================================================================

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(upvotes DESC);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);

-- Microblogs table indexes
CREATE INDEX IF NOT EXISTS idx_microblogs_author_id ON microblogs(author_id);
CREATE INDEX IF NOT EXISTS idx_microblogs_created_at ON microblogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_microblogs_author_created ON microblogs(author_id, created_at DESC);

-- Direct messages indexes
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, recipient_id, created_at DESC);

-- Community members indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ ============================================';
    RAISE NOTICE '✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ ============================================';
    RAISE NOTICE '✅ Applied migrations:';
    RAISE NOTICE '  1. Fixed community wall posts (deleted_at)';
    RAISE NOTICE '  2. Added community prayer requests';
    RAISE NOTICE '  3. Created vote tracking tables';
    RAISE NOTICE '  4. Enabled feed features (downvotes, reposts, bookmarks)';
    RAISE NOTICE '  5. Added community filter fields';
    RAISE NOTICE '  6. Added performance indexes';
    RAISE NOTICE '✅ ============================================';
END $$;
