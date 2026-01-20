-- Comprehensive migration for Feed and Forum features
-- Run this to enable: Downvotes, Reposts, Bookmarks

-- 1. Add vote_type to post_votes (for downvotes)
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

-- 2. Add vote_type to comment_votes (for downvotes)
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

-- 3. Add downvotes column to posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'posts' AND column_name = 'downvotes'
    ) THEN
        ALTER TABLE posts ADD COLUMN downvotes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Add downvotes column to comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'downvotes'
    ) THEN
        ALTER TABLE comments ADD COLUMN downvotes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. Create microblog_reposts table
CREATE TABLE IF NOT EXISTS microblog_reposts (
    id SERIAL PRIMARY KEY,
    microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(microblog_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_microblog_reposts_microblog_id ON microblog_reposts(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_reposts_user_id ON microblog_reposts(user_id);

-- 6. Create microblog_bookmarks table
CREATE TABLE IF NOT EXISTS microblog_bookmarks (
    id SERIAL PRIMARY KEY,
    microblog_id INTEGER NOT NULL REFERENCES microblogs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(microblog_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_microblog_id ON microblog_bookmarks(microblog_id);
CREATE INDEX IF NOT EXISTS idx_microblog_bookmarks_user_id ON microblog_bookmarks(user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All feed feature migrations completed successfully!';
    RAISE NOTICE '✅ Enabled: Forum Downvotes, Feed Reposts, Feed Bookmarks';
END $$;
