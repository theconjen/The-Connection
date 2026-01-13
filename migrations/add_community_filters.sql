-- Migration: Add comprehensive filter fields to communities table
-- Date: 2026-01-12
-- Description: Adds fields to support age group, gender, ministry type, activities,
--              professions, recovery, meeting type, frequency, life stage, and parent filters

ALTER TABLE communities
ADD COLUMN IF NOT EXISTS age_group TEXT, -- Youth, Young Adult, Adult, Seniors, All Ages
ADD COLUMN IF NOT EXISTS gender TEXT, -- Men's Only, Women's Only, Co-Ed
ADD COLUMN IF NOT EXISTS ministry_types TEXT[], -- Array: Bible Study, Prayer, Worship, etc.
ADD COLUMN IF NOT EXISTS activities TEXT[], -- Array: Sports, Basketball, Music, etc.
ADD COLUMN IF NOT EXISTS professions TEXT[], -- Array: Healthcare, Teachers, Tech, Blue Collar, etc.
ADD COLUMN IF NOT EXISTS recovery_support TEXT[], -- Array: Addiction Recovery, Grief Support, etc.
ADD COLUMN IF NOT EXISTS meeting_type TEXT, -- In-Person, Online, Hybrid
ADD COLUMN IF NOT EXISTS frequency TEXT, -- Daily, Weekly, Bi-weekly, Monthly, One-time
ADD COLUMN IF NOT EXISTS life_stages TEXT[], -- Array: Singles, Married, Students, etc.
ADD COLUMN IF NOT EXISTS parent_categories TEXT[]; -- Array: All Parents, Moms, Dads, Single Parents, etc.

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communities_age_group ON communities(age_group);
CREATE INDEX IF NOT EXISTS idx_communities_gender ON communities(gender);
CREATE INDEX IF NOT EXISTS idx_communities_meeting_type ON communities(meeting_type);
CREATE INDEX IF NOT EXISTS idx_communities_frequency ON communities(frequency);

-- Create GIN indexes for array columns for efficient array searches
CREATE INDEX IF NOT EXISTS idx_communities_ministry_types ON communities USING GIN(ministry_types);
CREATE INDEX IF NOT EXISTS idx_communities_activities ON communities USING GIN(activities);
CREATE INDEX IF NOT EXISTS idx_communities_professions ON communities USING GIN(professions);
CREATE INDEX IF NOT EXISTS idx_communities_recovery_support ON communities USING GIN(recovery_support);
CREATE INDEX IF NOT EXISTS idx_communities_life_stages ON communities USING GIN(life_stages);
CREATE INDEX IF NOT EXISTS idx_communities_parent_categories ON communities USING GIN(parent_categories);

-- Add comments for documentation
COMMENT ON COLUMN communities.age_group IS 'Target age group: Youth, Young Adult, Adult, Seniors, All Ages';
COMMENT ON COLUMN communities.gender IS 'Gender restriction: Men''s Only, Women''s Only, Co-Ed';
COMMENT ON COLUMN communities.ministry_types IS 'Ministry focus areas (array)';
COMMENT ON COLUMN communities.activities IS 'Community activities (array)';
COMMENT ON COLUMN communities.professions IS 'Target professions (array)';
COMMENT ON COLUMN communities.recovery_support IS 'Recovery and support types (array)';
COMMENT ON COLUMN communities.meeting_type IS 'Meeting format: In-Person, Online, Hybrid';
COMMENT ON COLUMN communities.frequency IS 'Meeting frequency: Daily, Weekly, Bi-weekly, Monthly, One-time';
COMMENT ON COLUMN communities.life_stages IS 'Target life stages (array)';
COMMENT ON COLUMN communities.parent_categories IS 'Parent-specific categories (array)';
