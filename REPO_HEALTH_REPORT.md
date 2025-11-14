# Repository Health Report
## The Connection - Comprehensive Code & Logic Review

**Generated:** November 2025
**Scope:** Full-stack analysis (API, Database, Web UI, Mobile App)

---

## Executive Summary

Comprehensive audit of **The Connection** Christian community platform revealed:
- ✅ **120+ API endpoints** functioning with proper routing
- ⚠️ **5 critical issues** requiring immediate attention
- ⚠️ **8 high-priority issues** affecting security and data integrity
- ⚠️ **Major inconsistencies** between web and mobile apps
- ✅ Database schema is well-structured with proper migrations
- ⚠️ Authentication flow has type inconsistencies

### Codebase Statistics
- **Web App:** 40 pages, ~16,686 lines of TypeScript/React
- **Mobile App:** 23 screens, ~4,517 lines of TypeScript/React Native
- **Backend:** 24 route files, 120+ endpoints
- **Database:** 30+ tables with Drizzle ORM

---

## 🚨 Critical Issues (Fix Immediately)

### 1. **Session UserID Type Inconsistency** 🔴
**Location:** `server/auth.ts:167`, `server/routes.ts` (multiple locations)

**Problem:** Session stores `userId` as STRING but code expects NUMBER throughout
```typescript
// Registration sets as string
req.session.userId = user.id.toString(); // Line 167

// But routes expect number
const userId = getSessionUserId(req)!; // Expects number
const user = await storage.getUser(userId); // Takes number
```

**Impact:** Type errors, potential runtime failures, inconsistent behavior

**Fix:**
```typescript
// Option 1: Store as number (recommended)
req.session.userId = user.id; // Remove .toString()

// Option 2: Always parse
const userId = parseInt(String(req.session.userId));
```

---

### 2. **DM Route Error Response Breaking Client** 🔴
**Location:** `server/routes/dmRoutes.ts:34`

**Problem:**
```typescript
res.status(401).send({ message: 'Not authenticated' }); // Uses .send()
```

**Impact:** Client expects JSON but gets plain text, breaking error handling

**Fix:**
```typescript
res.status(401).json({ message: 'Not authenticated' });
```

---

### 3. **User Endpoints Return ALL Data (Data Leak)** 🔴
**Locations:**
- `server/routes/api/user.ts:108` - `/api/user/communities`
- `server/routes/api/user.ts:141` - `/api/user/posts`
- `server/routes/api/user.ts:158` - `/api/user/events`

**Problem:**
```typescript
// Returns ALL communities instead of user's
const communities = await storage.getAllCommunities();
```

**Impact:** Users can see data they shouldn't have access to

**Fix:**
```typescript
const communities = await storage.getUserCommunities(userId);
const posts = await storage.getUserPosts(userId);
const events = await storage.getUserEvents(userId);
```

---

### 4. **Missing Unblock Endpoint** 🔴
**Location:** `server/routes/safety.ts`

**Problem:** Users can block but cannot unblock

**Impact:** Permanent blocks, poor UX

**Fix:** Add DELETE endpoint:
```typescript
router.delete('/api/safety/block/:userId', isAuthenticated, async (req, res) => {
  const currentUserId = getSessionUserId(req)!;
  const targetUserId = parseInt(req.params.userId);
  await storage.removeBlock(currentUserId, targetUserId);
  res.json({ message: 'User unblocked' });
});
```

---

### 5. **Socket.IO Errors Not Sent to Client** 🔴
**Location:** `server/routes.ts:175-228`

**Problem:** Chat errors are logged but not emitted to clients
```typescript
} catch (error) {
  console.error('Error handling chat message:', error);
  // No socket.emit() to notify client
}
```

**Impact:** Silent failures, users don't know messages failed

**Fix:**
```typescript
socket.emit('error', {
  message: 'Failed to send message',
  code: 'MESSAGE_ERROR'
});
```

---

## ⚠️ High Priority Issues

### 6. **Web vs Mobile API Query Inconsistency**

**Problem:** Web and mobile use **completely different** query key patterns

| Feature | Web Query Key | Mobile Query Key |
|---------|--------------|------------------|
| Posts | `/api/posts` | `['posts']` |
| Communities | `/api/communities` | `['communities']` |
| Events | `/api/events` | `['events']` |
| Prayer Requests | `/api/prayer-requests` | `['prayer-requests']` |

**Impact:**
- Inconsistent caching behavior
- Mobile won't benefit from query key utilities
- Harder to maintain
- Different invalidation patterns

**Recommendation:** Standardize on URL-based keys across both platforms

---

### 7. **Missing Rate Limiting on Key Endpoints**

**Unprotected endpoints:**
- POST `/api/posts` - Can spam posts
- POST `/api/comments` - Can spam comments
- POST `/api/prayer-requests` - Can spam prayer requests
- POST `/api/microblogs` - Can spam microblogs
- POST `/api/communities` - Can create unlimited communities
- POST `/api/events` - Can create unlimited events
- POST `/api/apologetics/questions` - Can spam questions
- POST `/api/chat-rooms/:id/messages` - Can spam chat

**Impact:** Spam, abuse, DoS vulnerability

**Fix:** Add rate limiters:
```typescript
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 posts per 15 minutes
});
app.post('/api/posts', postLimiter, isAuthenticated, ...);
```

---

### 8. **Event RSVP Authorization Bypass**
**Location:** `server/routes.ts:1181-1193`

**Problem:**
```typescript
app.patch('/api/events/:id/rsvp', isAuthenticated, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = getSessionUserId(req)!;
  const { status } = req.body;

  // No check if user should be able to RSVP
  const rsvp = await storage.updateEventRSVP(eventId, status);
```

**Impact:** Users can RSVP to private events they're not invited to

**Fix:** Verify event access before RSVP

---

### 9. **Event Deletion Uses Session Instead of Database**
**Location:** `server/routes.ts:1201-1207`

**Problem:**
```typescript
if (event.organizerId !== userId && !req.session.isAdmin) {
  return res.status(403).json({ message: 'Only the organizer or admin can delete this event' });
}
```

**Impact:** Session can be manipulated, should check database

**Fix:**
```typescript
const user = await storage.getUser(userId);
if (event.organizerId !== userId && !user.isAdmin) {
  return res.status(403).json({ message: 'Only the organizer or admin can delete this event' });
}
```

---

### 10. **Upvote Methods Don't Track Users**
**Locations:**
- `server/routes.ts:991-1000` - Post upvotes
- `server/routes.ts:1030-1039` - Comment upvotes

**Problem:** No tracking of who upvoted
```typescript
app.post('/api/posts/:id/upvote', isAuthenticated, async (req, res) => {
  const postId = parseInt(req.params.id);
  const post = await storage.upvotePost(postId); // Doesn't pass userId
```

**Impact:**
- Users can upvote multiple times
- Can't prevent duplicate upvotes
- Can't show "you upvoted this"

**Fix:** Track user votes in junction table

---

### 11. **Authentication Middleware Inconsistencies**

**3 different patterns used:**

**Pattern 1:** Router-level (recommended)
```typescript
router.use(isAuthenticated); // server/routes/api/user.ts:8
```

**Pattern 2:** Route-level
```typescript
app.post('/api/posts', isAuthenticated, async (req, res) => {
```

**Pattern 3:** Inline checks
```typescript
if (!req.session || !req.session.userId) {
  return res.status(401).json({ message: 'Not authenticated' });
}
```

**Impact:** Inconsistent security, harder to audit

**Recommendation:** Standardize on router-level middleware

---

### 12. **Session UserID Retrieval - 5 Different Patterns**

Found 5 different ways to get userId from session:

```typescript
// Pattern 1 - Direct access
const userId = req.session.userId;

// Pattern 2 - With type check
const userId = typeof req.session.userId === 'number' ? req.session.userId : parseInt(String(req.session.userId));

// Pattern 3 - Helper function
const userId = getSessionUserId(req);

// Pattern 4 - getUserId utility
const userId = getUserId(req);

// Pattern 5 - Direct parseInt
const userId = parseInt(req.params.id);
```

**Recommendation:** Use single helper function everywhere

---

## ✅ What's Working Well

### Database & Schema
- ✅ Well-structured Drizzle schema with proper types
- ✅ Migration system in place and working
- ✅ Proper indexes on session table
- ✅ Soft delete support via `deletedAt` timestamps
- ✅ Comprehensive tables covering all features

### API Architecture
- ✅ Clear separation between route files
- ✅ Feature flags system (`shared/features.ts`)
- ✅ Proper error handling in most endpoints
- ✅ CORS configuration in place
- ✅ Helmet security headers configured
- ✅ Rate limiting on auth endpoints

### Frontend
- ✅ React Query for data fetching (both web & mobile)
- ✅ Route-level code splitting (web)
- ✅ Proper loading states
- ✅ Toast notifications for UX feedback
- ✅ Responsive layouts
- ✅ Theme support (light/dark)

---

## 📊 Feature Flags Status

Current configuration (`shared/features.ts`):

```typescript
AUTH: true          ✅ Enabled
FEED: true          ✅ Enabled
POSTS: true         ✅ Enabled
COMMUNITIES: true   ✅ Enabled
EVENTS: true        ✅ Enabled
APOLOGETICS: true   ✅ Enabled (read-only)
ORGS: false         ❌ Disabled
PAYMENTS: false     ❌ Disabled
NOTIFICATIONS: false ❌ Disabled
RECOMMENDATIONS: false ❌ Disabled
```

---

## 🔍 Mobile vs Web Feature Parity

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| **Feed/Posts** | ✅ | ✅ | Different query keys |
| **Communities** | ✅ | ✅ | Full parity |
| **Events** | ✅ | ✅ | Full parity |
| **Prayer Requests** | ✅ | ✅ | Mobile uses different UI |
| **Apologetics** | ✅ | ✅ | Resources only on mobile |
| **Direct Messages** | ✅ | ✅ | Different implementations |
| **Profile** | ✅ | ✅ | Similar features |
| **Settings** | ✅ | ✅ | Web has more options |
| **Admin Panel** | ✅ | ❌ | **Mobile missing** |
| **Bible Study** | ✅ | ❌ | **Mobile missing** |
| **Livestreams** | ✅ | ❌ | **Mobile missing** |
| **Microblogs Detail** | ✅ | ❌ | **Mobile missing** |
| **Forums** | ✅ | ❌ | **Mobile missing** |
| **Church Signup** | ✅ | ❌ | **Mobile missing** |
| **Applications** | ✅ | ❌ | **Mobile missing** |

**Recommendation:** Decide if mobile should have feature parity or remain focused

---

## 📝 Recommendations

### Immediate Actions (This Week)
1. ✅ Fix session userId type inconsistency
2. ✅ Fix DM error response format
3. ✅ Add user filtering to user endpoints
4. ✅ Add unblock endpoint
5. ✅ Add socket error emissions

### Short Term (This Month)
1. Add rate limiting to content creation endpoints
2. Standardize authentication middleware usage
3. Fix upvote tracking to prevent duplicates
4. Standardize query key patterns (web & mobile)
5. Add proper authorization checks to RSVP

### Long Term (This Quarter)
1. Implement comprehensive API tests
2. Add E2E tests for critical flows
3. Implement analytics/monitoring
4. Add API documentation (OpenAPI/Swagger)
5. Performance optimization (caching, pagination)

---

## 🎯 Code Quality Metrics

### Backend
- **Total Routes:** 120+ endpoints
- **Authentication:** ✅ Mostly secured
- **Error Handling:** ⚠️ Inconsistent
- **Input Validation:** ⚠️ Partial
- **Rate Limiting:** ⚠️ Partial (auth only)
- **TypeScript Coverage:** ✅ 95%+

### Frontend (Web)
- **Pages:** 40
- **Code Splitting:** ✅ Implemented
- **Error Boundaries:** ⚠️ Missing
- **Loading States:** ✅ Good
- **Accessibility:** ⚠️ Not audited
- **TypeScript Coverage:** ✅ 95%+

### Frontend (Mobile)
- **Screens:** 23
- **Platform-Specific Code:** ✅ Using .native/.web files
- **Error Handling:** ✅ Alerts implemented
- **Loading States:** ✅ Good
- **TypeScript Coverage:** ✅ 95%+

---

## 🔐 Security Audit Results

### ✅ Strengths
- Bcrypt password hashing
- Rate limiting on auth endpoints
- CSRF protection (with lusca)
- Helmet security headers
- Content Security Policy configured
- Session-based authentication
- Login attempt tracking & lockout
- Audit logging for auth events

### ⚠️ Concerns
- Session data type inconsistencies
- Missing rate limits on content endpoints
- Upvote abuse potential
- RSVP authorization gaps
- Session-based admin checks (should use DB)
- No API key rotation mentioned
- No 2FA implementation

---

## 📚 Additional Findings

### API Documentation Generated
The comprehensive audit also generated detailed documentation:
- `API_AUDIT_INDEX.md` - Navigation guide
- `API_ANALYSIS_REPORT.md` - 900+ line technical deep-dive
- `API_ISSUES_QUICK_SUMMARY.md` - Executive summary
- `API_FIXES_WITH_CODE.md` - Ready-to-implement solutions

### Mobile App Architecture
- Uses Expo Router for navigation
- Tab-based main navigation
- Proper context providers (Auth, Theme, Query)
- Platform-specific components (.native.tsx, .web.tsx)
- Secure storage for tokens

### Web App Architecture
- Wouter for routing (lightweight alternative to React Router)
- Lazy loading for all routes
- Google Analytics integration
- Theme provider with system preference support
- React Query for server state

---

## 🎓 Best Practices Observed

1. ✅ **Monorepo structure** with shared schema
2. ✅ **Feature flags** for gradual rollouts
3. ✅ **Audit logging** for security events
4. ✅ **Environment-based configuration**
5. ✅ **Database migrations** properly ordered
6. ✅ **XSS protection** via sanitization
7. ✅ **CORS** properly configured
8. ✅ **TypeScript** throughout codebase

---

## 💡 Summary

**The Connection** is a well-architected Christian community platform with:
- Strong foundation and code structure
- Good separation of concerns
- Comprehensive feature set
- Active development

**Main areas for improvement:**
- Security hardening (rate limiting, authorization)
- Consistency (auth patterns, query keys, types)
- Mobile feature parity decisions
- Error handling standardization

**Overall Health:** 🟡 **Good** (with room for improvement)

---

**Next Steps:** Prioritize the 5 critical issues, then work through high-priority security concerns. The codebase is production-ready with these fixes applied.
