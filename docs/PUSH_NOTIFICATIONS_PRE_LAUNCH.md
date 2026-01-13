# Push Notifications - Pre-Launch Checklist

**Date:** 2026-01-10
**Status:** Review Required

---

## ✅ What's Complete

### 1. Database Schema ✅
- [x] `notifications` table exists (schema.ts line 1471)
- [x] `push_tokens` table exists (schema.ts line 1462)
- [x] Migration files exist:
  - `0004_add_push_tokens_and_notify_columns.sql`
  - `0005_add_notifications_table.sql`
- [x] User notification preferences exist:
  - `notifyDms`, `notifyCommunities`, `notifyForums`, `notifyFeed`

### 2. Mobile App Setup ✅
- [x] Notification service created (`notificationService.ts`)
- [x] Permission requests implemented
- [x] Token registration with backend
- [x] Notification handlers (received, tapped)
- [x] Deep linking configured
- [x] Android notification channels (5 categories)
- [x] App configuration (`app.json` with expo-notifications)
- [x] Initialization in `_layout.tsx`
- [x] Notification center screen exists (`NotificationsScreen.tsx`)
- [x] Notification settings screen created (`NotificationSettingsScreen.tsx`)

### 3. Server Implementation ✅
- [x] Notification helper service (`notificationHelper.ts`)
- [x] Event reminder service (`eventReminderService.ts`)
- [x] Push service (`pushService.ts`)
- [x] Dual notification system (in-app + push)
- [x] User preference enforcement
- [x] Notification triggers:
  - [x] Community posts
  - [x] Events (create/update/reminder)
  - [x] Comments & replies
  - [x] Likes
  - [x] Direct messages (updated to dual system)

### 4. API Endpoints ✅
- [x] `POST /api/push-tokens` - Register token
- [x] `DELETE /api/push-tokens/:token` - Unregister token
- [x] `PUT /api/user` - Update notification preferences
- [x] `GET /api/notifications` - Get user notifications (via NotificationsScreen)

### 5. Documentation ✅
- [x] Complete implementation guide (`PUSH_NOTIFICATIONS_GUIDE.md`)
- [x] Testing checklist
- [x] Troubleshooting guide
- [x] API reference

---

## ⚠️ Critical Items to Complete Before Launch

### 1. **Test Notification Permissions** 🔴 REQUIRED
**Priority:** CRITICAL
**Why:** Without this, users can't receive notifications

**Action Items:**
- [ ] Install app on physical iOS device
- [ ] Verify permission prompt appears on first launch
- [ ] Test granting permissions
- [ ] Test denying permissions (app should still work)
- [ ] Verify instructions shown if permission denied
- [ ] Test on Android device (permission works differently)

**Testing Script:**
```bash
# 1. Fresh install app
# 2. Open app
# 3. Verify permission prompt shows
# 4. Grant permission
# 5. Check logs for: "[Notifications] Permissions granted"
# 6. Check logs for: "[Notifications] Token registered with backend"
```

---

### 2. **Verify Database Migrations Ran** 🔴 REQUIRED
**Priority:** CRITICAL
**Why:** Without tables, notifications will fail

**Action Items:**
- [ ] Connect to production database
- [ ] Verify tables exist:
```sql
-- Check notifications table
\d notifications;

-- Check push_tokens table
\d push_tokens;

-- Check user preferences columns
\d users;
-- Should see: notify_dms, notify_communities, notify_forums, notify_feed
```

- [ ] If tables don't exist, run migrations:
```bash
node server/run-migrations.ts
```

---

### 3. **Test End-to-End Notification Flow** 🔴 REQUIRED
**Priority:** CRITICAL
**Why:** Verify everything works together

**Test Cases:**
- [ ] **Community Post**
  1. User A creates post in community
  2. User B (member) should receive notification
  3. Tap notification → Opens post detail
  4. Check in-app notification center → Notification visible

- [ ] **Event Created**
  1. Admin creates event in community
  2. All members receive notification
  3. Tap notification → Opens event detail

- [ ] **Event Reminder**
  1. Create event 24 hours in future
  2. RSVP as "going"
  3. Wait for hourly check (or trigger manually)
  4. Receive reminder notification

- [ ] **Comment on Post**
  1. User A creates post
  2. User B comments
  3. User A receives notification
  4. Tap notification → Opens post with comments

- [ ] **Like Post**
  1. User A creates post
  2. User B likes it
  3. User A receives notification

- [ ] **Direct Message**
  1. User A sends DM to User B
  2. User B receives notification
  3. Tap notification → Opens DM conversation
  4. Check in-app notification center → DM notification visible

**Manual Trigger (for testing):**
```typescript
// In server console or test script
import { checkAndSendEventReminders } from './services/eventReminderService';
await checkAndSendEventReminders();
```

---

### 4. **Test User Preferences** 🟡 HIGH PRIORITY
**Priority:** HIGH
**Why:** Users should be able to control notifications

**Action Items:**
- [ ] Link notification settings screen in mobile app menu
- [ ] Test disabling each preference:
  - Disable "Communities" → No community/event push (but in-app still created)
  - Disable "Forums" → No comment/reply push (but in-app still created)
  - Disable "Feed" → No like push (but in-app still created)
  - Disable "DMs" → No DM push (but in-app still created)
- [ ] Verify changes persist after app restart
- [ ] Verify server respects preferences (check logs)

**Add to Settings Menu:**
```typescript
// In mobile app settings/menu screen
<TouchableOpacity onPress={() => router.push('/notification-settings')}>
  <Text>Notification Settings</Text>
</TouchableOpacity>
```

---

### 5. **Monitor Event Reminder Scheduler** 🟡 HIGH PRIORITY
**Priority:** HIGH
**Why:** Ensure reminders are actually being sent

**Action Items:**
- [ ] Check server logs after deployment:
```bash
# Should see every hour:
[EventReminders] Starting event reminder scheduler (checks every hour)
[EventReminders] Checking for events requiring reminders...
[EventReminders] Found X event(s) requiring reminders
```

- [ ] Create test event 24h in future
- [ ] Wait 1-2 hours for check
- [ ] Verify reminder sent (check logs + user receives notification)

- [ ] If reminders not working:
```typescript
// Check scheduler is running
// In server/index.ts around line 277
startEventReminderScheduler();
```

---

## 🟢 Nice to Have (Not Critical for Launch)

### 1. **Notification Batching** 🟢 OPTIONAL
**Priority:** LOW
**Why:** Prevents spam in high-traffic communities

**Current:** Each like/comment sends separate notification
**Future:** Group similar notifications
  - "3 people liked your post"
  - "5 new posts in Community Name"

**Action:** Add to backlog for v1.1

---

### 2. **Badge Count Management** 🟢 OPTIONAL
**Priority:** LOW
**Why:** Visual indicator of unread notifications

**Current:** Badge count may not update
**Future:**
- Update badge when notification received
- Clear badge when app opened
- Sync badge with unread count

**Action:** Add to backlog for v1.1

---

### 3. **Rich Notifications** 🟢 OPTIONAL
**Priority:** LOW
**Why:** Better user experience

**Future:**
- Include images in notifications
- Action buttons ("Like", "Reply")
- Notification previews with avatars

**Action:** Add to backlog for v1.2

---

## 📋 Launch Day Checklist

### Before Deploy
- [ ] All critical tests passing (see above)
- [ ] Database migrations verified in production
- [ ] Server logs show scheduler starting
- [ ] Mobile app built with EAS (iOS + Android)

### After Deploy
- [ ] Monitor server logs for first hour:
  - `[Notifications]` entries
  - `[EventReminders]` entries
  - No errors

- [ ] Test with real users (beta testers):
  - Create community post → Verify notifications sent
  - Create event → Verify notifications sent
  - Comment on post → Verify notifications sent

- [ ] Monitor database:
```sql
-- Check notifications are being created
SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check push tokens being registered
SELECT COUNT(*) FROM push_tokens;

-- Check for errors (no notifications for 1+ hour)
SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '1 hour';
-- Should be > 0 if app is being used
```

### First 24 Hours
- [ ] Check notification delivery rate
- [ ] Monitor for user complaints about spam
- [ ] Verify reminders sent for upcoming events
- [ ] Check for any error spikes in Sentry/logs

---

## 🚨 Rollback Plan

If critical issues occur:

### Disable Push Notifications (Keep In-App)
```typescript
// In notificationHelper.ts
export async function notifyUserWithPreferences(...) {
  // Create in-app notification (this always works)
  await storage.createNotification(...);

  // TEMPORARILY DISABLE PUSH
  return; // <-- Add this line to disable push only

  // ... rest of push logic
}
```

### Disable Event Reminders
```typescript
// In server/index.ts
// Comment out this line:
// startEventReminderScheduler();
```

### Emergency Disable All Notifications
```sql
-- Temporarily disable all user notifications
UPDATE users SET
  notify_dms = false,
  notify_communities = false,
  notify_forums = false,
  notify_feed = false;
```

Then fix issue and re-enable.

---

## 📞 Support Plan

### User Reports "Not Receiving Notifications"

**Checklist to Send User:**
1. Have you granted notification permissions?
   - iOS: Settings → The Connection → Notifications → Allow
   - Android: Settings → Apps → The Connection → Notifications → On

2. Are your notification preferences enabled?
   - Open app → Settings → Notification Settings
   - Ensure relevant categories are enabled

3. Are you logged in?
   - Notifications only work when logged in

4. Try these steps:
   - Logout and login again (re-registers token)
   - Close and reopen app
   - Reinstall app (last resort)

**For Developers:**
```sql
-- Check user's tokens
SELECT * FROM push_tokens WHERE user_id = <USER_ID>;

-- Check user's preferences
SELECT notify_dms, notify_communities, notify_forums, notify_feed
FROM users WHERE id = <USER_ID>;

-- Check in-app notifications (should always exist)
SELECT * FROM notifications
WHERE user_id = <USER_ID>
ORDER BY created_at DESC LIMIT 20;
```

---

## ✅ Final Pre-Launch Summary

**CRITICAL (Must Complete):**
1. Test permission flow on real devices (iOS + Android)
2. Verify database migrations ran
3. Test end-to-end notification flow (all 6 test cases)

**HIGH PRIORITY (Should Complete):**
4. Test user preferences
5. Monitor event reminders

**OPTIONAL (Can Wait for v1.1):**
- Notification batching
- Badge count management
- Rich notifications

**Estimated Time to Complete Critical Items:** 2-4 hours
**Recommended Timeline:** Complete before production launch

---

## 📊 Success Metrics (First Week)

Track these metrics:

- **Token Registration Rate:** 60%+ of users grant permissions
- **Notification Delivery:** >95% success rate
- **User Engagement:** 30%+ of notifications tapped
- **Preference Changes:** <5% users disable all notifications
- **Error Rate:** <1% of notification sends fail

---

**Status:** Ready for pre-launch testing
**Next Step:** Complete critical checklist items
**Target Launch:** After critical tests pass
