# Reporting & Blocking API Status Report

**Date**: 2026-01-14
**Status**: ✅ **FULLY IMPLEMENTED**

---

## 🎯 Summary

All reporting and blocking features are **fully implemented** in the backend API. The system includes comprehensive endpoints for:
- Content reporting (posts, users, communities, events, microblogs)
- User blocking/unblocking
- Admin moderation dashboard
- Automatic suspension after 10 reports

---

## 📋 API Endpoints Available

### User-Facing Safety Endpoints (`/api`)

#### Report Content
```
POST /api/reports
```
**Rate Limited**: 10 reports per 15 minutes
**Auth Required**: Yes
**Supports**: posts, communities, events, microblogs
**Reasons**: spam, harassment, inappropriate, hate_speech, false_info, other

**Example Request**:
```json
{
  "subjectType": "microblog",
  "subjectId": 123,
  "reason": "spam",
  "description": "User is posting promotional content repeatedly"
}
```

---

#### Report User
```
POST /api/user-reports
```
**Rate Limited**: 10 reports per 15 minutes
**Auth Required**: Yes
**Auto-Suspend**: User automatically suspended at 10 reports

**Example Request**:
```json
{
  "userId": 456,
  "reason": "harassment",
  "description": "User is sending abusive messages"
}
```

---

#### Block User
```
POST /api/blocks
```
**Auth Required**: Yes
**Effect**: Blocked users' content is filtered from your feed, communities, events

**Example Request**:
```json
{
  "userId": 789,
  "reason": "I don't want to see their content"
}
```

---

#### Unblock User
```
DELETE /api/blocks/:userId
DELETE /api/safety/block/:userId  (legacy alias)
```
**Auth Required**: Yes

**Example**: `DELETE /api/blocks/789`

---

#### Get Blocked Users List
```
GET /api/blocked-users
```
**Auth Required**: Yes
**Returns**: Array of blocked user objects with profile info

**Example Response**:
```json
[
  {
    "blockedUser": {
      "id": 789,
      "username": "blockeduser",
      "displayName": "Blocked User",
      "avatarUrl": "..."
    },
    "createdAt": "2025-01-14T10:30:00Z"
  }
]
```

---

### Admin Moderation Endpoints (`/api/admin`)

#### Get All Content Reports
```
GET /api/admin/reports?status=pending&limit=50
```
**Auth Required**: Admin only
**Query Params**:
- `status`: pending | resolved | dismissed
- `limit`: max 1000, default 50

---

#### Get Single Report
```
GET /api/admin/reports/:id
```
**Auth Required**: Admin only

---

#### Update Report Status
```
PATCH /api/admin/reports/:id
```
**Auth Required**: Admin only

**Example Request**:
```json
{
  "status": "resolved",
  "notes": "Warned user and removed content"
}
```

---

#### Get User Reports
```
GET /api/admin/user-reports/:userId
```
**Auth Required**: Admin only
**Returns**: All reports filed against a specific user

---

#### Get Suspended Users
```
GET /api/admin/suspended-users
```
**Auth Required**: Admin only
**Returns**: List of all suspended users

---

#### Unsuspend User
```
POST /api/admin/users/:userId/unsuspend
```
**Auth Required**: Admin only
**Removes**: Suspension from user account

---

#### Delete User (Nuclear Option)
```
DELETE /api/admin/users/:id
```
**Auth Required**: Admin only
**Warning**: Permanently deletes user and all their data
**Safety**: Cannot delete your own admin account

---

## 🗄️ Database Tables

All required tables exist in the schema:

### `content_reports`
- Stores reports for posts, comments, microblogs, events, prayer requests
- Fields: reporter_id, content_type, content_id, reason, description, status, moderator_id, moderator_notes
- Statuses: pending, reviewing, resolved, dismissed

### `user_reports`
- Stores reports against users
- Auto-suspension at 10 reports
- Fields: reporter_id, reported_user_id, reason, status

### `user_blocks`
- Stores user blocking relationships
- Enforced throughout the app (feed, communities, events)
- Fields: blocker_id, blocked_id, reason

### `moderation_actions`
- Audit log of all moderator actions
- Tracks who did what and when

---

## 🔧 Migrations Status

### ✅ Already Applied (via TypeScript migrations)
These are tracked and auto-applied on server start:
- Feed features (downvotes, reposts, bookmarks)
- Community features (wall likes, comments)
- Message read status
- Deleted columns for soft-deletes

### 📋 Pending SQL Migrations (Need Manual Run)

There are **4 untracked SQL migration files** that should be applied:

1. **`COMPLETE_MIGRATION_BUNDLE.sql`** - Comprehensive bundle (RECOMMENDED)
   - Includes: Wall posts fix, prayer requests community_id, vote tables, feed features
   - Safe to run multiple times (uses IF NOT EXISTS)

2. **`create_vote_tables.sql`** - Basic vote tracking
   - Covered by COMPLETE_MIGRATION_BUNDLE.sql

3. **`apply_feed_features.sql`** - Downvotes, reposts, bookmarks
   - Covered by COMPLETE_MIGRATION_BUNDLE.sql

4. **`add-community-id-to-prayer-requests.sql`** - Prayer requests in communities
   - Covered by COMPLETE_MIGRATION_BUNDLE.sql

### 🚀 How to Run Migrations

**Option 1: Neon SQL Editor (Recommended)**
```bash
# Open this file in Neon SQL Editor and run it:
/Users/rawaselou/Desktop/The-Connection-main/migrations/COMPLETE_MIGRATION_BUNDLE.sql
```

**Option 2: TypeScript Migration Runner**
```bash
cd /Users/rawaselou/Desktop/The-Connection-main
node server/run-migrations.ts
```

**Option 3: Individual SQL Files**
```bash
# If you prefer to run them separately:
psql $DATABASE_URL -f migrations/create_vote_tables.sql
psql $DATABASE_URL -f migrations/apply_feed_features.sql
psql $DATABASE_URL -f migrations/add-community-id-to-prayer-requests.sql
```

---

## 🛡️ Content Filtering

**Blocked users are automatically filtered from**:
- Feed (microblogs)
- Communities list
- Posts/Forums
- Events
- Community members
- Search results

This is enforced in `server/routes.ts` at:
- Line 586-588: Communities filtering
- Line 1180-1182: Posts filtering
- Line 1319-1321: Events filtering

---

## 🔐 Security Features

### Rate Limiting
- Reports: 10 per 15 minutes per IP
- Blocks: Unlimited (user action)

### Auto-Moderation
- **10 user reports** → Automatic suspension
- **Spam detection**: AI moderation ready (hooks exist)
- **Report count tracking**: Visible in admin dashboard

### Audit Trail
All moderation actions are logged to:
- `moderation_actions` table
- `audit_logs` table (for security events)

---

## 📱 Mobile App Integration

The mobile app needs to integrate these endpoints. Current status:

### ✅ Implemented in Mobile
- Block user modal (`src/components/UserActionsMenu.tsx`)
- Report user modal (`src/components/ReportUserModal.tsx`)
- Blocked users screen (`src/screens/BlockedUsersScreen.tsx`)

### API Client Setup
Located in: `/Users/rawaselou/Desktop/TheConnectionMobile-standalone/src/lib/apiClient.ts`

**Add these methods**:
```typescript
// Safety API
export const safetyAPI = {
  // Report content
  reportContent: (data: {
    subjectType: 'post' | 'microblog' | 'community' | 'event';
    subjectId: number;
    reason: string;
    description?: string;
  }) => apiClient.post('/api/reports', data).then(res => res.data),

  // Report user
  reportUser: (data: {
    userId: number;
    reason: string;
    description?: string;
  }) => apiClient.post('/api/user-reports', data).then(res => res.data),

  // Block user
  blockUser: (data: {
    userId: number;
    reason?: string;
  }) => apiClient.post('/api/blocks', data).then(res => res.data),

  // Unblock user
  unblockUser: (userId: number) =>
    apiClient.delete(`/api/blocks/${userId}`).then(res => res.data),

  // Get blocked users
  getBlockedUsers: () =>
    apiClient.get('/api/blocked-users').then(res => res.data),
};
```

---

## ✅ Verification Checklist

- [x] Content reporting API (`/api/reports`)
- [x] User reporting API (`/api/user-reports`)
- [x] Block user API (`/api/blocks`)
- [x] Unblock user API (`/api/blocks/:userId`)
- [x] Get blocked users API (`/api/blocked-users`)
- [x] Admin reports dashboard (`/api/admin/reports`)
- [x] Admin user reports (`/api/admin/user-reports/:userId`)
- [x] Admin suspend/unsuspend (`/api/admin/users/:id/unsuspend`)
- [x] Admin delete user (`/api/admin/users/:id`)
- [x] Rate limiting on report endpoints
- [x] Auto-suspension at 10 reports
- [x] Content filtering for blocked users
- [x] Database tables created
- [ ] Run pending SQL migrations (see above)

---

## 🎬 Next Steps

### 1. Run Migrations (5 minutes)
```bash
# Open Neon SQL Editor and paste this file:
/Users/rawaselou/Desktop/The-Connection-main/migrations/COMPLETE_MIGRATION_BUNDLE.sql
```

### 2. Test Endpoints (Optional)
```bash
# Test report content
curl -X POST https://api.theconnection.app/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectType": "microblog",
    "subjectId": 123,
    "reason": "spam",
    "description": "Test report"
  }'

# Test block user
curl -X POST https://api.theconnection.app/api/blocks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 456}'

# Test get blocked users
curl https://api.theconnection.app/api/blocked-users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Mobile App Integration
- Add `safetyAPI` methods to `apiClient.ts`
- Wire up existing modals to use the API
- Test blocking/unblocking flow
- Test reporting flow

---

## 📊 System Status

| Component | Status |
|-----------|--------|
| Backend API | ✅ Complete |
| Database Schema | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Rate Limiting | ✅ Active |
| Content Filtering | ✅ Active |
| Auto-Suspension | ✅ Active |
| SQL Migrations | ⚠️ Pending (see above) |
| Mobile Integration | 🔄 Partial |

---

**Generated**: 2026-01-14
**Backend Repo**: `/Users/rawaselou/Desktop/The-Connection-main`
**Mobile Repo**: `/Users/rawaselou/Desktop/TheConnectionMobile-standalone`
