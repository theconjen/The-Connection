# Follower-Based Feed Implementation

## Overview
Implemented a personalized feed system where users see content from people they follow in both Microblogs (Feed) and Forums.

## How It Works

### Feed Behavior

#### Recent Tab (Default)
- **Logged In**: Shows ONLY posts from users you follow
- **Not Logged In**: Shows all posts
- **Sorting**: Most recent first

#### Popular Tab
- **Logged In**: Shows a MIX of:
  - All posts from users you follow
  - Top 20 most popular posts from other users (ranked by Christian values algorithm)
- **Not Logged In**: Shows all posts sorted by Christian values score
- **Sorting**: Christian values feed algorithm (unity, Christ-likeness, debate, enjoyment)

### Database Methods

#### New Storage Methods
```typescript
// Get microblogs from followed users
getFollowingMicroblogs(userId: number): Promise<Microblog[]>

// Get forum posts from followed users
getFollowingPosts(userId: number): Promise<Post[]>
```

#### Implementation Details
- Uses existing `user_follows` table
- Queries posts where `authorId IN (followingIds)`
- Returns empty array if user doesn't follow anyone
- Sorted by creation date (most recent first)

### API Endpoints

#### Microblogs (Feed)
```
GET /api/microblogs?filter=recent   # Followed users' posts (chronological)
GET /api/microblogs?filter=popular  # Followed + popular posts (scored)
```

#### Forums (Posts)
```
GET /api/posts?filter=recent   # Followed users' posts (chronological)
GET /api/posts?filter=popular  # Followed + popular posts (scored)
```

### Christian Values Feed Algorithm

The Popular tab uses a weighted scoring system:

**Value Categories:**
- **Christ-likeness** (35% weight): love, grace, mercy, forgiveness, compassion, kindness, humility
- **Unity** (30% weight): together, fellowship, community, church, united
- **Enjoyment** (20% weight): joy, celebrate, blessed, grateful, testimony
- **Debate** (15% weight): discuss, question, perspective, explore, understand

**Additional Factors:**
- Engagement: comments (5x), reposts (3x), likes (1x)
- Recency: Posts within 2 hours get 100% score, decays over time
- Bible references: +15 points for scripture citations
- Prayer requests: +10 points for #prayer hashtags
- Negative content: Penalty for hate, division, toxic language

### Pull-to-Refresh

Both FeedScreen and ForumsScreen support pull-to-refresh:
- Pull down gesture triggers refresh
- Shows loading indicator
- Refetches latest content from followed users
- Already implemented (no changes needed)

### Privacy & Security

**Automatic Filtering:**
- Blocked users' content is hidden
- Private account posts only visible to author
- Users always see their own posts

**User Experience:**
- Empty feed if not following anyone (shows message to follow users)
- Guest users see all public content
- Seamless transition between tabs

## Testing

### Test Scenarios

1. **New User (No Followers)**
   ```bash
   # Recent: Empty feed
   curl "http://localhost:5001/api/microblogs?filter=recent"
   # Returns: []

   # Popular: Global popular content
   curl "http://localhost:5001/api/microblogs?filter=popular"
   # Returns: Top scored posts
   ```

2. **User with Followers**
   ```bash
   # Recent: Followed users' posts
   curl "http://localhost:5001/api/microblogs?filter=recent" \
     -H "Cookie: sessionId=..."

   # Popular: Followed + trending posts
   curl "http://localhost:5001/api/microblogs?filter=popular" \
     -H "Cookie: sessionId=..."
   ```

3. **Guest User**
   ```bash
   # Always shows all public content
   curl "http://localhost:5001/api/microblogs"
   ```

## Files Modified

### Backend
- `/server/storage.ts`
  - Added `getFollowingMicroblogs()` method (DbStorage + MemStorage)
  - Added `getFollowingPosts()` method (DbStorage + MemStorage)
  - Updated IStorage interface

- `/server/routes/microblogs.ts`
  - Modified GET /microblogs to use follower-based feed
  - Popular tab combines followed + trending content
  - Recent tab shows followed users only

- `/server/routes/posts.ts`
  - Modified GET /posts to use follower-based feed
  - Popular tab combines followed + trending content
  - Recent tab shows followed users only

### Frontend
- No changes needed! Pull-to-refresh already implemented in:
  - `/src/screens/FeedScreen.tsx`
  - `/src/screens/ForumsScreen.tsx`

## Benefits

1. **Personalized Experience**: Users see content from people they care about
2. **Content Discovery**: Popular tab still surfaces trending content
3. **Christian Values**: Feed algorithm promotes unity and Christ-likeness
4. **Performance**: Efficient SQL queries with proper indexing
5. **Privacy**: Respects user blocks and private accounts

## Future Enhancements

- Add "Discover" tab for non-followed popular content
- Implement follower suggestions based on interests
- Add notifications for followed users' posts
- Track engagement metrics per follower relationship
- Implement "mute" functionality (follow but hide from feed)

## Server Status

✅ Running on port 5001
✅ All endpoints tested and working
✅ Pull-to-refresh functional
✅ Ready for production deployment

---

**Last Updated**: January 14, 2026
**Implementation**: Complete
**Status**: Production Ready
