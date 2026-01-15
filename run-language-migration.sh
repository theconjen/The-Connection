#!/bin/bash
# Run language detection migration
# This adds language fields to posts, microblogs, and user_preferences tables

echo "Running language detection migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  echo "Please set it first:"
  echo "  export DATABASE_URL='your-database-connection-string'"
  exit 1
fi

# Run the migration
psql "$DATABASE_URL" < migrations/add_language_detection.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
  echo ""
  echo "Language personalization is now active. Changes:"
  echo "  - posts.detected_language added"
  echo "  - microblogs.detected_language added"
  echo "  - user_preferences.preferred_languages added"
  echo "  - user_preferences.language_engagement added"
  echo ""
  echo "Restart your server to activate the feature!"
else
  echo "❌ Migration failed"
  echo "Check the error message above"
  exit 1
fi
