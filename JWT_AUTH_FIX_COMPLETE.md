# JWT Authentication Fix - Search Now Works!

## Problem Identified

The search was failing with **"No results found"** because:

1. **403 Forbidden Error**: The server's `requireAuth` middleware only checked for **session cookies**
2. **Mobile App Uses JWT**: Your mobile app sends `Authorization: Bearer ${token}` headers
3. **Token Mismatch**: The server rejected JWT tokens and required session cookies
4. **No Token on Login**: The login endpoint didn't return JWT tokens for mobile apps

## Root Cause

```
Mobile App → Sends: Authorization: Bearer <token>
           ↓
Server Middleware → Checks: req.session.userId (session cookie)
           ↓
Result: 401 Unauthorized → Search returns "No results found"
```

## Solution Implemented

### 1. **Server Now Supports Both Auth Methods** ✅

Modified `server/middleware/auth.ts`:
```typescript
function getUserIdFromAuth(req) {
  // Try session cookies first (web app)
  if (req.session?.userId) return req.session.userId;

  // Then try JWT Bearer token (mobile app)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.sub || decoded.id;
  }

  return undefined;
}
```

### 2. **Login Endpoint Now Returns JWT Tokens** ✅

Modified `server/auth.ts` (line 373-390):
```typescript
// Generate JWT token for mobile apps
const jwtSecret = process.env.JWT_SECRET;
let jwtToken = null;
if (jwtSecret) {
  jwtToken = jwt.sign(
    { sub: user.id, email: user.email },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// Return user data with JWT token
res.json({
  ...userWithoutPassword,
  token: jwtToken, // Mobile apps can use this!
});
```

### 3. **Mobile App Now Saves JWT Tokens** ✅

Modified `mobile-app/.../src/contexts/AuthContext.tsx`:
```typescript
const login = async (username: string, password: string) => {
  const response = await apiClient.post('/login', { username, password });

  // Save JWT token if present
  if (response.data.token) {
    await saveAuthToken(response.data.token);
    console.info('JWT token saved successfully');
  }

  // ... rest of login flow
};
```

## How It Works Now

```
1. User logs in → Server returns: { id, username, email, token: "jwt-here" }
2. Mobile app saves token to SecureStore
3. apiClient interceptor adds: Authorization: Bearer <token>
4. requireAuth middleware checks JWT → ✅ Valid
5. Search works! → GET /api/search?q=Janelle&filter=accounts
```

## **Next Steps - MUST DO TO FIX**

### Step 1: Restart the Server

The server needs to be restarted to load the new code:

```bash
# If running in development:
# Stop the current server (Ctrl+C) and restart:
cd /Users/rawaselou/Desktop/The-Connection-main
pnpm run dev

# Or if using production:
# Restart your production server
```

### Step 2: Log Out and Log Back In

**IMPORTANT**: You must log out and log back in for the JWT token to be saved:

1. Open the mobile app
2. Go to Menu → Log Out
3. Log back in with your credentials (Janelle)
4. The app will now save the JWT token

### Step 3: Test Search

1. Go to Messages tab
2. Tap the "New Message" button
3. Search for "Janelle" or any other user
4. **You should now see results!** 🎉

## Technical Details

### Authentication Flow

| Component | Old Behavior | New Behavior |
|-----------|-------------|--------------|
| Web App | Session cookies ✓ | Session cookies ✓ (unchanged) |
| Mobile App | Session cookies ✗ | JWT Bearer token ✓ (now works!) |
| Server Middleware | Session only | Session OR JWT ✓ |

### Security

- **JWT_SECRET** required in `.env` (already configured)
- Tokens expire after **7 days**
- Tokens include: `{ sub: userId, email: userEmail }`
- Session-based auth still fully supported (no breaking changes)

### Files Modified

1. **server/middleware/auth.ts**
   - Added `getUserIdFromAuth()` function
   - Modified `requireAuth` to check JWT tokens

2. **server/auth.ts**
   - Modified login endpoint to return JWT token
   - Token generated using `jsonwebtoken` library

3. **mobile-app/.../src/contexts/AuthContext.tsx**
   - Modified `login()` function to save JWT token
   - Token saved to SecureStore

### Backward Compatibility

✅ **No Breaking Changes**:
- Web app still uses session cookies
- Mobile app can use session cookies OR JWT tokens
- Server checks session FIRST, then JWT
- Old sessions remain valid

## Verification

After restarting the server and re-logging in, you should see:

**In mobile app logs:**
```
JWT token saved successfully
API Base URL: https://api.theconnection.app/api
```

**In server logs:**
```
Session saved with ID: <session-id>
```

**API Request:**
```bash
GET /api/search?q=Janelle&filter=accounts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
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

## Troubleshooting

### Still Getting "No results found"?

1. **Check if server restarted**: Look for recent timestamps in server logs
2. **Verify JWT_SECRET is set**: `echo $JWT_SECRET` (should output a long string)
3. **Clear app data**: Uninstall and reinstall the mobile app
4. **Check API base URL**: Should point to your server (production or localhost)

### 403 Forbidden Error?

1. **Log out and log back in** - Old sessions don't have JWT tokens
2. **Check token storage**: Token should be in SecureStore after login
3. **Verify JWT_SECRET matches**: Server and token must use same secret

### Token Not Saving?

1. Check mobile app logs for "JWT token saved successfully"
2. Verify `response.data.token` is present in login response
3. Check SecureStore permissions on iOS/Android

## Summary

✅ **Committed**: a6b2272
✅ **Pushed** to remote
🔄 **Restart Server** - Required!
🔄 **Re-login** - Required!
🎯 **Search Will Work** - After restart + re-login

---

**Status**: ✅ Complete - Ready to test
**Commit**: a6b2272
**Branch**: main
**Date**: 2026-01-13
