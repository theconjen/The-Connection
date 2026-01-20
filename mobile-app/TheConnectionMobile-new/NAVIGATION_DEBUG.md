# DM Navigation Debug Guide

## Issue
Getting "Unmatched Route" when trying to open DM conversation after selecting a user from search.

## Possible Causes

### 1. User ID is Undefined
The search results might not include the `id` field properly.

**Check in mobile app logs:**
```
Navigating to message screen with userId: <should show a number>
Cannot navigate: Invalid user <-- if this appears, user.id is undefined
```

### 2. Route Not Registered with Expo Router

The route file exists at: `app/messages/[userId].tsx`

**Try manual navigation test:**
1. Open the app
2. Go to an existing conversation (if any)
3. Check if that works

### 3. Metro Bundler Needs Restart

**Steps:**
1. Stop the Metro bundler (Ctrl+C or close Expo Go)
2. Clear cache: `npx expo start -c`
3. Reopen the app

### 4. App Needs Rebuild

Sometimes Expo Router changes require a rebuild:
```bash
cd /Users/rawaselou/Desktop/The-Connection-main/mobile-app/TheConnectionMobile-new
rm -rf .expo node_modules
pnpm install
npx expo start -c
```

## Quick Fix Steps

### Step 1: Check Search Results
Open React Native Debugger or check Expo logs to see what the search API returns:

Expected format:
```json
[
  {
    "type": "user",
    "id": 19,
    "username": "Janelle",
    "displayName": "Janelle",
    "canMessage": true
  }
]
```

### Step 2: Test Navigation Manually
Try navigating directly from the messages tab to an existing conversation.

### Step 3: Restart Metro
```bash
# In terminal where Metro is running:
Ctrl+C

# Then:
npx expo start -c
```

### Step 4: Check Route File
Verify the file exists:
```bash
ls -la app/messages/[userId].tsx
# Should show: -rw-r--r-- ... app/messages/[userId].tsx
```

## Recent Code Changes

Modified `app/new-message.tsx` to:
1. Validate user.id before navigation
2. Use simpler router.push() syntax
3. Add console logging for debugging

```typescript
const handleUserSelect = (user: any) => {
  if (!user || !user.id) {
    console.error('Cannot navigate: Invalid user', user);
    return;
  }

  const userId = String(user.id);
  console.info('Navigating to message screen with userId:', userId);

  try {
    router.push(`/messages/${userId}`);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};
```

## Expected Logs (Success)

```
Navigating to message screen with userId: 19
Socket connected: <socket-id>
```

## Expected Logs (Failure)

```
Cannot navigate: Invalid user { type: 'user', ... }
```
or
```
Navigation error: Error: ...
```

## Solution

Once you restart Metro bundler with cache clear, the navigation should work!
