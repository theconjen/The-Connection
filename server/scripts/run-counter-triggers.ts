/**
 * Apply microblog counter triggers.
 * Usage: npx tsx server/scripts/run-counter-triggers.ts
 */
import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function run() {
  console.info('🔄 Creating counter triggers...\n');

  // 1. Like count trigger
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_microblog_like_count() RETURNS TRIGGER AS $fn$
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
    $fn$ LANGUAGE plpgsql
  `);
  console.info('✅ Created function: update_microblog_like_count');

  await db.execute(sql`DROP TRIGGER IF EXISTS trg_microblog_like_count ON microblog_likes`);
  await db.execute(sql`
    CREATE TRIGGER trg_microblog_like_count
      AFTER INSERT OR DELETE ON microblog_likes
      FOR EACH ROW EXECUTE FUNCTION update_microblog_like_count()
  `);
  console.info('✅ Created trigger: trg_microblog_like_count');

  // 2. Reply count trigger (child microblogs with parent_id)
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_microblog_reply_count() RETURNS TRIGGER AS $fn$
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
    $fn$ LANGUAGE plpgsql
  `);
  console.info('✅ Created function: update_microblog_reply_count');

  await db.execute(sql`DROP TRIGGER IF EXISTS trg_microblog_reply_count ON microblogs`);
  await db.execute(sql`
    CREATE TRIGGER trg_microblog_reply_count
      AFTER INSERT OR DELETE ON microblogs
      FOR EACH ROW EXECUTE FUNCTION update_microblog_reply_count()
  `);
  console.info('✅ Created trigger: trg_microblog_reply_count');

  // 3. Comment count trigger (comments table → microblog reply_count)
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION update_microblog_comment_count() RETURNS TRIGGER AS $fn$
    BEGIN
      IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
        UPDATE microblogs SET reply_count = COALESCE(reply_count, 0) + 1 WHERE id = NEW.post_id;
        RETURN NEW;
      ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
        UPDATE microblogs SET reply_count = GREATEST(COALESCE(reply_count, 0) - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
      END IF;
      RETURN NULL;
    END;
    $fn$ LANGUAGE plpgsql
  `);
  console.info('✅ Created function: update_microblog_comment_count');

  await db.execute(sql`DROP TRIGGER IF EXISTS trg_microblog_comment_count ON comments`);
  await db.execute(sql`
    CREATE TRIGGER trg_microblog_comment_count
      AFTER INSERT OR DELETE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_microblog_comment_count()
  `);
  console.info('✅ Created trigger: trg_microblog_comment_count');

  console.info('\n🎉 All triggers installed! Counters will auto-update from now on.');
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
