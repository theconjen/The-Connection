# Push Notification Implementation

This document describes the push notification setup that has been implemented.

## What's Been Implemented

### 1. Server-Side Components

#### Dependencies
- **expo-server-sdk**: Installed as a production dependency for sending push notifications to Expo apps

#### Services
- **`server/services/pushService.ts`**: Core push notification service
  - `sendPushNotification()`: Send a notification to a single user
  - `sendPushNotifications()`: Send notifications to multiple users in batches
  - Validates Expo push tokens
  - Handles batching for optimal performance

#### Routes
- **`server/routes/pushTokens.ts`**: Push token management endpoints
  - `POST /api/push-tokens/register`: Register/update a push token for the authenticated user
  - `POST /api/push-tokens/unregister`: Remove a push token for the authenticated user

- **`server/routes/dmRoutes.ts`**: Direct messaging routes (now mounted)
  - `GET /api/dms/:userId`: Fetch DMs between two users
  - `POST /api/dms/send`: Send a new DM (now includes push notification logic)

#### Route Mounting
Updated `server/routes.ts` to mount:
- `/api/dms` -> dmRoutes
- `/api/push-tokens` -> pushTokenRoutes

Both routes are protected by the AUTH feature flag and require authentication.

### 2. Integration with DMs

The DM send route (`POST /api/dms/send`) now includes push notification logic:
- When a DM is sent, the service will attempt to send a push notification to the receiver
- The push notification includes the sender's name and message preview
- Push notifications are sent asynchronously and won't block the DM from being sent
- If push notification fails, it's logged but doesn't affect the DM delivery

## What's Not Yet Implemented (TODOs)

### 1. Database Schema
The following database changes are needed for full functionality:

```sql
-- Add push_tokens table to store user push tokens
CREATE TABLE push_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- Optional: Add notification preferences to users table
ALTER TABLE users 
  ADD COLUMN dm_notifications_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN push_notifications_enabled BOOLEAN DEFAULT TRUE;
```

### 2. Storage Methods
The following methods need to be implemented in `server/storage.ts`:

```typescript
// Save a push token for a user
async savePushToken(userId: number, token: string): Promise<void>

// Get push tokens for a user
async getUserPushTokens(userId: number): Promise<string[]>

// Remove a push token
async removePushToken(userId: number, token: string): Promise<void>

// Get user notification preferences
async getUserNotificationPreferences(userId: number): Promise<{
  dmNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}>
```

### 3. Mobile App Setup
The Expo mobile app needs the following packages installed:

```bash
cd mobile-app/TheConnectionMobile
npx expo install expo-notifications expo-device
```

Then implement:
1. Request notification permissions on app startup
2. Register the Expo push token with the server via `POST /api/push-tokens/register`
3. Handle incoming push notifications
4. Unregister token on logout via `POST /api/push-tokens/unregister`

## How to Use (Once Database is Set Up)

### 1. Enable Push Notifications in DM Route

Once the database schema and storage methods are implemented, uncomment the code in `server/routes/dmRoutes.ts`:

```typescript
// Uncomment this section in the POST /api/dms/send handler:
const receiverUser = await storage.getUser(parseInt(receiverId));
const pushTokens = await storage.getUserPushTokens(parseInt(receiverId));

if (pushTokens && pushTokens.length > 0) {
  const sender = await storage.getUser(senderId);
  const senderName = sender?.displayName || sender?.username || 'Someone';
  
  for (const pushToken of pushTokens) {
    await sendPushNotification(
      pushToken,
      `New message from ${senderName}`,
      content,
      { type: 'dm', senderId, messageId: message.id }
    );
  }
  console.log('Push notification sent to receiver');
}
```

### 2. Enable Token Storage in Push Token Routes

Uncomment the storage calls in `server/routes/pushTokens.ts`:

```typescript
// In POST /register:
await storage.savePushToken(userId, token);

// In POST /unregister:
await storage.removePushToken(userId, token);
```

## Testing

Once everything is set up:

1. **Register a push token**: 
   ```bash
   curl -X POST http://localhost:5000/api/push-tokens/register \
     -H "Content-Type: application/json" \
     -d '{"token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"}' \
     --cookie "session=your-session-cookie"
   ```

2. **Send a DM and verify push notification**:
   ```bash
   curl -X POST http://localhost:5000/api/dms/send \
     -H "Content-Type: application/json" \
     -d '{"receiverId": 2, "content": "Hello!"}' \
     --cookie "session=your-session-cookie"
   ```

3. Check server logs for "Push notification sent" messages

## Next Steps

To complete the implementation:

1. **Create database migration** for push_tokens table
2. **Implement storage methods** for push token management
3. **Install Expo packages** in the mobile app
4. **Implement mobile push notification handling**
5. **Uncomment the TODO sections** in dmRoutes.ts and pushTokens.ts
6. **Add unit tests** for push notification service and routes
7. **Consider adding push notifications** for other events (mentions, replies, etc.)
