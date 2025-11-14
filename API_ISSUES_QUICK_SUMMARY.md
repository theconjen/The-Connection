# API Issues - Quick Summary

## Critical Bugs (Fix Today)

### 1. DM Error Response Format
**File:** `server/routes/dmRoutes.ts:34`
**Problem:** Uses `.send()` instead of `.json()` - breaks JSON parsing
**Fix:** Change to `.json({ message: "..." })`

### 2. Socket.IO Silent Failures  
**File:** `server/routes.ts:175-228`
**Problem:** Socket errors aren't sent to client
**Fix:** Add `socket.emit('error', message)` in catch blocks

### 3. User Endpoints Return All Data
**File:** `server/routes/api/user.ts:108, 141, 158`
**Problem:** `/api/user/communities`, `/api/user/posts`, `/api/user/events` return ALL data not filtered by user
**Fix:** Add `.filter(x => x.userId === authenticatedUserId)`

### 4. No Unblock Endpoint
**File:** `server/routes/safety.ts` & `server/routes/moderation.ts`
**Problem:** Can block user but can't unblock
**Fix:** Add `DELETE /api/blocks/:userId` endpoint

### 5. Session userId Type Inconsistency
**File:** `server/auth.ts:167` and `server/routes.ts` throughout
**Problem:** Session stores userId as STRING but code expects NUMBER
**Fix:** Standardize to always parseInt in auth.ts before storing

## High Priority Issues (This Week)

### 6. Missing Rate Limiting
Missing on: `/api/posts`, `/api/comments`, `/api/dms/send`, `/api/moderation/report`
**Risk:** Spam/DOS attacks

### 7. Authorization Bypasses
- RSVP endpoint doesn't verify user owns RSVP (`routes.ts:1197`)
- Event delete checks session not DB (`routes.ts:1222`)
- Upvote methods don't track which user voted (`posts.ts:73, 107`)

### 8. Duplicate Endpoints
- Report: `/api/moderation/report` vs `/api/reports`
- Block: `/api/moderation/block` vs `/api/blocks`
- Blocked users: `/api/moderation/blocked-users` vs `/api/blocked-users`

### 9. Inconsistent Auth Middleware
- 3 different auth middleware patterns used (router-level, route-level, inline)
- Imports from 2 different files (auth.ts, middleware/auth.ts)
- 5+ different userId retrieval patterns

## Medium Priority Issues (This Sprint)

### 10. Missing Endpoints
- `DELETE /api/posts/:id` - delete own post
- `PATCH /api/posts/:id` - edit own post  
- `DELETE /api/microblogs/:id` - delete own microblog
- `POST /api/microblogs/:id/comment` - comment on microblog
- `DELETE /api/blocks/:userId` - unblock user

### 11. Validation Inconsistencies
- Mix of manual validation and Zod schemas
- Silent truncation of post titles (first 60 chars)
- No negative limit check on `/api/chat-rooms/:roomId/messages?limit=...`

### 12. Error Handling Gaps
- `/api/apologetics` returns `[]` on error (should return 500)
- `/api/notifications/:id/read` always succeeds even if ID invalid
- Storage optional chaining can hide method not found

## Impact Summary

**Total Endpoints:** 120+

**Critical Issues:** 5 (authentication/data leaks)
**High Priority:** 4 (spam/security)
**Medium Priority:** 7 (completeness/UX)
**Low Priority:** 5+ (code quality)

## File Priority Order (Fix in this order)

1. `/workspaces/The-Connection/server/routes/dmRoutes.ts` - Fix error format
2. `/workspaces/The-Connection/server/routes.ts` - Fix socket errors, user endpoints, RSVP validation
3. `/workspaces/The-Connection/server/routes/safety.ts` - Add unblock endpoint
4. `/workspaces/The-Connection/server/routes/api/user.ts` - Fix all user/*  filters
5. `/workspaces/The-Connection/server/auth.ts` - Fix userId type consistency
6. `/workspaces/The-Connection/server/routes/posts.ts` - Add DELETE, PATCH endpoints
7. `/workspaces/The-Connection/server/routes/moderation.ts` - Consolidate endpoints, add rate limiting
8. All route files - Standardize auth middleware pattern

