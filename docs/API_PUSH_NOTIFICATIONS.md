# Push Notification Routes Summary

## New API Endpoints

### Direct Messages (DMs)
- **GET /api/dms/:userId** - Fetch all DMs between authenticated user and another user
- **POST /api/dms/send** - Send a new DM (now includes push notification)
  - Body: `{ receiverId: number, content: string }`
  - Returns: The created message object
  - Side effect: Sends push notification to receiver (when DB is set up)

### Push Token Management
- **POST /api/push-tokens/register** - Register a push token for the authenticated user
  - Body: `{ token: string }` (Expo push token)
  - Returns: `{ success: true, message: string }`
  
- **POST /api/push-tokens/unregister** - Remove a push token
  - Body: `{ token: string }` (Expo push token)
  - Returns: `{ success: true, message: string }`

## Authentication

All endpoints require authentication via session cookie. If not authenticated, returns:
```json
{
  "message": "Not authenticated"
}
```
Status: 401

## Implementation Status

✅ **Completed:**
- expo-server-sdk installed
- Push service created with batch notification support
- Routes created and mounted
- DM route integrated with push notification logic
- Full build passes

⏳ **Pending (requires database migration):**
- Database schema for push_tokens table
- Storage methods for saving/retrieving push tokens
- Actual push notification sending (currently commented out with TODOs)
- Mobile app integration (expo-notifications installation)

## Example Usage (After DB Setup)

### Register a push token from mobile app:
```javascript
const response = await fetch('/api/push-tokens/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: expoPushToken }),
  credentials: 'include'
});
```

### Send a DM (will trigger push notification):
```javascript
const response = await fetch('/api/dms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    receiverId: 123, 
    content: 'Hello!' 
  }),
  credentials: 'include'
});
```
