-- Automatic counter triggers for microblogs.like_count and microblogs.reply_count
-- These fire on INSERT/DELETE regardless of how data enters the database,
-- so seed scripts, storage methods, and direct SQL all stay in sync.

-- ============================================================================
-- 1. like_count trigger (from microblog_likes table)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_microblog_like_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE microblogs SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.microblog_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE microblogs SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.microblog_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_microblog_like_count ON microblog_likes;
CREATE TRIGGER trg_microblog_like_count
  AFTER INSERT OR DELETE ON microblog_likes
  FOR EACH ROW EXECUTE FUNCTION update_microblog_like_count();

-- ============================================================================
-- 2. reply_count trigger (from child microblogs with parent_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_microblog_reply_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE microblogs SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE microblogs SET reply_count = GREATEST(COALESCE(reply_count, 0) - 1, 0) WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_microblog_reply_count ON microblogs;
CREATE TRIGGER trg_microblog_reply_count
  AFTER INSERT OR DELETE ON microblogs
  FOR EACH ROW EXECUTE FUNCTION update_microblog_reply_count();

-- ============================================================================
-- 3. reply_count trigger (from comments table, for comments on microblogs)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_microblog_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    -- Only increment if post_id refers to a microblog (not a post)
    UPDATE microblogs SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE microblogs SET reply_count = GREATEST(COALESCE(reply_count, 0) - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_microblog_comment_count ON comments;
CREATE TRIGGER trg_microblog_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_microblog_comment_count();
