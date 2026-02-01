# Share Feature QA Test Checklist

## Overview

This checklist covers the share URLs, public preview pages, and deep linking implementation for The Connection app.

---

## Canonical URL Structure

| Content Type | Canonical URL Format | Example |
|--------------|---------------------|---------|
| Apologetics | `/a/:slugOrId` | `https://theconnection.app/a/evidence-for-god` |
| Events | `/e/:eventId` | `https://theconnection.app/e/123` |
| Posts | `/p/:postId` | `https://theconnection.app/p/456` |
| Profiles | `/u/:username` | `https://theconnection.app/u/johnsmith` |

---

## 1. Public API Endpoints

### Test Each Endpoint

- [ ] **Apologetics**: `GET /api/public/apologetics/:idOrSlug`
  - [ ] Returns correct fields (title, quickAnswer, keyPointsPreview, sourcesCount)
  - [ ] Works with numeric ID
  - [ ] Works with slug
  - [ ] Returns 404 for non-existent articles
  - [ ] Does not expose draft/unpublished articles

- [ ] **Events**: `GET /api/public/events/:eventId`
  - [ ] Returns correct fields (title, eventDate, locationDisplay, hostName)
  - [ ] Does not expose private events
  - [ ] Does not expose exact address unless showPublicAddress is true
  - [ ] Returns 404 for non-existent events

- [ ] **Posts**: `GET /api/public/posts/:postId`
  - [ ] Returns correct fields (title, contentPreview, authorName, likeCount)
  - [ ] Does not expose deleted posts
  - [ ] Returns 404 for non-existent posts

- [ ] **Profiles**: `GET /api/public/users/:username`
  - [ ] Returns correct fields (displayName, avatarUrl, bio, counts)
  - [ ] Respects private profile settings (bio, location hidden)
  - [ ] Returns 404 for non-existent users

---

## 2. Web Public Preview Pages

### Test Each Page

- [ ] **Apologetics Preview** (`/a/:slugOrId`)
  - [ ] Page loads without authentication
  - [ ] Displays article title and quick answer
  - [ ] Shows "Open in App" banner
  - [ ] "Open in App" button works on mobile
  - [ ] "Get the App" button links to correct store
  - [ ] Share button opens native share sheet

- [ ] **Event Preview** (`/e/:eventId`)
  - [ ] Page loads without authentication
  - [ ] Displays event title, date, location
  - [ ] Shows "RSVP in App" CTA
  - [ ] "Open in App" button works on mobile
  - [ ] "Get the App" button links to correct store
  - [ ] Share button opens native share sheet

- [ ] **Post Preview** (`/p/:postId`)
  - [ ] Page loads without authentication
  - [ ] Displays post content and author info
  - [ ] Shows engagement stats (likes, comments)
  - [ ] "Open in App" button works on mobile
  - [ ] "Continue on Web" button navigates correctly

- [ ] **Profile Preview** (`/u/:username`)
  - [ ] Page loads without authentication
  - [ ] Displays user avatar, name, stats
  - [ ] Respects private profile settings
  - [ ] Shows "Follow in App" CTA
  - [ ] Recent posts shown for public profiles

---

## 3. OpenGraph Meta Tags (Social Sharing)

### Test with Social Media Debuggers

**Tools:**
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

- [ ] **Apologetics**
  - [ ] og:title shows article title
  - [ ] og:description shows quick answer
  - [ ] og:image shows article image or default
  - [ ] Twitter card renders correctly

- [ ] **Events**
  - [ ] og:title shows event title
  - [ ] og:description shows date, location, host
  - [ ] og:image shows event poster or default
  - [ ] Twitter card renders correctly

- [ ] **Posts**
  - [ ] og:title shows post title or "Post by {author}"
  - [ ] og:description shows content preview
  - [ ] og:image shows post image or default
  - [ ] Twitter card renders correctly

- [ ] **Profiles**
  - [ ] og:title shows "{displayName} (@{username})"
  - [ ] og:description shows bio excerpt and follower count
  - [ ] og:image shows avatar or default
  - [ ] Twitter card renders correctly

---

## 4. Mobile Share Buttons

### Test Share Functionality

- [ ] **Events Screen**
  - [ ] Share button visible on event cards
  - [ ] Tapping share opens native share sheet
  - [ ] Share message includes event title and URL
  - [ ] URL uses canonical format (`/e/:eventId`)

- [ ] **Posts/Feed Screen**
  - [ ] Share button visible on post cards
  - [ ] Tapping share opens native share sheet
  - [ ] Share message includes post title and URL
  - [ ] URL uses canonical format (`/p/:postId`)

- [ ] **Profile Screen**
  - [ ] Share profile option available
  - [ ] Share message includes display name
  - [ ] URL uses canonical format (`/u/:username`)

---

## 5. Deep Linking (iOS)

### Prerequisites
- App installed on iOS device
- Associated Domains configured in Xcode

### Test Cases

- [ ] **Universal Links**
  - [ ] Tap `/a/:id` link in Messages → opens app to apologetics detail
  - [ ] Tap `/e/:id` link in Messages → opens app to event detail
  - [ ] Tap `/p/:id` link in Messages → opens app to post detail
  - [ ] Tap `/u/:username` link in Messages → opens app to profile

- [ ] **Custom Scheme**
  - [ ] `theconnection://apologetics/123` → opens apologetics detail
  - [ ] `theconnection://events/123` → opens event detail
  - [ ] `theconnection://posts/123` → opens post detail
  - [ ] `theconnection://profile/username` → opens profile

- [ ] **Fallback Behavior**
  - [ ] If app not installed, links open in Safari
  - [ ] Public preview page shows "Get the App" button
  - [ ] App Store link is correct

---

## 6. Deep Linking (Android)

### Prerequisites
- App installed on Android device
- Intent filters configured in app.json

### Test Cases

- [ ] **App Links**
  - [ ] Tap `/a/:id` link in Chrome → opens app to apologetics detail
  - [ ] Tap `/e/:id` link in Chrome → opens app to event detail
  - [ ] Tap `/p/:id` link in Chrome → opens app to post detail
  - [ ] Tap `/u/:username` link in Chrome → opens app to profile

- [ ] **Custom Scheme**
  - [ ] `theconnection://apologetics/123` → opens apologetics detail
  - [ ] `theconnection://events/123` → opens event detail
  - [ ] `theconnection://posts/123` → opens post detail
  - [ ] `theconnection://profile/username` → opens profile

- [ ] **Fallback Behavior**
  - [ ] If app not installed, links open in browser
  - [ ] Public preview page shows "Get the App" button
  - [ ] Play Store link is correct

---

## 7. Edge Cases

### Error Handling

- [ ] Invalid/non-existent content ID → 404 page or error message
- [ ] Deleted content → 404 page
- [ ] Private content → 404 page (not "private" message to avoid info leak)
- [ ] Network error → graceful error message with retry option

### Authentication States

- [ ] Not logged in + valid link → can view public preview
- [ ] Not logged in + "Open in App" → prompts to login first
- [ ] Logged in + "Open in App" → goes directly to content
- [ ] Deep link while logged out → goes to login, then redirects to content

### UTM Parameters

- [ ] Shared links include UTM parameters: `?utm_source=ios_app&utm_medium=share&utm_campaign=content_share`
- [ ] UTM parameters preserved through redirect

---

## 8. Verification Commands (curl)

Use these commands to verify OG meta tags, .well-known files, and public API endpoints.

### OG Meta Tags Verification

Test that social media crawlers receive proper OG meta tags:

```bash
# Test Apologetics OG tags (Twitter)
curl -A "Twitterbot/1.0" "https://theconnection.app/a/1" 2>/dev/null | grep -E "<meta.*og:|<meta.*twitter:"

# Test Event OG tags (Facebook)
curl -A "facebookexternalhit/1.1" "https://theconnection.app/e/123" 2>/dev/null | grep -E "<meta.*og:|<meta.*twitter:"

# Test Post OG tags (LinkedIn)
curl -A "LinkedInBot/1.0" "https://theconnection.app/p/456" 2>/dev/null | grep -E "<meta.*og:|<meta.*twitter:"

# Test Profile OG tags (Slack)
curl -A "Slackbot-LinkExpanding" "https://theconnection.app/u/testuser" 2>/dev/null | grep -E "<meta.*og:|<meta.*twitter:"
```

Expected: Each should return HTML with `og:title`, `og:description`, `og:image`, `twitter:card` meta tags.

### .well-known Files Verification

```bash
# Test Apple App Site Association (iOS Universal Links)
curl -I "https://theconnection.app/.well-known/apple-app-site-association"
# Expected: Content-Type: application/json, HTTP 200

curl "https://theconnection.app/.well-known/apple-app-site-association" | jq .
# Expected: JSON with applinks.details containing paths

# Test Android Asset Links
curl -I "https://theconnection.app/.well-known/assetlinks.json"
# Expected: Content-Type: application/json, HTTP 200

curl "https://theconnection.app/.well-known/assetlinks.json" | jq .
# Expected: JSON array with android_app target
```

### Public API Verification

```bash
# Test Apologetics API
curl -s "https://theconnection.app/api/public/apologetics/1" | jq '{title, quickAnswer, keyPointsTotal}'

# Test Event API
curl -s "https://theconnection.app/api/public/events/123" | jq '{title, eventDate, locationDisplay}'

# Test Post API
curl -s "https://theconnection.app/api/public/posts/456" | jq '{title, authorName, likeCount}'

# Test Profile API
curl -s "https://theconnection.app/api/public/users/testuser" | jq '{displayName, username, counts}'
```

### Rate Limiting Verification

```bash
# Verify rate limit headers
curl -I "https://theconnection.app/api/public/apologetics/1" | grep -E "RateLimit|X-RateLimit"

# Expected headers:
# RateLimit-Limit: 60
# RateLimit-Remaining: 59
# RateLimit-Reset: <timestamp>
```

### Cache Headers Verification

```bash
# Verify cache headers on public API
curl -I "https://theconnection.app/api/public/events/123" | grep -E "Cache-Control|Vary"

# Expected:
# Cache-Control: public, max-age=300, stale-while-revalidate=3600
# Vary: Accept, Accept-Encoding
```

### Non-Crawler Behavior

Verify that regular browsers get the SPA (not OG HTML):

```bash
# Regular browser user agent - should NOT get OG meta HTML
curl -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" "https://theconnection.app/a/1" 2>/dev/null | head -20
# Expected: Should return SPA HTML (React app), not OG meta HTML
```

---

## 9. Performance

- [ ] Public API endpoints respond in < 500ms
- [ ] Web preview pages load in < 2 seconds
- [ ] Deep link redirect happens in < 1 second
- [ ] Share sheet opens immediately (no loading delay)

---

## 10. Configuration Checklist

Before testing, ensure these are configured:

### iOS Universal Links
- [ ] Apple Developer Account: Add "Associated Domains" capability
- [ ] Update `TEAM_ID` in apple-app-site-association file with actual Team ID
- [ ] Rebuild app with new entitlements

### Android App Links
- [ ] Update `SHA256_FINGERPRINT_HERE` in assetlinks.json with actual fingerprint
  ```bash
  # Get fingerprint from release keystore:
  keytool -list -v -keystore your-release-key.keystore
  ```
- [ ] Rebuild app with updated intent filters

### Environment Variables
- [ ] Verify `BASE_URL` is set correctly in production
- [ ] Verify domain configuration in Expo app.json

---

## Sign-Off

| Tester | Platform | Date | Status |
|--------|----------|------|--------|
| | iOS | | |
| | Android | | |
| | Web (Desktop) | | |
| | Web (Mobile Safari) | | |
| | Web (Mobile Chrome) | | |

---

## Notes

- Universal Links on iOS require HTTPS and valid AASA file
- Android App Links require assetlinks.json file at `/.well-known/assetlinks.json`
- OG meta tags only work for crawlers; regular users see the SPA
- Test with real share to social media, not just debugger tools
