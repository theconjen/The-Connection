# Remaining Logic Issues - The Connection

**Date:** November 14, 2025
**Priority:** Medium to High
**Status:** ⚠️ Needs Attention

---

## Overview

After fixing the 5 critical issues, there are **additional logic problems** that should be addressed to improve security, data integrity, and user experience. These are not as urgent as the critical fixes but will prevent future issues.

---

## 🔴 High Priority Logic Issues

### 1. **Upvote Tracking - No User Association** 🔴
**Severity:** HIGH
**Files:** [server/routes.ts:1041-1050](server/routes.ts#L1041-L1050), [server/routes.ts:1080-1089](server/routes.ts#L1080-L1089), [server/storage.ts](server/storage.ts)

**Problem:**
The upvote system doesn't track WHICH users upvoted, allowing:
- Multiple upvotes from same user
- No way to show "You upvoted this"
- No way to undo upvotes
- Can't prevent abuse

**Current Implementation:**
```typescript
// Route - doesn't pass userId
app.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
  const postId = parseInt(req.params.id);
  const post = await storage.upvotePost(postId); // userId NOT passed!
  res.json(post);
});

// Storage - just increments counter
async upvotePost(id: number): Promise<Post> {
  const post = this.data.posts.find(p => p.id === id);
  post.upvotes = (post.upvotes || 0) + 1; // No user tracking!
  return post;
}
```

**Solution Needed:**
Create junction tables to track votes:

```sql
-- New table needed
CREATE TABLE post_votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Prevent duplicate votes
);

CREATE TABLE comment_votes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES comments(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
```

```typescript
// Updated route
app.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = getSessionUserId(req)!;
  const result = await storage.togglePostVote(postId, userId);
  res.json(result);
});

// Updated storage method
async togglePostVote(postId: number, userId: number) {
  // Check if already voted
  const existingVote = await db.query.postVotes.findFirst({
    where: (votes, { and, eq }) => and(
      eq(votes.postId, postId),
      eq(votes.userId, userId)
    )
  });

  if (existingVote) {
    // Remove vote
    await db.delete(postVotes).where(eq(postVotes.id, existingVote.id));
    return { voted: false, message: 'Vote removed' };
  } else {
    // Add vote
    await db.insert(postVotes).values({ postId, userId });
    return { voted: true, message: 'Vote added' };
  }
}
```

**Impact:** Prevents abuse, enables proper UX

---

### 2. **Event RSVP - Missing Authorization Check** 🔴
**Severity:** HIGH
**File:** [server/routes.ts:1231-1243](server/routes.ts#L1231-L1243)

**Problem:**
Anyone can RSVP to any event, even private/invite-only events they shouldn't access.

**Current Code:**
```typescript
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = getSessionUserId(req)!;
  const { status } = req.body;

  // NO CHECK if user can access this event!
  const rsvp = await storage.updateEventRSVP(eventId, status);
  res.json(rsvp);
});
```

**Fix:**
```typescript
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = getSessionUserId(req)!;
  const { status } = req.body;

  // Verify event exists and user can access it
  const event = await storage.getEvent(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check authorization
  if (!event.isPublic) {
    // For private events, check if user is in the community/invited
    const isMember = event.communityId
      ? await storage.isCommunityMember(userId, event.communityId)
      : false;

    if (!isMember) {
      return res.status(403).json({
        message: 'You do not have access to this private event'
      });
    }
  }

  const rsvp = await storage.updateEventRSVP(eventId, userId, status);
  res.json(rsvp);
});
```

**Impact:** Prevents unauthorized access to private events

---

### 3. **Admin Check Uses Session Instead of Database** 🔴
**Severity:** HIGH
**File:** [server/routes.ts:1256](server/routes.ts#L1256)

**Problem:**
Session data can be stale or manipulated. Admin status should be verified against database.

**Current Code:**
```typescript
if (event.organizerId !== userId && !req.session.isAdmin) {
  return res.status(403).json({ message: 'Only the organizer or admin can delete this event' });
}
```

**Fix:**
```typescript
if (event.organizerId !== userId) {
  // Check database for admin status, not session
  const user = await storage.getUser(userId);
  if (!user?.isAdmin) {
    return res.status(403).json({
      message: 'Only the organizer or admin can delete this event'
    });
  }
}
```

**Why:**
- Session could be outdated (admin demoted but still has session)
- Session could be spoofed
- Database is source of truth

**Impact:** Better security, prevents privilege escalation

---

## 🟡 Medium Priority Logic Issues

### 4. **Inconsistent getSessionUserId Usage**
**Severity:** MEDIUM
**Files:** Throughout [server/routes.ts](server/routes.ts)

**Problem:**
Two different helper functions used:
- `getSessionUserId(req)` - Returns undefined if not found
- `getUserId(req)` - Never used!

Plus manual access patterns:
```typescript
const userId = req.session.userId;
const userId = req.session?.userId;
const userId = parseInt(String(req.session.userId));
```

**Recommendation:**
Standardize on ONE helper:

```typescript
// In server/utils/session.ts
export function getSessionUserId(req: Request): number | undefined {
  const raw = req.session?.userId;
  if (!raw) return undefined;
  return typeof raw === 'number' ? raw : parseInt(String(raw));
}

export function requireSessionUserId(req: Request): number {
  const userId = getSessionUserId(req);
  if (!userId) throw new Error('Not authenticated');
  return userId;
}
```

Then use consistently:
```typescript
// When userId is optional
const userId = getSessionUserId(req);

// When userId is required (already auth checked)
const userId = requireSessionUserId(req);
```

---

### 5. **Missing Input Validation**
**Severity:** MEDIUM
**Files:** Multiple routes

**Problem:**
Some endpoints don't validate input parameters:

```typescript
// No validation on status value!
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  const { status } = req.body; // Could be anything!
  const rsvp = await storage.updateEventRSVP(eventId, status);
});
```

**Fix:**
```typescript
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  const { status } = req.body;

  // Validate status
  const validStatuses = ['going', 'maybe', 'not_going'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid RSVP status. Must be: going, maybe, or not_going'
    });
  }

  const rsvp = await storage.updateEventRSVP(eventId, userId, status);
  res.json(rsvp);
});
```

**Other Examples:**
- Event visibility filters should be validated
- Sort parameters should be validated
- Page/limit parameters should have min/max

---

### 6. **Nearby Events - Not Implemented**
**Severity:** MEDIUM
**File:** [server/routes.ts:1190-1199](server/routes.ts#L1190-L1199)

**Problem:**
Endpoint accepts lat/lng/radius but ignores them:

```typescript
app.get('/api/events/nearby', async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  const events = await storage.getAllEvents(); // Doesn't use params!
  res.json(events);
});
```

**Fix Options:**

1. **Implement it:**
```typescript
app.get('/api/events/nearby', async (req, res) => {
  const { latitude, longitude, radius } = req.query;

  // Validate params
  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const rad = parseFloat(radius as string) || 10; // Default 10 miles

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      message: 'Invalid latitude or longitude'
    });
  }

  const events = await storage.getNearbyEvents(lat, lng, rad);
  res.json(events);
});
```

2. **Or remove the endpoint if not needed**

---

### 7. **Missing Error Details for Development**
**Severity:** LOW
**Files:** All error handlers

**Problem:**
Errors are logged but generic messages sent to client, making debugging hard:

```typescript
} catch (error) {
  console.error('Error creating post:', error);
  res.status(500).json({ message: 'Error creating post' });
}
```

**Better Approach:**
```typescript
} catch (error) {
  console.error('Error creating post:', error);

  // In development, include error details
  const message = process.env.NODE_ENV === 'development'
    ? `Error creating post: ${error instanceof Error ? error.message : 'Unknown error'}`
    : 'Error creating post';

  res.status(500).json({
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: error instanceof Error ? error.stack : String(error)
    })
  });
}
```

---

## 🔵 Low Priority / Enhancement Issues

### 8. **Microblogs and Posts Seem Redundant**
**Observation:** Both `posts` and `microblogs` exist with similar functionality

**Question:** Are these meant to be different features? If so, what's the distinction?
- Posts: Longer form content?
- Microblogs: Twitter-like short updates?

**Recommendation:** Document the intended difference or merge them

---

### 9. **No Pagination**
**Impact:** Performance issues with large datasets

All list endpoints return ALL records:
- `/api/posts` - Returns all posts
- `/api/events` - Returns all events
- `/api/communities` - Returns all communities

**Recommendation:** Add pagination:
```typescript
app.get('/api/posts', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;

  const { posts, total } = await storage.getPosts({ limit, offset, filter });

  res.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
```

---

### 10. **No Soft Delete for Critical Resources**
**Impact:** Data recovery issues

Events, posts, comments are hard deleted:
```typescript
await storage.deleteEvent(eventId); // Gone forever!
```

**Recommendation:** Use soft delete pattern:
```typescript
await storage.softDeleteEvent(eventId); // Sets deletedAt timestamp
```

You already have `deletedAt` columns in schema, just need to use them!

---

## 📋 Implementation Priority

### Implement Now (High Priority)
1. ✅ **Upvote tracking** - Prevents abuse
2. ✅ **Event RSVP authorization** - Security issue
3. ✅ **Admin checks via database** - Security issue

### Implement Soon (Medium Priority)
4. ⏳ **Standardize session helpers** - Code quality
5. ⏳ **Input validation** - Data integrity
6. ⏳ **Nearby events** - Complete or remove

### Consider Later (Low Priority)
7. ⏳ **Better error handling** - Developer experience
8. ⏳ **Pagination** - Performance (when needed)
9. ⏳ **Soft deletes** - Data safety
10. ⏳ **Clarify posts vs microblogs** - Architecture

---

## 🛠️ Quick Wins

These can be fixed quickly with high impact:

1. **Add RSVP authorization check** - 10 lines of code
2. **Change admin check to database** - 3 lines of code
3. **Add RSVP status validation** - 5 lines of code
4. **Fix nearby events or remove it** - 2 minutes

---

## 📚 Long-Term Improvements

### Database Migrations Needed
- Post votes table
- Comment votes table
- Indexes on frequently queried columns

### Testing Needed
- Unit tests for voting logic
- Integration tests for RSVP flow
- Authorization tests for private events

### Documentation Needed
- API endpoint documentation
- Data model documentation
- Feature distinctions (posts vs microblogs)

---

## Summary

**Critical fixes completed:** ✅ 5/5
**High priority remaining:** ⚠️ 3 issues
**Medium priority remaining:** ⚠️ 4 issues
**Low priority remaining:** ℹ️ 3 issues

**Estimated time to fix high priority:** 2-4 hours
**Estimated time to fix medium priority:** 4-6 hours

The application is **functional and secure** after the critical fixes, but these remaining issues should be addressed before major user growth to ensure:
- Data integrity
- Security
- Scalability
- Maintainability
