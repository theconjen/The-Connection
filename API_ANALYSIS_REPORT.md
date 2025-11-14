# The Connection App - Backend API Endpoints & Frontend Mismatch Analysis

## Executive Summary
Comprehensive audit of server routes and identified:
- 120+ API endpoints defined
- Missing error handling in critical areas
- Inconsistent authentication middleware usage
- Frontend/backend endpoint mismatches
- Authentication middleware inconsistencies

---

## 1. ALL DEFINED API ENDPOINTS

### Authentication Routes (/api/auth, /api/register, /api/login, /api/logout)
**File:** `/workspaces/The-Connection/server/routes/api/auth.ts` + `/workspaces/The-Connection/server/auth.ts`

- POST `/api/auth/magic` - Magic code authentication (rate limited: 5/15min)
- POST `/api/auth/verify` - Verify magic code (rate limited: 10/15min)
- POST `/api/register` - Register new user (rate limited: 3/hour)
- POST `/api/login` - User login (rate limited: 5/15min)
- POST `/api/logout` - User logout
- GET `/api/user` - Get current user profile

**Authentication:** ✓ Properly rate-limited, has error handling

### Feed Routes (/api/feed)
**File:** `/workspaces/The-Connection/server/routes/feed.ts`

- GET `/api/feed` - Paginated feed (cursor-based)
  - Query params: `cursor` (string | null)
  - Response: `{ items: Post[], nextCursor: string | null }`

**Authentication:** No auth required (public)
**Error Handling:** ✓ Good (JSON error messages)

### Posts Routes (/api/posts)
**File:** `/workspaces/The-Connection/server/routes/posts.ts`

- GET `/api/posts` - Get all posts (filtered, block-aware)
- GET `/api/posts/:id` - Get single post
- POST `/api/posts` - Create post (requires auth)
  - Body: `{ text, communityId? }` (mapped to schema)
- POST `/api/posts/:id/upvote` - Upvote post (requires auth)
- GET `/api/posts/:id/comments` - Get post comments
- POST `/api/comments` - Create comment (requires auth)
- POST `/api/comments/:id/upvote` - Upvote comment (requires auth)

**Authentication:** Mixed - Some require `isAuthenticated`, some public
**Error Handling:** ✓ Present, returns 201 on creation

### Communities Routes (/api/communities)
**File:** `/workspaces/The-Connection/server/routes/communities.ts` + `/workspaces/The-Connection/server/routes.ts`

- GET `/api/communities` - List communities (searchable)
- GET `/api/communities/:idOrSlug` - Get community by ID or slug
- GET `/api/communities/:id/feed` - Get community-specific feed
- POST `/api/communities` - Create community (requires auth)
- DELETE `/api/communities/:id` - Delete community (requires auth)
- GET `/api/communities/:idOrSlug/members` - Get community members
- POST `/api/communities/:idOrSlug/join` - Join community (requires auth)
- POST `/api/communities/:idOrSlug/leave` - Leave community (requires auth)
- POST `/api/communities/:idOrSlug/invite` - Invite to community (requires owner/mod)
- DELETE `/api/communities/:idOrSlug/members/:userId` - Remove member (requires owner/mod)
- GET `/api/communities/:idOrSlug/chat-rooms` - Get chat rooms
- POST `/api/communities/:idOrSlug/chat-rooms` - Create chat room (requires owner/mod)
- PUT `/api/chat-rooms/:roomId` - Edit chat room
- DELETE `/api/chat-rooms/:roomId` - Delete chat room
- GET `/api/chat-rooms/:roomId/messages` - Get room messages
- POST `/api/chat-rooms/:roomId/messages` - Send message (requires auth)
- GET `/api/communities/:idOrSlug/wall` - Get wall posts
- POST `/api/communities/:idOrSlug/wall` - Post to wall (requires auth + member)

**Authentication:** Inconsistent - Some endpoints check internally, some use middleware
**Error Handling:** ✓ Returns 403 for permission errors

### Events Routes (/api/events)
**File:** `/workspaces/The-Connection/server/routes/events.ts` + `/workspaces/The-Connection/server/routes.ts`

- GET `/api/events` - Get all events (block-aware)
- GET `/api/events/public` - Get public events only
- GET `/api/events/nearby` - Get nearby events (stub)
- GET `/api/events/upcoming` - Get upcoming events
- GET `/api/events/:id` - Get single event
- POST `/api/events` - Create event (requires auth)
  - Body: `{ title, description, startsAt, isPublic? }`
- DELETE `/api/events/:id` - Delete event (creator/admin only)
- PATCH `/api/events/:id/rsvp` - RSVP to event (requires auth)

**Authentication:** Mixed - Some public, some require `isAuthenticated`
**Error Handling:** ✓ Present

### User Routes (/api/user/*)
**File:** `/workspaces/The-Connection/server/routes/api/user.ts`

- GET `/api/user/profile` - Get current user profile (requires auth)
- PATCH `/api/user/profile` - Update profile (requires auth)
- PATCH `/api/user/:id` - Update user by ID (requires auth + ownership)
- GET `/api/user/communities` - Get user's communities (requires auth, unimplemented)
- GET `/api/user/prayer-requests` - Get user's prayer requests (requires auth)
- GET `/api/user/posts` - Get user's posts (requires auth, unimplemented)
- GET `/api/user/events` - Get user's events (requires auth, unimplemented)
- GET `/api/user/settings` - Get user settings (requires auth)
- PUT `/api/user/settings` - Update user settings (requires auth)

**Authentication:** ✓ All require `isAuthenticated` middleware
**Error Handling:** Uses `next(error)` - relies on global error handler

### Account Routes (/api/account)
**File:** `/workspaces/The-Connection/server/routes/account.ts`

- DELETE `/api/account/me` - Soft-delete user account (requires auth)

**Authentication:** ✓ Requires `isAuthenticated`
**Error Handling:** ✓ Present

### User Settings Routes (/api/user/settings)
**File:** `/workspaces/The-Connection/server/routes/userSettingsRoutes.ts`

- GET `/api/user/settings` - Get settings
- PUT `/api/user/settings` - Update settings

**Authentication:** ✓ Middleware applied to all
**Error Handling:** Returns 401, 404, 500

### Direct Messages Routes (/api/dms)
**File:** `/workspaces/The-Connection/server/routes/dmRoutes.ts`

- GET `/api/dms/:userId` - Get DMs with user (requires auth)
- POST `/api/dms/send` - Send DM (requires auth)
  - Body: `{ receiverId, content }`

**Authentication:** Checked inline, not via middleware
**Error Handling:** ⚠️ Missing - `/api/dms/send` returns `.send()` instead of `.json()`

### Prayer Requests Routes (/api/prayer-requests)
**File:** `/workspaces/The-Connection/server/routes.ts`

- GET `/api/prayer-requests` - List all prayer requests
- POST `/api/prayer-requests` - Create prayer request (requires auth)
- POST `/api/prayer-requests/:id/pray` - Record prayer (requires auth)

**Authentication:** Mixed
**Error Handling:** ✓ Present

### Microblogs Routes (/api/microblogs)
**File:** `/workspaces/The-Connection/server/routes.ts`

- GET `/api/microblogs` - Get all microblogs
- GET `/api/microblogs/:id` - Get single microblog
- POST `/api/microblogs` - Create microblog (requires auth)
- POST `/api/microblogs/:id/like` - Like microblog (requires auth)
- DELETE `/api/microblogs/:id/like` - Unlike microblog (requires auth)

**Authentication:** Mixed
**Error Handling:** ✓ Present

### Apologetics Routes (/api/apologetics)
**File:** `/workspaces/The-Connection/server/routes/apologetics.ts` + `/workspaces/The-Connection/server/routes.ts`

- GET `/api/apologetics` - Get apologetics resources (rate limited: 100/15min)
- GET `/api/apologetics/topics` - Get topics
- GET `/api/apologetics/questions` - Get questions
- POST `/api/apologetics/questions` - Ask question (requires auth)
- POST `/api/apologetics/answers` - Answer question (requires verified user)

**Authentication:** Varies
**Error Handling:** ✓ Mostly present

### Moderation Routes (/api/moderation)
**File:** `/workspaces/The-Connection/server/routes/moderation.ts`

- POST `/api/moderation/report` - Report content (requires auth)
  - Body: `{ contentType, contentId, reason, description }`
- POST `/api/moderation/block` - Block user (requires auth)
- GET `/api/moderation/blocked-users` - Get blocked users (requires auth)
- GET `/api/moderation/admin/reports` - List reports (admin only)
- GET `/api/moderation/admin/reports/:id` - Get report (admin only)
- PATCH `/api/moderation/admin/reports/:id` - Update report status (admin only)

**Authentication:** ✓ Properly checked
**Error Handling:** ✓ Present

### Safety Routes (/api/reports, /api/blocks)
**File:** `/workspaces/The-Connection/server/routes/safety.ts`

- POST `/api/reports` - Report content (requires auth)
- POST `/api/blocks` - Block user (requires auth)
- GET `/api/blocked-users` - Get blocked users (requires auth)

**Authentication:** ✓ Middleware applied
**Error Handling:** ✓ Present

### Admin Routes (/api/admin)
**File:** `/workspaces/The-Connection/server/routes/api/admin.ts` + `/workspaces/The-Connection/server/routes/admin.ts`

- GET `/api/admin/livestreamer-applications/:id` - View application
- PUT `/api/admin/livestreamer-applications/:id` - Update application status (admin only)
  - Body: `{ status, reviewNotes }`
- POST `/api/admin/apologist-scholar-applications/:id/review` - Review application (admin only)
  - Body: `{ status, reviewNotes }`
- (Multiple admin endpoints defined in routes.ts)

**Authentication:** ✓ Uses `isAdmin` middleware
**Error Handling:** ✓ Present with email notifications

### Applications Routes (/api/applications)
**File:** `/workspaces/The-Connection/server/routes.ts`

- POST `/api/applications/livestreamer` - Submit livestreamer application (requires auth)
- POST `/api/applications/apologist-scholar` - Submit scholar application (requires auth)

**Authentication:** ✓ Requires `isAuthenticated`
**Error Handling:** ✓ Present with email notifications

### Push Tokens Routes (/api/push-tokens)
**File:** `/workspaces/The-Connection/server/routes/pushTokens.ts`

- POST `/api/push-tokens/register` - Register push token (requires auth)
  - Body: `{ token, platform }`
- POST `/api/push-tokens/unregister` - Unregister token (requires auth)
- DELETE `/api/push-tokens/unregister` - Unregister token alt endpoint (requires auth)

**Authentication:** ✓ Requires `isAuthenticated`
**Error Handling:** ✓ Present

### Recommendation Routes (/api/recommendations)
**File:** `/workspaces/The-Connection/server/routes/recommendation.ts` + `/workspaces/The-Connection/server/routes.ts`

- GET `/api/recommendations/feed` - Get personalized feed (requires auth)
- POST `/api/recommendations/interaction` - Record interaction (requires auth)
- GET `/api/recommendations/friends-activity` - Get friends' activity (requires auth)

**Authentication:** ✓ Requires `isAuthenticated`
**Error Handling:** ✓ Present

### User Search Routes
**File:** `/workspaces/The-Connection/server/routes.ts`

- GET `/api/users` - Get all users (searchable)
  - Query: `?search=term`
- GET `/api/users/:id` - Get user by ID
- GET `/api/users/:id/liked-microblogs` - Get liked posts
- GET `/api/users/verified-apologetics-answerers` - Get verified users

**Authentication:** Varies (some public)
**Error Handling:** ✓ Present

### MVP Routes (/api/mvp)
**File:** `/workspaces/The-Connection/server/routes/mvp.ts`

- Multiple endpoints (limited scope)

### Search Routes
**File:** `/workspaces/The-Connection/server/routes.ts`

- GET `/api/search/communities` - Search communities
  - Query: `?q=query`

**Authentication:** None required
**Error Handling:** ✓ Present

### Utilities Routes
**File:** `/workspaces/The-Connection/server/routes.ts`

- POST `/api/objects/upload` - Get upload parameters
- GET `/api/notifications` - Get notifications (requires auth)
- PUT `/api/notifications/:id/read` - Mark notification read (requires auth)
- GET `/api/user/preferences` - Get preferences (requires auth)
- PUT `/api/user/preferences` - Update preferences (requires auth)
- POST `/api/test-email` - Send test email (admin only)
- GET `/api/health` - Health check endpoint

**Authentication:** Varies
**Error Handling:** ✓ Present

### Static Routes
- GET `/privacy` - Privacy policy
- GET `/terms` - Terms of service
- GET `/community-guidelines` - Community guidelines

---

## 2. MISSING ERROR HANDLING

### Critical Issues:

#### A. `/api/dms/send` - Missing JSON Error Response
**File:** `/workspaces/The-Connection/server/routes/dmRoutes.ts:34`
```typescript
if (!content) return res.status(400).send("Message content required");
```
**Issue:** Uses `.send()` instead of `.json()` - breaks JSON response contract
**Impact:** Frontend expecting JSON will fail parsing
**Fix:** `return res.status(400).json({ message: "Message content required" });`

#### B. Socket.IO Message Handlers - No Error Response
**File:** `/workspaces/The-Connection/server/routes.ts` (lines 175-201, 204-228)
```typescript
socket.on('new_message', async (data) => {
  try {
    // ... code ...
  } catch (error) {
    console.error('Error handling chat message:', error);
    // NO ERROR EMISSION BACK TO CLIENT
  }
});
```
**Issue:** Errors silently fail - client has no feedback
**Impact:** User won't know if message failed
**Fix:** `socket.emit('error', { message: 'Failed to send message' });`

#### C. Storage Call Errors - Swallowed
**File:** `/workspaces/The-Connection/server/routes/recommendation.ts` (lines 81-82)
```typescript
const rows = await storage.getReports?.({ status, limit });
res.json(rows || []);
```
**Issue:** If method doesn't exist (optional chaining), returns empty array
**Impact:** Admin can't see reports when method undefined
**Fix:** Verify methods exist and throw proper error

#### D. Validation Errors Inconsistent
**Multiple files:** Some endpoints validate inline, some rely on Zod
- `/api/posts` validates `text` length manually
- `/api/events` validates `startsAt` is future
- `/api/communities` validates slug generation

**Issue:** Inconsistent error messages and status codes
**Fix:** Use centralized validation wrapper

#### E. User ID Type Coercion Errors
**File:** Multiple routes (feed.ts, posts.ts, etc.)
```typescript
const userId = getSessionUserId(req);
if (userId) { ... }
```
**Issue:** Some routes check existence, some don't validate parse success
**Impact:** `NaN` could be passed to storage calls

#### F. Push Notification Error - Not Failing Request
**File:** `/workspaces/The-Connection/server/routes/dmRoutes.ts:66-69`
```typescript
try {
  // attempt push notification
} catch (pushError) {
  console.error('Error sending push notification:', pushError);
  // CONTINUES ANYWAY
}
```
**Issue:** Request succeeds even if push fails (correct behavior but undocumented)
**Impact:** Client doesn't know notification wasn't sent

### Moderate Issues:

- `/api/communities/:idOrSlug/*` - Multiple routes do slug resolution (5+ times)
- `/api/apologetics` - Returns `[]` on error (should 500)
- `/api/chat-rooms/:roomId/messages` - No validation of `limit` param (could be negative)
- `/api/notifications/:id/read` - Always returns success even if ID invalid

---

## 3. INCONSISTENT AUTHENTICATION MIDDLEWARE USAGE

### Inconsistency Types:

#### A. Different Middleware Patterns Used

**Pattern 1: Router-level middleware (recommended)**
```typescript
// userSettingsRoutes.ts
router.use(isAuthenticated);
router.get("/settings", ...);
```

**Pattern 2: Route-level middleware**
```typescript
// posts.ts
router.post('/api/posts', isAuthenticated, async (req, res) => {...});
```

**Pattern 3: Manual inline checks**
```typescript
// dmRoutes.ts
router.get("/:userId", async (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
});
```

**Issue:** Same feature (authentication) implemented 3 different ways
**Impact:** Code review difficulty, inconsistent error responses

#### B. Middleware Import Inconsistencies

Different files import from different locations:
- `/workspaces/The-Connection/server/routes/api/user.ts` - imports `isAuthenticated` from `../../auth`
- `/workspaces/The-Connection/server/routes/moderation.ts` - imports `isAuthenticated` from `../auth`
- `/workspaces/The-Connection/server/routes/recommendation.ts` - imports `requireAuth` from `../middleware/auth`

**Issue:** `requireAuth` and `isAuthenticated` are aliases, used inconsistently
**Impact:** Confusion about which to use, potential gaps in auth

#### C. Admin Middleware Inconsistency
- Some admin routes use `isAdmin` from `/server/auth.ts`
- Others manually check `req.session.isAdmin`

Example:
```typescript
// routes.ts line 1222
if (event.organizerId !== userId && !req.session.isAdmin) {
  return res.status(403).json(...);
}

// vs routes.ts line 1499
app.post('/api/admin/...', isAdmin, async (req, res) => {
```

#### D. Authenticated User ID Retrieval Inconsistencies

**5+ different patterns in codebase:**

1. Direct access:
```typescript
const userId = req.session.userId;
```

2. With type assertion:
```typescript
const userId = req.session?.userId;
if (!userId) return res.status(401)...
```

3. With conversion:
```typescript
const userId = parseInt(String(req.session.userId));
```

4. Helper function (feed.ts):
```typescript
function getSessionUserId(req: any): number | undefined {
  const raw = req.session?.userId;
  if (typeof raw === 'number') return raw;
  const n = parseInt(String(raw));
  return Number.isFinite(n) ? n : undefined;
}
```

5. Via middleware (recommendation.ts):
```typescript
req.currentUser?.id
```

**Issue:** Session userId is sometimes string, sometimes number (depends on session store)
**Impact:** Type errors, potential security gaps, inconsistent behavior

#### E. Body Parameter Validation Inconsistency

**Pattern 1: Manual validation**
```typescript
// events.ts
if (!title || !description || !startsAt) return res.status(400)...
```

**Pattern 2: Zod validation**
```typescript
// routes.ts
const validatedData = insertPostSchema.parse({...});
```

**Pattern 3: Optional chaining with defaults**
```typescript
// communities.ts
const { title, desc, name, description, iconName, iconColor } = req.body || {};
const effectiveName = name || title;
```

**Issue:** Multiple validation styles make code inconsistent
**Impact:** Some endpoints accept invalid data, potential bugs

#### F. Rate Limiting Inconsistencies

**Applied to:**
- `/api/auth/magic` - 5 per 15 min
- `/api/auth/verify` - 10 per 15 min
- `/api/register` - 3 per hour
- `/api/login` - 5 per 15 min
- `/api/apologetics` - 100 per 15 min

**NOT applied to:**
- `/api/posts` (create) - MISSING
- `/api/comments` - MISSING
- `/api/communities` (join) - MISSING
- `/api/moderation/report` - MISSING (should be rate limited!)
- `/api/dms/send` - MISSING (should be rate limited!)

**Issue:** Critical endpoints missing rate limiting
**Impact:** Spam/DOS vulnerability

---

## 4. FRONTEND/BACKEND MISMATCHES

### A. Actual Frontend API Calls

**From `/workspaces/The-Connection/shared/services/auth.ts`:**
```typescript
POST /login - Body: { username, password }
POST /register - Body: { username, email, password, name? }
POST /logout
GET /user
```

**From `/workspaces/The-Connection/shared/services/feed.ts`:**
```typescript
GET /feed?cursor=...
```

**Issue:** Frontend uses simple paths like `/login`, backend has `/api/login`
**Status:** ✓ Handled by `http()` client that prepends `/api`

### B. Event Creation Mismatch
**Backend expects:**
```typescript
{
  title: string,
  description: string,
  startsAt: ISO string,
  isPublic?: boolean
}
```

**Schema defines:**
```typescript
{
  title, description, eventDate, startTime, endTime, isPublic, creatorId
}
```

**Issue:** Frontend sends `startsAt`, backend maps to `eventDate` + `startTime`
**Status:** ✓ Works but confusing

### C. Posts Creation Mismatch
**Backend expects:**
```typescript
{ text: string, communityId?: number }
```

**Schema defines:**
```typescript
{ title, content, imageUrl, communityId, groupId, authorId }
```

**Issue:** Frontend sends `text`, backend maps to `title` and `content`
**Status:** ✓ Works (maps first 60 chars to title)

### D. Community Creation Field Names
**Routes in `communities.ts` accept:**
```typescript
{ title, desc, name, description, iconName, iconColor }
```

**Issue:** Uses `desc` OR `description`, `title` OR `name` - confusing
**Status:** ✗ Works but error-prone

### E. Missing `/api/user/communities` Implementation
**Frontend might expect:**
```typescript
GET /api/user/communities - Get authenticated user's communities
```

**Backend returns:**
```typescript
router.get('/communities', async (req, res, next) => {
  const communities = await storage.getAllCommunities(); // WRONG - should filter by user!
  res.json(communities);
});
```

**Issue:** Returns ALL communities, not user's
**Status:** ✗ **BROKEN** - needs fix

### F. Missing `/api/user/posts` Implementation
**Similar to communities - returns all posts, not user's**

### G. Missing `/api/user/events` Implementation
**Similar to communities - returns all events, not user's**

### H. Moderation Endpoint Duplication
**Two different report endpoints:**
- `/api/moderation/report` - contentType, contentId, reason, description
- `/api/reports` - subjectType, subjectId, reason, description

**Issue:** Duplicate endpoints with slightly different field names
**Status:** ✗ Confusing - should consolidate

### I. Block Endpoint Duplication
**Two different block endpoints:**
- `/api/moderation/block` - userId, reason
- `/api/blocks` - userId, reason

**Status:** ✗ Same issue - duplicate

### J. Blocked Users Endpoint Duplication
**Two identical endpoints:**
- `/api/moderation/blocked-users`
- `/api/blocked-users`

---

## 5. AUTHENTICATION MIDDLEWARE PATTERNS

### Current Issues:

#### Middleware Imports
File | Import Pattern | Uses
---|---|---
`auth.ts` | Exports `isAuthenticated`, `isAdmin` | Main auth system
`middleware/auth.ts` | Exports `requireAuth` alias | Some routes
`recommendation.ts` | Imports from `middleware/auth.ts` | Recommendations only

**Issue:** Two different middleware files with slightly different names
**Fix:** Consolidate to single auth.ts export

#### Session User ID Handling
**Problem:** Session stores may serialize userId as string, but code expects number

```typescript
// Different routes handle differently:
req.session.userId // Sometimes string, sometimes number!
parseInt(String(req.session.userId)) // Defensive parsing
typeof raw === 'number' ? raw : parseInt(String(raw)) // Full defensive check
```

**Critical:** Lines 167-179 in `/workspaces/The-Connection/server/auth.ts` show session userId stored as STRING
```typescript
req.session.userId = user.id.toString(); // <-- STORED AS STRING!
```

But routes.ts line 284-292 and many others expect NUMBER
```typescript
const userId = getSessionUserId(req)!; // Implicit cast
```

---

## 6. SPECIFIC SECURITY ISSUES

### A. RSVP Endpoint Missing User Validation
**File:** `/workspaces/The-Connection/server/routes.ts:1197`
```typescript
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    const { status } = req.body;
    
    const rsvp = await storage.updateEventRSVP(eventId, status);
    // NO VALIDATION THAT userId MATCHES rsvp.userId!
    res.json(rsvp);
  }
});
```

**Issue:** Doesn't verify user owns the RSVP
**Fix:** Check `rsvp.userId === userId` before returning

### B. Comment Upvote Missing User Tracking
**File:** `/workspaces/The-Connection/server/routes/posts.ts:107`
```typescript
router.post('/api/comments/:id/upvote', isAuthenticated, async (req, res) => {
  const commentId = parseInt(req.params.id);
  const comment = await storage.upvoteComment(commentId);
  // DOESN'T PASS userId - How does storage.upvoteComment know who voted?
  res.json(comment);
});
```

**Issue:** Doesn't track which user upvoted
**Fix:** Pass `userId` to storage method

### C. Post Upvote Same Issue
**File:** `/workspaces/The-Connection/server/routes/posts.ts:73`

### D. Event Delete Authorization Bypass
**File:** `/workspaces/The-Connection/server/routes.ts:1222`
```typescript
if (event.organizerId !== userId && !req.session.isAdmin) {
  return res.status(403).json(...);
}
```

**Issue:** Relies on session data instead of verifying admin in database
**Better:** Query database for admin status or use `isAdmin` middleware

### E. Push Token Deletion Metrics Exposed
**File:** `/workspaces/The-Connection/server/routes/pushTokens.ts:31-35`
```typescript
let metrics = {
  unregisterAttempts: 0,
  unregisterSuccess: 0,
  unregisterForbidden: 0,
};
```

**Issue:** Global metrics object not reset, could be used for enumeration attacks
**Fix:** Use proper metrics system, not in-memory counter

---

## 7. MISSING ENDPOINTS (Frontend Expects but Backend Doesn't Provide)

Based on frontend service signatures and common patterns:

1. **PATCH `/api/user/profile` or `/api/user/:id`** - Update profile
   - Status: ✓ EXISTS in `/api/user/:id` and `/api/user/profile`

2. **POST `/api/microblogs/:id/comment`** - Comment on microblog
   - Status: ✗ MISSING (only POST endpoints for posts)

3. **GET `/api/user/saved` or `/api/user/liked-posts`**
   - Status: ✓ EXISTS as `/api/users/:id/liked-microblogs` but not at `/api/user/liked`

4. **DELETE `/api/posts/:id`** - Delete own post
   - Status: ✗ MISSING

5. **PATCH `/api/posts/:id`** - Edit own post
   - Status: ✗ MISSING

6. **DELETE `/api/microblogs/:id`** - Delete own microblog
   - Status: ✗ MISSING

7. **GET `/api/user/notifications`** - Get notifications
   - Status: ✓ EXISTS as `/api/notifications` (public path)

8. **DELETE `/api/user/blocks/:userId`** - Unblock user
   - Status: ✗ MISSING (can block, can't unblock!)

---

## 8. ENDPOINTS WITH MISSING RATE LIMITING

**Should be protected but aren't:**

- POST `/api/posts` - No limit (create spam)
- POST `/api/comments` - No limit
- POST `/api/microblogs` - No limit
- POST `/api/moderation/report` - No limit (spam reports)
- POST `/api/dms/send` - No limit (spam DMs)
- POST `/api/communities/:idOrSlug/join` - No limit (join spam)
- POST `/api/events` - No limit
- GET `/api/search/*` - No limit

---

## 9. ENDPOINTS WITHOUT PROPER VALIDATION

### Validation Gaps:

1. **POST `/api/posts`** - No max length check on frontend input
   - Backend: `content.length > 500` - GOOD
   - But truncated to 60 for title - SILENT TRUNCATION

2. **POST `/api/events`**
   - No timezone validation
   - No location validation
   - No attendee limit

3. **POST `/api/communities/:idOrSlug/invite`**
   - No email format validation
   - No max invitations per day

4. **POST `/api/microblogs/:id/like`**
   - No check for double-like (should be idempotent or reject)

5. **PATCH `/api/events/:id/rsvp`**
   - No validation that event exists before updating
   - No validation that status is valid enum

---

## 10. SUMMARY TABLE

### Critical Issues (Fix First)

| Issue | File | Severity | Impact |
|-------|------|----------|--------|
| DM send returns `.send()` not `.json()` | dmRoutes.ts:34 | High | Client parsing fails |
| Socket errors not sent to client | routes.ts:175-228 | High | Silent failures |
| `/api/user/communities` returns all, not user's | api/user.ts:108 | High | Shows unauthorized data |
| `/api/user/posts` returns all, not user's | api/user.ts:141 | High | Shows unauthorized data |
| `/api/user/events` returns all, not user's | api/user.ts:158 | High | Shows unauthorized data |
| No unblock endpoint | safety.ts, moderation.ts | High | UX broken |
| Session userId string/number inconsistency | auth.ts:167 | High | Type errors, security |
| RSVP missing user validation | routes.ts:1197 | Medium | Authorization bypass |
| No rate limiting on reporting | moderation.ts | Medium | Spam vulnerability |
| Admin check from session not DB | routes.ts:1222 | Medium | Spoofable |

### Moderate Issues (Schedule Soon)

- Duplicate moderation endpoints (report, block)
- Inconsistent authentication middleware imports
- Missing DELETE endpoints for user content
- Upvote methods missing userId parameter
- Inconsistent validation patterns
- No rate limiting on 10+ endpoints

### Low Priority

- Undocumented email failure behavior
- Metrics object not reset in push tokens
- Silent truncation of post titles
- Comment upvote tracking unclear

---

## RECOMMENDATIONS

1. **Immediate (Today)**
   - Fix DM error response format
   - Fix Socket.IO error handling
   - Fix `/api/user/*` endpoints to filter by user
   - Add unblock endpoint

2. **Short Term (This Week)**
   - Consolidate authentication middleware
   - Standardize user ID retrieval pattern
   - Apply rate limiting to sensitive endpoints
   - Remove duplicate moderation endpoints

3. **Medium Term (This Sprint)**
   - Add DELETE endpoints for user content
   - Fix upvote methods to track userId
   - Standardize validation approach
   - Test all authentication middleware paths

4. **Technical Debt**
   - Migrate session userId to always be number
   - Create centralized error response handler
   - Document all endpoint requirements
   - Add integration tests for auth flows
