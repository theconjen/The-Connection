import { log } from "../vite-shim";
import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Add Q&A Inbox System
 * - Creates user_permissions table
 * - Creates qa_areas and qa_tags tables
 * - Creates apologist_profiles and apologist_expertise tables
 * - Creates user_questions, question_assignments, question_messages tables
 * - Adds all necessary indexes
 */
export async function runMigration(): Promise<boolean> {
  try {
    log("Running migration: add-qa-inbox-system");

    // 1. Create user_permissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission TEXT NOT NULL,
        granted_by INTEGER REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT user_permissions_unique_idx UNIQUE (user_id, permission)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission)
    `);
    log("✅ Created user_permissions table");

    // 2. Create qa_areas table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS qa_areas (
        id SERIAL PRIMARY KEY,
        domain TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT qa_areas_domain_slug_idx UNIQUE (domain, slug)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_qa_areas_domain ON qa_areas(domain)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_qa_areas_order ON qa_areas("order")
    `);
    log("✅ Created qa_areas table");

    // 3. Create qa_tags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS qa_tags (
        id SERIAL PRIMARY KEY,
        area_id INTEGER NOT NULL REFERENCES qa_areas(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT qa_tags_area_slug_idx UNIQUE (area_id, slug)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_qa_tags_area_id ON qa_tags(area_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_qa_tags_order ON qa_tags("order")
    `);
    log("✅ Created qa_tags table");

    // 4. Create apologist_profiles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS apologist_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        credentials_short TEXT,
        bio_long TEXT,
        verification_status TEXT NOT NULL DEFAULT 'none',
        inbox_enabled BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_apologist_profiles_user_id ON apologist_profiles(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_apologist_profiles_inbox_enabled ON apologist_profiles(inbox_enabled)
    `);
    log("✅ Created apologist_profiles table");

    // 5. Create apologist_expertise table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS apologist_expertise (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area_id INTEGER NOT NULL REFERENCES qa_areas(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES qa_tags(id) ON DELETE CASCADE,
        level TEXT NOT NULL DEFAULT 'secondary',
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT apologist_expertise_unique_idx UNIQUE (user_id, area_id, tag_id)
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_apologist_expertise_user_id ON apologist_expertise(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_apologist_expertise_area_id ON apologist_expertise(area_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_apologist_expertise_tag_id ON apologist_expertise(tag_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_apologist_expertise_level ON apologist_expertise(level)
    `);
    log("✅ Created apologist_expertise table");

    // 6. Create user_questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_questions (
        id SERIAL PRIMARY KEY,
        asker_user_id INTEGER NOT NULL REFERENCES users(id),
        domain TEXT NOT NULL,
        area_id INTEGER NOT NULL REFERENCES qa_areas(id),
        tag_id INTEGER NOT NULL REFERENCES qa_tags(id),
        question_text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_questions_asker_user_id ON user_questions(asker_user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_questions_domain ON user_questions(domain)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_questions_area_id ON user_questions(area_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_questions_tag_id ON user_questions(tag_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_questions_status ON user_questions(status)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_questions_created_at ON user_questions(created_at)
    `);
    log("✅ Created user_questions table");

    // 7. Create question_assignments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS question_assignments (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
        assigned_to_user_id INTEGER NOT NULL REFERENCES users(id),
        assigned_by_user_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'assigned',
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_question_assignments_question_id ON question_assignments(question_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_question_assignments_assigned_to ON question_assignments(assigned_to_user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_question_assignments_status ON question_assignments(status)
    `);
    log("✅ Created question_assignments table");

    // 8. Create question_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS question_messages (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES user_questions(id) ON DELETE CASCADE,
        sender_user_id INTEGER NOT NULL REFERENCES users(id),
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_question_messages_question_id ON question_messages(question_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_question_messages_sender_user_id ON question_messages(sender_user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_question_messages_created_at ON question_messages(created_at)
    `);
    log("✅ Created question_messages table");

    log("✅ Migration completed: add-qa-inbox-system");
    log("✅ Enabled: Private Q&A Inbox, Question Routing, Threaded Conversations");
    return true;
  } catch (error) {
    log(`❌ Migration failed: add-qa-inbox-system - ${String(error)}`);
    return false;
  }
}
