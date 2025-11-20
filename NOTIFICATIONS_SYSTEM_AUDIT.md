# The Connection - Notifications System Audit Report

**Date**: 2025-11-20  
**Repository**: The-Connection  
**Current Branch**: claude/global-search-implementation-01JdER9nUX7gz3q3VCdFuMyo

---

## Executive Summary

The Connection has a **partial, partially-disabled notification system**. While the infrastructure exists (database tables, API endpoints, push service), the feature is currently **DISABLED** via feature flag (`NOTIFICATIONS: false`). Implementation is incomplete with push notifications commented out in active code paths.

---

## 1. Feature Flag Status

### Current Status: **DISABLED**

**Location**: `/packages/shared/src/features.ts`

```typescript
export const FEATURES = {
  AUTH: true,
  FEED: true,
  POSTS: true,
  COMMUNITIES: true,
  EVENTS: true,
  APOLOGETICS: true,
  ORGS: false,
  PAYMENTS: false,
  NOTIFICATIONS: false,        // ← DISABLED
  RECOMMENDATIONS: false,
};
```

**Impact**: 
- Feature flag is checked in `/server/routes.ts` line 374
- Routes are gated behind: `if (FEATURES.NOTIFICATIONS || FEATURES.COMMUNITIES || FEATURES.POSTS || FEATURES.FEED)`
- Notification feature is effectively enabled only when other features are on

---

## 2. Database Infrastructure

### Database Tables (Fully Defined)

#### **pushTokens Table**
Location: `/packages/shared/src/schema.ts` (lines 1372-1380)

```typescript
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
} as any);
```

**Purpose**: Stores Expo push notification tokens for mobile app users

**Columns**:
- `id`: Primary key
- `userId`: Foreign key to users table (cascades on delete)
- `token`: Unique Expo push token
- `platform`: Device platform (e.g., "expo", "ios", "android")
- `createdAt`: Token registration timestamp
- `lastUsed`: Last time token was used

---

#### **notifications Table**
Location: `/packages/shared/src/schema.ts` (lines 1382-1391)

```typescript
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  category: text("category").default('feed'),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
} as any);
```

**Purpose**: Stores in-app notifications for users

**Columns**:
- `id`: Primary key
- `userId`: Foreign key to users table (cascades on delete)
- `title`: Notification title
- `body`: Notification body/message
- `data`: JSONB field for custom metadata
- `category`: Type of notification (default: 'feed')
- `isRead`: Read status
- `createdAt`: Notification creation timestamp

**Indexes**: (from migration file)
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_user_id_is_read` on `(user_id, is_read)`

---

### User Notification Preferences
Location: `/packages/shared/src/schema.ts` (users table, lines 36-39)

```typescript
notifyDms: boolean("notify_dms").default(true),
notifyCommunities: boolean("notify_communities").default(true),
notifyForums: boolean("notify_forums").default(true),
notifyFeed: boolean("notify_feed").default(true),
```

**Status**: ✅ **Defined but not enforced**

These columns exist in the users table but are **never checked** when sending notifications. The system doesn't respect these preferences.

---

## 3. API Endpoints

### Implemented Endpoints

#### **Push Token Management**
Implemented in `/server/routes/pushTokens.ts`

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/push/register` | POST | ✅ Required | Register device push token | ✅ Implemented |
| `/api/push/unregister` | POST | ✅ Required | Unregister push token | ✅ Implemented |
| `/api/push/unregister` | DELETE | ✅ Required | Unregister push token | ✅ Implemented |

**Implementation Details**:
- Tokens stored with userId and platform
- Duplicate tokens automatically updated (lastUsed timestamp updated)
- User can only delete their own tokens (ownership check)
- Metrics tracked: unregisterAttempts, unregisterSuccess, unregisterForbidden

---

#### **Notification Retrieval**
Implemented in `/server/routes.ts` (lines 1901-1925)

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/api/notifications` | GET | ✅ Required | Get user's notifications | ✅ Implemented |
| `/api/notifications/:id/read` | PUT | ✅ Required | Mark notification as read | ✅ Implemented |

**Implementation Details**:
- Returns all notifications for authenticated user
- Ordered by creation date (newest first)
- Supports per-notification read status updates
- Returns 404 if notification not found or doesn't belong to user

---

## 4. Service Layer

### Push Notification Service
Location: `/server/services/pushService.ts`

**Status**: ✅ **Fully implemented**

```typescript
export async function sendPushNotifications(
  notifications: PushNotificationPayload[]
): Promise<ExpoPushTicket[]>

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: any
): Promise<ExpoPushTicket[]>
```

**Features**:
- Uses Expo SDK (version 4.0.0)
- Validates tokens with `Expo.isExpoPushToken()`
- Batches notifications for efficiency
- Handles errors gracefully
- Tracks tickets from Expo service

**Limitations**:
- Currently commented out in the only place it would be used (dmRoutes.ts)
- No actual invocations in production code paths

---

## 5. Current Implementation Status

### What's Implemented ✅

1. **Database Schema**: Complete tables for push tokens and notifications
2. **API Endpoints**: 
   - Push token registration/unregistration
   - Notification retrieval
   - Read status marking
3. **Push Service**: Full Expo SDK integration
4. **User Preferences**: Database columns for notification preferences
5. **Tests**: Unit and integration tests for push notifications
6. **Email Notifications**: Separate email system for applications
7. **Test Utilities**: Test endpoints and helpers

---

### What's Missing ❌

1. **Feature Flag Not Implemented**: `NOTIFICATIONS: false` - feature completely disabled

2. **No Notification Creation**:
   - No endpoints to create notifications
   - No notification triggers in business logic
   - No scheduled notification system

3. **Push Notification Disabled**:
   - Commented out in `/server/routes/dmRoutes.ts` (lines 62-86)
   - Would have sent DM notifications to receivers
   - Code comment: "TODO: Retrieve the receiver's push token from storage"

4. **Notification Preferences Not Enforced**:
   - User preferences (notifyDms, notifyCommunities, etc.) exist but are never checked
   - No logic respects these settings

5. **No Real-time Notifications**:
   - No Socket.IO integration for live notifications
   - No WebSocket push to clients

6. **No Client-Side Components**:
   - No notification bell/badge UI
   - No notification panel/list UI
   - Settings page has `pushNotifications` preference in state but never saved
   - No notification settings UI (though mentions in settings page)

7. **No Notification Triggers**:
   - No notifications on:
     - New community invitations
     - Event RSVPs/updates
     - Prayer request responses
     - Post comments/mentions
     - Feed updates
     - Admin actions

8. **No Delivery Tracking**:
   - No receipt/delivery status tracking
   - No failed notification retry logic
   - No notification expiration/cleanup

---

## 6. Push Notification Setup Status

### Dependencies
✅ **Installed**: `expo-server-sdk` v4.0.0

**Location**: `/package.json`

### Expo Integration
✅ **Configured**: Expo SDK initialized

**File**: `/server/services/pushService.ts`
```typescript
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
const expo = new Expo();
```

### Status
- ✅ SDK imported and ready
- ✅ Token validation implemented
- ✅ Batch sending implemented
- ❌ **Never called from active code**
- ❌ **Commented out in DM route** (only place it would naturally trigger)

---

## 7. Email Notifications

### Implemented Email System
Location: `/server/email-notifications.ts`

**Current Email Notifications**:
1. **Livestreamer Application Notification**
   - Notifies admins of new applications
   - Includes applicant details and review link

2. **Apologist Scholar Application Notification**
   - Notifies admins of new applications
   - Similar structure to livestreamer notifications

3. **Application Status Update**
   - Notifies applicants of application status changes
   - Includes review notes and platform link

**Status**: ✅ **Functional for application management only**

---

## 8. Storage Layer

### Methods Implemented
Location: `/server/storage.ts`

**Push Token Methods**:
```typescript
async savePushToken(token: PushToken): Promise<PushToken>
async getUserPushTokens(userId: number): Promise<PushToken[]>
async deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'>
```

**Notification Methods**:
```typescript
async getUserNotifications(userId: number): Promise<Notification[]>
async markNotificationAsRead(id: number, userId: number): Promise<boolean>
```

**Status**: ✅ **Fully implemented with database backend**

---

## 9. Testing

### Test Files

#### Unit Tests
Location: `/tests/unit/db.push_notifications.spec.ts`

Tests:
- ✅ Save, retrieve, and delete push tokens
- ✅ Create, read, and mark notifications as read
- ✅ Enforces user isolation (users can't access others' tokens/notifications)

Status: **Requires DATABASE_URL to run**

---

#### Integration Tests
Location: `/tests/integration/push_notifications.spec.ts`

Tests:
- ✅ User registration
- ✅ Push token registration
- ✅ Notification retrieval
- ✅ Mark notification as read
- ✅ Push token unregistration

Status: **Uses in-memory mock, fully functional**

---

## 10. Mobile App Integration

Location: `/mobile-app/TheConnectionMobile/app/settings.tsx`

**Current Status**: ⚠️ **Minimal to none**

- No push notification registration
- No notification handlers
- No notification UI
- No Expo notifications integration found

---

## 11. Recommendations

### Immediate Actions (To Enable Notifications)

1. **Enable Feature Flag**
   ```typescript
   // /packages/shared/src/features.ts
   NOTIFICATIONS: true,  // Enable
   ```

2. **Implement Notification Creation Endpoint**
   ```typescript
   POST /api/notifications
   Body: { userId, title, body, category, data }
   ```

3. **Uncomment Push Notification in DM Route**
   - File: `/server/routes/dmRoutes.ts` lines 62-86
   - Retrieve user's push tokens
   - Send notification with sender name and message preview

4. **Enforce User Preferences**
   - Check `notifyDms`, `notifyCommunities`, `notifyForums`, `notifyFeed`
   - Skip notifications if user opted out

---

### Short-term (Weeks 1-2)

1. **Build Notification Triggers**
   - DMs (implement the commented-out code)
   - Community invitations
   - Event updates
   - Post comments
   - Prayer request responses

2. **Create Client UI**
   - Notification bell with unread count
   - Notification panel/dropdown
   - Notification settings in preferences

3. **Add Notification Settings**
   - Granular controls per notification type
   - Sound preferences
   - Quiet hours
   - Notification frequency

---

### Medium-term (Weeks 3-4)

1. **Real-time Notifications**
   - Socket.IO integration
   - Live notification delivery
   - Broadcast to all user devices

2. **Delivery Tracking**
   - Track sent, delivered, failed
   - Retry failed notifications
   - Cleanup old notifications

3. **Mobile Integration**
   - Expo notification handling
   - Deep linking from notifications
   - Sound and badge configuration

---

### Long-term (Month 2+)

1. **Advanced Features**
   - Notification digest/summary emails
   - Smart notification bundling
   - Notification preferences per community
   - Do not disturb schedules

2. **Analytics**
   - Notification delivery rates
   - User engagement tracking
   - A/B testing support

3. **Admin Dashboard**
   - Send system notifications
   - Monitor notification delivery
   - Notification logs and audit trail

---

## 12. Code Location Reference

| Component | File Path | Status |
|-----------|-----------|--------|
| Feature Flag | `/packages/shared/src/features.ts` | DISABLED |
| Database Schema | `/packages/shared/src/schema.ts` | ✅ Complete |
| API Routes | `/server/routes.ts` | ✅ Implemented |
| Push Token Routes | `/server/routes/pushTokens.ts` | ✅ Implemented |
| DM Routes | `/server/routes/dmRoutes.ts` | ⚠️ Commented out |
| Push Service | `/server/services/pushService.ts` | ✅ Complete |
| Storage Layer | `/server/storage.ts` | ✅ Complete |
| Email Notifications | `/server/email-notifications.ts` | ✅ App-specific only |
| Migrations | `/server/migrations/add-notifications.ts` | ✅ Complete |
| Unit Tests | `/tests/unit/db.push_notifications.spec.ts` | ✅ Complete |
| Integration Tests | `/tests/integration/push_notifications.spec.ts` | ✅ Complete |
| Settings Page | `/client/src/pages/settings-page.tsx` | ⚠️ UI incomplete |
| Mobile App | `/mobile-app/TheConnectionMobile/app/settings.tsx` | ❌ No integration |

---

## 13. Summary

The Connection has **solid infrastructure** for notifications but it's currently **disabled and incomplete**:

- ✅ Database schema fully designed
- ✅ Push service (Expo SDK) fully integrated
- ✅ API endpoints for token/notification management
- ✅ Storage layer implemented
- ✅ Tests written

But:
- ❌ Feature flag is OFF
- ❌ No notification triggers in business logic
- ❌ Push notifications are commented out
- ❌ User preferences not enforced
- ❌ No client UI
- ❌ No real-time delivery

**To fully enable**: Need to flip feature flag, implement notification triggers, build UI, and uncomment push code.

