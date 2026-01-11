-- ============================================================================
-- CRITICAL PERFORMANCE INDEXES MIGRATION
-- ============================================================================
-- This migration adds essential indexes for frequently-queried columns
-- to prevent full table scans and improve app performance at scale.
--
-- Impact: Dramatically improves query performance for:
--   - Feed queries (posts, microblogs)
--   - Direct messages
--   - Community member lookups
--   - Event queries
--   - Comment threads
--   - User relationships
--
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- ============================================================================
-- POSTS TABLE INDEXES
-- ============================================================================
-- Posts are queried by author, community, and ordered by creation time
-- These indexes are critical for feed performance

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);

-- Composite indexes for optimal feed queries (author + time ordering)
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON posts(community_id, created_at DESC) WHERE deleted_at IS NULL;

-- For top/hot post filtering (upvote sorting)
CREATE INDEX IF NOT EXISTS idx_posts_upvotes ON posts(upvotes DESC);


-- ============================================================================
-- COMMENTS TABLE INDEXES
-- ============================================================================
-- Comments are queried by post and author, critical for post detail pages

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at);

-- Composite for fetching post comments in order
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC) WHERE deleted_at IS NULL;


-- ============================================================================
-- MESSAGES TABLE INDEXES (DIRECT MESSAGES)
-- ============================================================================
-- Critical for DM performance - messages are queried by sender/receiver

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Composite indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender ON messages(receiver_id, sender_id, created_at DESC);

-- For unread message counts (heavily queried)
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read) WHERE is_read = false;


-- ============================================================================
-- COMMUNITY MEMBERS TABLE INDEXES
-- ============================================================================
-- Community membership is checked on nearly every community-related query

CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_joined_at ON community_members(joined_at DESC);

-- Composite for checking user membership in communities
CREATE INDEX IF NOT EXISTS idx_community_members_user_community ON community_members(user_id, community_id);


-- ============================================================================
-- MICROBLOGS TABLE INDEXES (FEED)
-- ============================================================================
-- Microblogs are the core of the feed, heavily queried

CREATE INDEX IF NOT EXISTS idx_microblogs_author_id ON microblogs(author_id);
CREATE INDEX IF NOT EXISTS idx_microblogs_created_at ON microblogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_microblogs_parent_id ON microblogs(parent_microblog_id);

-- Composite for user's microblog timeline
CREATE INDEX IF NOT EXISTS idx_microblogs_author_created ON microblogs(author_id, created_at DESC);

-- For hot/trending content
CREATE INDEX IF NOT EXISTS idx_microblogs_like_count ON microblogs(like_count DESC);


-- ============================================================================
-- MICROBLOG ENGAGEMENT INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_microblog_likes_microblog_id ON microblog_likes(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_likes_user_id ON microblog_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_microblog_likes_created_at ON microblog_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_microblog_reposts_microblog_id ON microblog_reposts(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_reposts_user_id ON microblog_reposts(user_id);

CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_microblog_id ON microblog_bookmarks(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_user_id ON microblog_bookmarks(user_id);


-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================
-- Events are queried by community, date, and creator

CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);

-- Composite for community event calendar
CREATE INDEX IF NOT EXISTS idx_events_community_date ON events(community_id, event_date) WHERE deleted_at IS NULL;

-- For nearby events (geospatial queries)
CREATE INDEX IF NOT EXISTS idx_events_latitude ON events(latitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_longitude ON events(longitude) WHERE longitude IS NOT NULL;


-- ============================================================================
-- PRAYER REQUESTS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_prayer_requests_author_id ON prayer_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_group_id ON prayer_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at ON prayer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_privacy_level ON prayer_requests(privacy_level);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_answered ON prayer_requests(is_answered);

-- Composite for filtering answered/active prayers
CREATE INDEX IF NOT EXISTS idx_prayer_requests_answered_created ON prayer_requests(is_answered, created_at DESC);


-- ============================================================================
-- PRAYERS TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_prayers_request_id ON prayers(prayer_request_id);
CREATE INDEX IF NOT EXISTS idx_prayers_user_id ON prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_prayed_at ON prayers(prayed_at DESC);


-- ============================================================================
-- USER RELATIONSHIPS INDEXES
-- ============================================================================
-- User follows and blocks are checked frequently

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created_at ON user_follows(created_at DESC);

-- Composite for checking if user A follows user B
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_following ON user_follows(follower_id, following_id);


CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);

-- Composite for checking if user A blocked user B
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_blocked ON user_blocks(blocker_id, blocked_id);


-- ============================================================================
-- CHAT MESSAGES TABLE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Composite for room message history
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(chat_room_id, created_at DESC);


-- ============================================================================
-- COMMUNITY WALL POSTS INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_community_wall_posts_community_id ON community_wall_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_wall_posts_author_id ON community_wall_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_wall_posts_created_at ON community_wall_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_wall_posts_deleted_at ON community_wall_posts(deleted_at);

-- Composite for community wall feed
CREATE INDEX IF NOT EXISTS idx_community_wall_community_created ON community_wall_posts(community_id, created_at DESC) WHERE deleted_at IS NULL;


-- ============================================================================
-- APOLOGETICS INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_apologetics_questions_topic_id ON apologetics_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_apologetics_questions_author_id ON apologetics_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_apologetics_questions_status ON apologetics_questions(status);
CREATE INDEX IF NOT EXISTS idx_apologetics_questions_created_at ON apologetics_questions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_apologetics_answers_question_id ON apologetics_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_apologetics_answers_author_id ON apologetics_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_apologetics_answers_created_at ON apologetics_answers(created_at DESC);


-- ============================================================================
-- GROUPS INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_joined_at ON group_members(joined_at DESC);

-- Composite for checking group membership
CREATE INDEX IF NOT EXISTS idx_group_members_user_group ON group_members(user_id, group_id);


-- ============================================================================
-- AUDIT LOGS INDEX
-- ============================================================================
-- Audit logs are queried by user and timestamp for security investigations
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);


-- ============================================================================
-- COMMUNITIES TABLE INDEXES
-- ============================================================================
-- Additional community indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communities_deleted_at ON communities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_communities_privacy_setting ON communities(privacy_setting);


-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================
-- For user search and filtering (already have username/email unique indexes)
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_profile_visibility ON users(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);


-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify indexes were created, run:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
