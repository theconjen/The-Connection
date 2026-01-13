# Community Filters Integration Guide

## Overview
The community filters are now fully integrated with the database, backend API, and mobile app. This document explains what was done and what steps are needed to complete the integration.

## What Was Done

### 1. Database Schema Updates
**File:** `/migrations/add_community_filters.sql`
- Added 10 new columns to the `communities` table:
  - `age_group` (TEXT) - Youth, Young Adult, Adult, Seniors, All Ages
  - `gender` (TEXT) - Men's Only, Women's Only, Co-Ed
  - `ministry_types` (TEXT[]) - Array of ministry types
  - `activities` (TEXT[]) - Array of activities
  - `professions` (TEXT[]) - Array of professions
  - `recovery_support` (TEXT[]) - Array of recovery/support types
  - `meeting_type` (TEXT) - In-Person, Online, Hybrid
  - `frequency` (TEXT) - Daily, Weekly, Bi-weekly, Monthly, One-time
  - `life_stages` (TEXT[]) - Array of life stages
  - `parent_categories` (TEXT[]) - Array of parent categories
- Created indexes for performance (regular indexes for single values, GIN indexes for arrays)

### 2. Schema TypeScript Definition
**File:** `/packages/shared/src/schema.ts`
- Updated the `communities` pgTable definition to include all new filter fields
- Added camelCase field names that match the database snake_case columns

### 3. Backend API Updates
**File:** `/server/routes/communities.ts`
- Updated `GET /api/communities` endpoint to:
  - Accept filter query parameters
  - Parse comma-separated values for array filters
  - Apply filters to the fetched communities
  - Support both single-value filters (ageGroup, gender, meetingType, frequency)
  - Support multi-value array filters (ministryTypes, activities, professions, etc.)

### 4. Mobile App Service
**File:** `/mobile-app/TheConnectionMobile-standalone/src/services/communitiesService.ts` (NEW)
- Created `fetchCommunities()` function that:
  - Accepts search query and filters object
  - Builds URL query parameters
  - Makes API call to `/api/communities`
  - Returns typed Community array

### 5. Mobile App UI
**File:** `/mobile-app/TheConnectionMobile-standalone/src/screens/CommunitiesScreen.tsx`
- Added React hooks (useState, useEffect) to fetch real data
- Connected filter selections to API calls
- Added loading and error states
- Displays fetched communities dynamically
- Shows appropriate messages when no communities found

## Filter Categories Available

1. **Age Group** - Youth, Young Adult, Adult, Seniors, All Ages
2. **Gender** - Men's Only, Women's Only, Co-Ed
3. **Ministry Type** - Bible Study, Prayer, Worship, Discipleship, Evangelism, Missions, Apologetics, Youth Ministry, Children Ministry
4. **Activities** - 33 options including Sports, Music, Arts & Crafts, Outdoor Adventures, Service Projects, etc.
5. **Professions** - Healthcare, Teachers, Business, Tech, Creatives, Legal, First Responders, Military, Blue Collar, Entrepreneurs, Students
6. **Recovery & Support** - Addiction Recovery, Grief Support, Mental Health, Divorce Recovery, Financial Recovery, Health Challenges
7. **Meeting Type** - In-Person, Online, Hybrid
8. **Frequency** - Daily, Weekly, Bi-weekly, Monthly, One-time
9. **Life Stage** - Singles, Married, Students, Young Professionals, Seniors, New Believers, Ministry Leaders
10. **Parents** - All Parents, Moms, Dads, Single Parents, Adoptive Parents, Foster Parents, Expecting Parents

## Steps to Complete Integration

### Step 1: Run the Database Migration
```bash
cd /Users/rawaselou/Desktop/The-Connection-main

# Connect to your database and run the migration
psql $DATABASE_URL -f migrations/add_community_filters.sql

# Or if using a migration runner:
node server/run-migrations.ts
```

### Step 2: Update Existing Communities (Optional)
You may want to add filter values to existing communities in your database:

```sql
-- Example: Update a community with filter values
UPDATE communities
SET
  age_group = 'Young Adult',
  gender = 'Co-Ed',
  ministry_types = ARRAY['Bible Study', 'Prayer'],
  activities = ARRAY['Coffee & Conversations', 'Book Club'],
  meeting_type = 'Hybrid',
  frequency = 'Weekly',
  life_stages = ARRAY['Singles', 'Young Professionals']
WHERE slug = 'young-professionals';
```

### Step 3: Update Community Creation Forms
When users create new communities, you should add UI elements to let them select:
- Age Group (dropdown)
- Gender (dropdown)
- Ministry Types (multi-select)
- Activities (multi-select)
- Professions (multi-select)
- Recovery Support (multi-select - if applicable)
- Meeting Type (dropdown)
- Frequency (dropdown)
- Life Stages (multi-select)
- Parent Categories (multi-select - if applicable)

### Step 4: Test the Integration
1. **Test Mobile App:**
   ```bash
   cd /Users/rawaselou/Desktop/TheConnectionMobile-standalone
   npm run start
   ```
   - Navigate to Communities tab
   - Try the search bar
   - Open the Filters modal
   - Select various filters
   - Verify communities are filtered correctly

2. **Test API Directly:**
   ```bash
   # Test with filters
   curl "http://localhost:5000/api/communities?ageGroup=Young%20Adult&gender=Co-Ed&ministryTypes=Bible%20Study,Prayer"
   ```

### Step 5: Verify Database Performance
The migration includes indexes, but monitor query performance:
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE
SELECT * FROM communities
WHERE age_group = 'Young Adult'
  AND 'Bible Study' = ANY(ministry_types);
```

## API Usage Examples

### Search Only
```
GET /api/communities?search=prayer
```

### Single Filter
```
GET /api/communities?ageGroup=Young%20Adult
```

### Multiple Filters
```
GET /api/communities?ageGroup=Young%20Adult&gender=Co-Ed&meetingType=Hybrid
```

### Array Filters (comma-separated)
```
GET /api/communities?ministryTypes=Bible%20Study,Prayer&activities=Coffee%20%26%20Conversations,Book%20Club
```

### Combined Search + Filters
```
GET /api/communities?search=bible&ministryTypes=Bible%20Study&ageGroup=Adult
```

## Mobile App Filter Usage

The mobile app automatically handles filter selection and API calls:
1. User opens filter modal by tapping "Filters" button
2. User selects multiple options from any category
3. User taps "Apply Filters"
4. Modal closes and `useEffect` automatically fetches filtered communities
5. Loading state shows while fetching
6. Communities list updates with filtered results

## Troubleshooting

### Issue: Filters not working
- **Check:** Did you run the migration? Verify columns exist:
  ```sql
  \d communities
  ```
- **Check:** Are filter values properly saved in the database?
  ```sql
  SELECT age_group, gender, ministry_types FROM communities LIMIT 5;
  ```

### Issue: No communities showing
- **Check:** Do communities in the database have filter values set?
- **Check:** Are filters too restrictive? Try clearing all filters
- **Check:** Check browser/app console for API errors

### Issue: Performance is slow
- **Check:** Verify indexes were created:
  ```sql
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'communities'
    AND indexname LIKE 'idx_communities_%';
  ```

## Next Steps

1. ✅ Database migration completed
2. ✅ Backend API updated
3. ✅ Mobile app connected
4. ⏳ Run the migration on your database
5. ⏳ Update existing community data with filter values
6. ⏳ Add filter selection to community creation/edit forms
7. ⏳ Test thoroughly with various filter combinations

## Notes

- Filters use "OR" logic within a category (e.g., selecting "Basketball" OR "Soccer" in Activities)
- Filters use "AND" logic across categories (e.g., Age Group AND Gender AND Ministry Type)
- Array filters check for overlap (at least one matching value)
- Empty filter values are ignored (null-safe filtering)
- All filters are optional - communities without filter values set will not appear in filtered results

---

**Last Updated:** 2026-01-12
**Status:** Ready for testing after migration
