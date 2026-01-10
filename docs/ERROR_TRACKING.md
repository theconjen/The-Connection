# Error Tracking Guide

**Last Updated**: 2026-01-10

This document explains the comprehensive error tracking system implemented in The Connection using Sentry.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Usage Guide](#usage-guide)
5. [Error Boundaries](#error-boundaries)
6. [Privacy & Security](#privacy--security)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring & Alerts](#monitoring--alerts)

---

## Overview

### What is Sentry?

Sentry is a real-time error tracking platform that helps you:
- **Track errors** in production
- **Monitor performance** bottlenecks
- **Replay user sessions** leading to errors
- **Debug with source maps** for readable stack traces
- **Set up alerts** for critical issues

### Coverage

The Connection has Sentry integrated across all platforms:

| Platform | Coverage | Features |
|----------|----------|----------|
| **Server (Node.js)** | ✅ Full | Error tracking, performance monitoring, profiling |
| **Web Client (React)** | ✅ Full | Error tracking, performance monitoring, session replay |
| **Mobile App (React Native)** | ✅ Full | Error tracking, native crash reporting, performance |

---

## Architecture

### Error Flow

```
┌─────────────────────────────────────────────────────────┐
│ Error Occurs                                             │
│ (JavaScript error, network failure, crash, etc.)        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Captured by Sentry                                      │
│ - Error details                                         │
│ - Stack trace                                           │
│ - User context                                          │
│ - Breadcrumbs (user actions)                           │
│ - Device/browser info                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Filtered (beforeSend hook)                              │
│ - Remove sensitive data                                 │
│ - Skip development errors                               │
│ - Filter out noise                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Sent to Sentry Dashboard                                │
│ - Grouped by error type                                │
│ - Source maps applied                                   │
│ - Alerts triggered                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Team Notified                                           │
│ - Slack/Email alerts                                    │
│ - Jira tickets created                                  │
│ - PagerDuty for critical issues                         │
└─────────────────────────────────────────────────────────┘
```

### Integration Points

**1. Server (`/server/lib/sentry.ts`)**
- Initializes Sentry for Node.js
- Tracks API errors
- Monitors performance
- Captures unhandled exceptions

**2. Web Client (`/client/src/lib/sentry.ts`)**
- Initializes Sentry for React
- Error boundaries integration
- Session replay
- Performance monitoring

**3. Mobile App (`/mobile-app/TheConnectionMobile-standalone/src/lib/sentry.ts`)**
- Initializes Sentry for React Native
- Native crash reporting (iOS/Android)
- Performance monitoring

---

## Setup & Configuration

### Environment Variables

**Server (`.env`)**:
```bash
# Sentry DSN (Data Source Name)
SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456

# Performance monitoring sample rate (0.0 to 1.0)
SENTRY_TRACES_SAMPLE_RATE=0.1

# Send user info (email, username) - set to false for privacy
SENTRY_SEND_DEFAULT_PII=false

# Enable Sentry in development (default: false)
SENTRY_DEBUG=false

# Release version (auto-detected from git or package.json)
SENTRY_RELEASE=1.0.0
```

**Web Client (`.env`)**:
```bash
# Client-side Sentry DSN
VITE_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/123456

# Performance monitoring sample rate
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

# Release version
VITE_SENTRY_RELEASE=1.0.0
```

**Mobile App (`app.json`)**:
```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://your-dsn@o123456.ingest.sentry.io/123456",
      "sentryOrg": "the-connection",
      "sentryProject": "the-connection-mobile"
    }
  }
}
```

### Getting Your Sentry DSN

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project for each platform (Server, Web, Mobile)
3. Copy the DSN from the project settings
4. Add to your `.env` files

### Installation

Sentry is already configured! No additional npm installation needed:
- `@sentry/node` - Already installed
- `@sentry/react` - Need to install
- `@sentry/react-native` - Need to install for mobile

```bash
# Install client-side Sentry
cd /Users/rawaselou/Desktop/The-Connection-main
pnpm add @sentry/react

# Install mobile Sentry
cd /Users/rawaselou/Desktop/TheConnectionMobile-standalone
pnpm add @sentry/react-native
```

### Source Maps

Source maps are **enabled** for all platforms:

**Web Client** (`vite.config.ts`):
```typescript
build: {
  sourcemap: true, // ✅ Enabled
}
```

**Server** (`scripts/build-server.mjs`):
```javascript
await build({
  sourcemap: true, // ✅ Enabled
})
```

**Mobile App**:
- Automatically handled by Expo/EAS Build
- Source maps uploaded during build process

---

## Usage Guide

### Basic Usage

**Server-side:**
```typescript
import { captureException, setSentryUser } from './lib/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    userId: user.id,
    operation: 'createPost',
  });
  throw error;
}

// Set user context after login
setSentryUser({
  id: user.id,
  username: user.username,
  email: user.email,
});
```

**Client-side (Web):**
```typescript
import { captureException, setSentryUser } from '@/lib/sentry';

// In your auth hook
useEffect(() => {
  if (user) {
    setSentryUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  }
}, [user]);

// Manual error capture
try {
  await fetchData();
} catch (error) {
  captureException(error, {
    component: 'UserProfile',
    action: 'loadData',
  });
}
```

**Mobile (React Native):**
```typescript
import { captureException, setSentryUser, addBreadcrumb } from '../lib/sentry';

// Track user actions
addBreadcrumb('User tapped join button', 'user.action', {
  communityId: community.id,
});

// Capture errors
try {
  await joinCommunity(communityId);
} catch (error) {
  captureException(error);
}
```

### Advanced Features

**Custom Context:**
```typescript
import { setSentryContext } from '@/lib/sentry';

// Add custom context for debugging
setSentryContext('community', {
  id: community.id,
  name: community.name,
  memberCount: community.memberCount,
});
```

**Performance Monitoring:**
```typescript
import { Sentry } from '@/lib/sentry';

// Track custom transactions
const transaction = Sentry.startTransaction({
  name: 'Load Feed',
  op: 'feed.load',
});

try {
  const posts = await loadPosts();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

**Manual Messages:**
```typescript
import { captureMessage } from '@/lib/sentry';

// Log important events (not errors)
captureMessage('User completed onboarding', 'info');
captureMessage('Unusual payment amount detected', 'warning');
```

---

## Error Boundaries

Error boundaries catch React component errors and provide fallback UI.

### Web Client

**Full-page boundary** (in `main.tsx`):
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Inline boundary** (for non-critical sections):
```typescript
import { InlineErrorBoundary } from './components/ErrorBoundary';

<InlineErrorBoundary>
  <SidebarWidget />
</InlineErrorBoundary>
```

### Mobile App

**Root boundary** (in `App.tsx` or `_layout.tsx`):
```typescript
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { wrap } from './src/lib/sentry';

function App() {
  return (
    <ErrorBoundary>
      {/* Your app */}
    </ErrorBoundary>
  );
}

// Or use Sentry's wrap
export default wrap(App);
```

### Custom Fallback UI

```typescript
<ErrorBoundary
  fallback={
    <div className="error-container">
      <h1>Oops! Something went wrong</h1>
      <button onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  }
>
  <Component />
</ErrorBoundary>
```

---

## Privacy & Security

### Data Filtering

All platforms have `beforeSend` hooks that filter sensitive data:

**Automatically filtered:**
- Authorization headers
- Cookies
- Password fields
- API keys
- Tokens

**Custom filtering:**
```typescript
// In sentry.ts
beforeSend(event, hint) {
  // Remove PII from custom fields
  if (event.extra?.phoneNumber) {
    delete event.extra.phoneNumber;
  }

  // Mask credit card numbers
  if (event.message) {
    event.message = event.message.replace(/\d{4}-\d{4}-\d{4}-\d{4}/g, '****-****-****-****');
  }

  return event;
}
```

### Development vs Production

**Development:**
- Errors are **NOT sent** to Sentry (filtered by `beforeSend`)
- Errors are logged to console only
- Enable with `SENTRY_DEBUG=true` if needed

**Production:**
- Errors are sent to Sentry
- Sampled at configured rate (10% default)
- Sensitive data filtered

### GDPR Compliance

**User consent:**
- Only track errors if user consents to analytics
- Use `SENTRY_SEND_DEFAULT_PII=false` to avoid sending emails/usernames
- Implement opt-out: `Sentry.close()` when user opts out

**Data retention:**
- Configure in Sentry dashboard (default: 90 days)
- Can be reduced to 30 days for GDPR compliance

---

## Best Practices

### 1. Set User Context After Login

```typescript
// ✅ Good
useEffect(() => {
  if (user) {
    setSentryUser({ id: user.id, username: user.username });
  } else {
    clearSentryUser();
  }
}, [user]);
```

### 2. Add Context to Errors

```typescript
// ❌ Bad
try {
  await deletePost(postId);
} catch (error) {
  captureException(error);
}

// ✅ Good
try {
  await deletePost(postId);
} catch (error) {
  captureException(error, {
    postId,
    userId: currentUser.id,
    operation: 'deletePost',
  });
}
```

### 3. Use Breadcrumbs for User Actions

```typescript
// Track user journey
addBreadcrumb('Opened settings', 'navigation');
addBreadcrumb('Changed theme to dark', 'user.action');
addBreadcrumb('Saved settings', 'user.action');

// If error occurs, Sentry shows full journey
```

### 4. Don't Swallow Errors

```typescript
// ❌ Bad
try {
  await riskyOperation();
} catch (error) {
  // Silent fail - error lost!
}

// ✅ Good
try {
  await riskyOperation();
} catch (error) {
  captureException(error);
  // Show user-friendly message
  showToast('Something went wrong. Please try again.');
}
```

### 5. Filter Noise

```typescript
// In beforeSend
beforeSend(event, hint) {
  const error = hint.originalException;

  // Ignore expected errors
  if (error?.message?.includes('User cancelled')) {
    return null;
  }

  // Ignore network timeouts (expected in poor connectivity)
  if (error?.name === 'TimeoutError') {
    return null;
  }

  return event;
}
```

### 6. Monitor Performance

```typescript
// Track slow operations
const start = Date.now();
const posts = await loadPosts();
const duration = Date.now() - start;

if (duration > 2000) {
  captureMessage(`Slow feed load: ${duration}ms`, 'warning');
}
```

---

## Troubleshooting

### Issue: Sentry not capturing errors

**Check:**
1. DSN is set correctly in `.env`
2. Not in development mode (errors filtered by default)
3. Error is not being caught without re-throwing

**Solution:**
```bash
# Enable Sentry in development for testing
SENTRY_DEBUG=true
```

### Issue: Source maps not working

**Symptoms:** Stack traces show minified code

**Solutions:**
1. Verify source maps are enabled:
   ```typescript
   // vite.config.ts
   build: { sourcemap: true }

   // build-server.mjs
   sourcemap: true
   ```

2. Check build output contains `.map` files:
   ```bash
   ls dist/public/assets/*.js.map
   ls dist-server/*.map
   ```

3. Upload source maps to Sentry (advanced):
   ```bash
   pnpm add -D @sentry/vite-plugin
   ```

### Issue: Too many errors flooding Sentry

**Solution:**
1. Increase sampling:
   ```bash
   SENTRY_TRACES_SAMPLE_RATE=0.01  # 1% instead of 10%
   ```

2. Add more filters in `beforeSend`

3. Set up rate limits in Sentry dashboard

### Issue: Errors not showing user context

**Check:**
1. `setSentryUser()` called after login
2. `clearSentryUser()` called after logout
3. `SENTRY_SEND_DEFAULT_PII` not blocking user data

**Solution:**
```typescript
// In your auth flow
onLogin((user) => {
  setSentryUser({ id: user.id, username: user.username });
});

onLogout(() => {
  clearSentryUser();
});
```

---

## Monitoring & Alerts

### Sentry Dashboard

Access at: https://sentry.io/organizations/the-connection/

**Key sections:**
- **Issues**: All errors grouped by type
- **Performance**: Slow transactions
- **Releases**: Track errors by version
- **Alerts**: Configure notifications

### Recommended Alerts

**1. High Error Rate**
- Trigger: >100 errors in 1 hour
- Action: Email + Slack notification

**2. New Error Type**
- Trigger: First occurrence of new error
- Action: Slack notification

**3. Critical Error**
- Trigger: Payment failure, data loss, security issue
- Action: PagerDuty + Email

**4. Performance Degradation**
- Trigger: P95 response time >2s
- Action: Email notification

### Integration with Tools

**Slack:**
```bash
# In Sentry dashboard
Settings → Integrations → Slack → Connect
```

**Jira:**
```bash
# Auto-create tickets for high-priority errors
Settings → Integrations → Jira → Connect
```

**PagerDuty:**
```bash
# For critical production issues
Settings → Integrations → PagerDuty → Connect
```

---

## Summary

### What's Configured

✅ **Server**
- Sentry initialized in `/server/lib/sentry.ts`
- Error tracking enabled
- Performance monitoring (10% sampling)
- Source maps enabled
- Sensitive data filtered

✅ **Web Client**
- Sentry initialized in `/client/src/lib/sentry.ts`
- Error boundaries in place
- Session replay enabled (10% of sessions)
- Performance monitoring
- Source maps enabled
- Global error handlers integrated

✅ **Mobile App**
- Sentry initialized in `/mobile-app/.../lib/sentry.ts`
- Native crash reporting
- Error boundaries
- Performance monitoring
- Configured in `app.json`

### Next Steps

1. **Install client packages:**
   ```bash
   pnpm add @sentry/react @sentry/react-native
   ```

2. **Test error tracking:**
   ```bash
   # Throw a test error to verify Sentry is working
   throw new Error('Test error for Sentry');
   ```

3. **Set up alerts** in Sentry dashboard

4. **Monitor for first week** and adjust sampling rates

5. **Train team** on using Sentry dashboard

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React Guide](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Guide](https://docs.sentry.io/platforms/node/)
- [Sentry React Native Guide](https://docs.sentry.io/platforms/react-native/)

---

**Questions or issues?** Check [CLAUDE.md](../CLAUDE.md) or open a GitHub issue.
