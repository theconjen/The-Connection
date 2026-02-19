// IMPORTANT: Load dotenv FIRST before any other imports
import "dotenv/config";

import { log } from "./vite-shim";
import { runMigration as addLocalityInterests } from "./migrations/add-locality-interests";
import { runMigration as createMvpTables } from "./migrations/0002_create_mvp_tables";
import { runMigration as addMessageReadStatus } from "./migrations/add-message-read-status";
import { runMigration as addDeletedAtColumns } from "./migrations/add-deleted-at-columns";
import { runMigration as addFeedFeatures } from "./migrations/add-feed-features";
import { runMigration as addCommunityFeatures } from "./migrations/add-community-features";
import { runMigration as addHashtagSystem } from "./migrations/add-hashtag-system";
import { runMigration as addKeywordSystem } from "./migrations/add-keyword-system";
import { runMigration as addPostHashtagKeywordSystem } from "./migrations/add-post-hashtag-keyword-system";
import { runMigration as addQaInboxSystem } from "./migrations/add-qa-inbox-system";
import { runMigration as addEventsCategory } from "./migrations/add-events-category";
import { runMigration as addEventPositionAudience } from "./migrations/add-event-position-audience";
import { isConnected } from "./db";

/**
 * Run all pending migrations in the correct order
 */
export async function runAllMigrations() {
  if (!isConnected) {
    log("❌ Database connection not available. Skipping migrations.");
    return false;
  }

  try {
    log("Starting database migrations");

    // Run the locality and interests migration
    const localityResult = await addLocalityInterests();
    if (!localityResult) {
      log("❌ Locality and interests migration failed");
      return false;
    }

    // Create MVP tables
    const mvpResult = await createMvpTables();
    if (!mvpResult) {
      log("❌ MVP tables migration failed");
      return false;
    }

    // Add message read status fields
    const messageReadStatusResult = await addMessageReadStatus();
    if (!messageReadStatusResult) {
      log("❌ Message read status migration failed");
      return false;
    }

    // Add deleted_at columns to posts and comments
    const deletedAtResult = await addDeletedAtColumns();
    if (!deletedAtResult) {
      log("❌ Add deleted_at columns migration failed");
      return false;
    }

    // Add feed and forum features (downvotes, reposts, bookmarks)
    const feedFeaturesResult = await addFeedFeatures();
    if (!feedFeaturesResult) {
      log("❌ Add feed features migration failed");
      return false;
    }

    // Add community features (wall likes, comments, join requests, images)
    const communityFeaturesResult = await addCommunityFeatures();
    if (!communityFeaturesResult) {
      log("❌ Add community features migration failed");
      return false;
    }

    // Add hashtag system (hashtags, microblog_hashtags, trending)
    const hashtagSystemResult = await addHashtagSystem();
    if (!hashtagSystemResult) {
      log("❌ Add hashtag system migration failed");
      return false;
    }

    // Add keyword system (keywords, microblog_keywords, trending)
    const keywordSystemResult = await addKeywordSystem();
    if (!keywordSystemResult) {
      log("❌ Add keyword system migration failed");
      return false;
    }

    // Add post hashtag/keyword system (post_hashtags, post_keywords)
    const postHashtagKeywordResult = await addPostHashtagKeywordSystem();
    if (!postHashtagKeywordResult) {
      log("❌ Add post hashtag/keyword system migration failed");
      return false;
    }

    // Add Q&A inbox system (user_permissions, qa_areas, qa_tags, user_questions, etc.)
    const qaInboxSystemResult = await addQaInboxSystem();
    if (!qaInboxSystemResult) {
      log("❌ Add Q&A inbox system migration failed");
      return false;
    }

    // Add category column to events table
    const eventsCategoryResult = await addEventsCategory();
    if (!eventsCategoryResult) {
      log("❌ Add events category migration failed");
      return false;
    }

    // Add image_position, target_gender, target_age_group to events table
    const eventPositionAudienceResult = await addEventPositionAudience();
    if (!eventPositionAudienceResult) {
      log("❌ Add event position/audience migration failed");
      return false;
    }

    log("✅ All migrations completed successfully");
    return true;
  } catch (error) {
    log("❌ Error running migrations: " + String(error));
    return false;
  }
}

// Run migrations when this file is executed directly (not when imported)
// Check if this is the main module being executed
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  runAllMigrations()
    .then((success) => {
      console.info(`Migration process completed: ${success ? 'SUCCESS' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error running migrations:", error);
      process.exit(1);
    });
}