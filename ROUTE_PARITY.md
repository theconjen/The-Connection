# Route Parity: Mobile (Expo Router) vs Web (Wouter)

> Generated: 2026-01-19

## Summary

| Category | Mobile Routes | Web Routes | Missing on Web |
|----------|--------------|------------|----------------|
| Auth | 5 | 2 | 3 (handled differently) |
| Core Features | 25 | 28 | 5 |
| Settings | 6 | 1 | 5 (mobile-specific) |
| Onboarding | 4 | 0 | N/A (mobile-only) |

---

## Full Route Inventory

### Legend
- **Page**: Full implementation exists
- **Redirect**: Route redirects to another page
- **Shell**: Minimal page with "Open in App" button
- **API**: Handled by server-side route (returns HTML)
- **N/A**: Mobile-only feature, not needed on web

### Authentication Routes

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/(auth)/login` | `/auth` (tab) | Page (different UX) | `auth-page.tsx` |
| `/(auth)/register` | `/auth` (tab) | Page (different UX) | `auth-page.tsx` |
| `/(auth)/forgot-password` | `/reset-password` | Page (redirects to auth) | `auth-page.tsx` |
| `/(auth)/verify-email` | `/api/auth/verify-email` | API (server HTML response) | Server route |
| `/reset-password` | `/reset-password` | Page | `auth-page.tsx` |

### Core Content Routes (Email/Shared Link Targets)

| Mobile Path | Web Path Exists? | Parity Decision | Owner File | Priority |
|------------|------------------|-----------------|------------|----------|
| `/profile/[userId]` | `/profile/:username`, `/user/:id` | Page | `user-profile-page.tsx` | DONE |
| `/communities/[id]` | `/communities/:slug` | Page | `community-page.tsx` | - |
| `/posts/[id]` | `/posts/:id` | Page | `post-detail-page.tsx` | - |
| `/events/[id]` | `/events/:id` | Page | `event-detail-page.tsx` | - |
| `/prayers/[id]` | `/prayers/:id` | Page | `prayer-detail-page.tsx` | DONE |
| `/apologetics/[id]` | `/apologetics/:id` | Page | `apologetics-detail.tsx` | - |
| `/messages/[userId]` | `/messages/:userId` | Page | `DMs.tsx` | - |
| `/questions/[id]` | `/questions/:id` | Page | `question-detail-page.tsx` | DONE |

### Main Feature Routes

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/(tabs)/feed` | `/` (home) | Page | `home-page.tsx` |
| `/(tabs)/communities` | `/communities` | Page | `communities-page.tsx` |
| `/(tabs)/events` | `/events` | Page | `events-page.tsx` |
| `/(tabs)/messages` | `/messages` | Page | `dms-page.tsx` |
| `/(tabs)/profile` | `/profile` | Page | `profile-page.tsx` |
| `/(tabs)/apologetics` | `/apologetics` | Page | `apologetics-page.tsx` |
| `/(tabs)/inbox` | `/questions/inbox` | Page | `questions-inbox.tsx` |
| `/(tabs)/create` | `/submit-post` | Page | `submit-post-page.tsx` |
| `/search` | NO | **NEEDS SHELL** | - |
| `/notifications` | `/notifications` | Shell | `notifications-page.tsx` |
| `/bookmarks` | NO | **NEEDS PAGE** | - |
| `/blocked-users` | NO (file exists) | **NEEDS ROUTE** | `BlockedUsersPage.tsx` |

### Create/Submit Routes

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/create-post` | `/submit-post` | Page | `submit-post-page.tsx` |
| `/create-forum-post` | `/submit-post` | Page | `submit-post-page.tsx` |
| `/create/community` | NO | N/A (admin feature) | - |
| `/create/event` | NO | N/A (community feature) | - |
| `/create/discussion` | `/submit-post` | Redirect | - |
| `/create/post` | `/submit-post` | Redirect | - |
| `/communities/create` | NO | N/A (in community page) | - |
| `/events/create` | NO | N/A (in events page) | - |

### Settings Routes

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/settings` | `/settings` | Page | `settings-page.tsx` |
| `/settings/notifications` | NO | N/A (mobile-specific) | - |
| `/settings/privacy` | `/settings` (section) | Page | `settings-page.tsx` |
| `/settings/change-password` | `/settings` (section) | Page | `settings-page.tsx` |
| `/settings/guidelines` | `/terms` or `/privacy` | Redirect | - |
| `/edit-profile` | `/settings` (section) | Page | `settings-page.tsx` |
| `/change-password` | `/settings` (section) | Page | `settings-page.tsx` |
| `/delete-account` | `/settings` (section) | Page | `settings-page.tsx` |

### Legal Pages

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/privacy` | `/privacy` | Page | `privacy-policy-page.tsx` |
| `/terms` | `/terms` | Page | `terms-of-service-page.tsx` |

### Questions/Expert Routes

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/questions/inbox` | `/questions/inbox` | Page | `questions-inbox.tsx` |
| `/questions/ask` | NO | **NEEDS SHELL** | - |
| `/questions/my-questions` | NO | **NEEDS SHELL** | - |
| `/questions/[id]` | NO | **NEEDS SHELL** | - |

### Onboarding Routes (Mobile-Only)

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/(onboarding)/welcome` | NO | N/A | - |
| `/(onboarding)/faith-background` | NO | N/A | - |
| `/(onboarding)/profile-setup` | NO | N/A | - |
| `/(onboarding)/community-discovery` | NO | N/A | - |

### Utility Routes

| Mobile Path | Web Path Exists? | Parity Decision | Owner File |
|------------|------------------|-----------------|------------|
| `/menu` | NO | N/A (mobile nav) | - |
| `/new-message` | `/messages` | Redirect | - |
| `/notification-settings` | `/settings` | Part of settings | - |

---

## Implementation Priority

### HIGH (Email Link Targets - Must Not 404)
1. [x] `/reset-password` - Already exists
2. [x] `/api/auth/verify-email` - Server handles with HTML response
3. [x] `/forgot-password` - Redirects to `/reset-password`

### MEDIUM (Shareable Link Targets)
1. [x] `/prayers/:id` - Prayer request detail page
2. [x] `/bookmarks` - User bookmarks page
3. [x] `/blocked-users` - Route added for existing component
4. [x] `/search` - Full search page implemented

### LOW (Nice to Have)
1. [x] `/questions/:id` - Question detail page implemented
2. [ ] `/questions/ask` - Ask question shell (future)
3. [ ] `/questions/my-questions` - My questions shell (future)

### COMPLETE (User Profile Routes)
1. [x] `/profile/:username` - Public user profile by username
2. [x] `/user/:id` - Public user profile by ID (mobile app links)
3. [x] `/notifications` - Shell page with app link
4. [x] Server API: `GET /api/users/by-id/:id` - Public user lookup by ID
5. [x] Server API: `GET /api/users/profile/:username` - Public user lookup by username
6. [x] Server API: `GET /api/users/:id/posts` - Public user posts endpoint
7. [x] Server API: `GET /api/users/:id/communities` - Public user communities endpoint

---

## SPA Rewrite Configuration

**Status: VERIFIED**

### Express Server (Production) - server/vite.ts:97-102
```typescript
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

### Vite (Development)
Handled by Vite middleware - all non-API routes serve index.html via HMR.

### Vercel - vercel.json (CREATED)
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Nginx (if needed)
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
