# The Connection - Production Testing Checklist

**Version:** 1.0.0
**Date:** 2026-01-15
**Tester:** _________________

---

## Pre-Testing Setup

- [ ] Production build installed on iPhone via TestFlight
- [ ] Test with a **real email address** you can access
- [ ] Clear any existing test data
- [ ] Check backend is deployed: https://api.theconnection.app/api/health

---

## 1. REGISTRATION FLOW (Critical)

### Test Account 1: New User Registration

**Test Data:**
- Email: ___________________________
- Username: ___________________________
- Password: ___________________________

**Steps:**
- [ ] Open app
- [ ] Tap "Sign Up" / "Create Account"
- [ ] Enter email, username, password
- [ ] Tap "Create Account"
- [ ] **EXPECTED:** Account created successfully
- [ ] **EXPECTED:** Automatically logged in
- [ ] **EXPECTED:** Redirected to onboarding

**Email Verification:**
- [ ] Check inbox for verification email
- [ ] Email received within 1 minute
- [ ] Subject line is clear and professional
- [ ] Sender shows "The Connection" or noreply@theconnection.app
- [ ] Verification link is clickable
- [ ] Click link → Opens success page
- [ ] **EXPECTED:** "Email Verified" message

**Issues Found:**
```
[Write any issues here]
```

---

## 2. ONBOARDING FLOW (Critical)

**Step 1: Welcome Screen**
- [ ] Welcome message displays
- [ ] Christian values statement visible
- [ ] Bible reference mentioned
- [ ] "Continue" button works

**Step 2: Profile Setup**
- [ ] Display name input works
- [ ] Photo upload option available (test optional)
- [ ] Location field works
- [ ] Bio field works
- [ ] Progress shows "Step 1 of 3"
- [ ] Can proceed to next step

**Step 3: Faith Background**
- [ ] Denomination dropdown shows options
- [ ] Can select multiple interests
- [ ] Home church field works
- [ ] Bible verse field works
- [ ] Progress shows "Step 2 of 3"
- [ ] Can proceed to next step

**Step 4: Community Discovery**
- [ ] Shows list of communities
- [ ] Can join communities
- [ ] Join button changes to "Joined"
- [ ] Progress shows "Step 3 of 3"
- [ ] "Complete Setup" button works
- [ ] **EXPECTED:** Redirected to main feed

**Verify in Database:**
- [ ] Check Neon console: `SELECT onboardingCompleted FROM users WHERE email = 'test@email.com'`
- [ ] **EXPECTED:** `onboardingCompleted = true`

**Issues Found:**
```
[Write any issues here]
```

---

## 3. AUTHENTICATION FLOW (Critical)

### Logout & Login

**Logout:**
- [ ] Open menu/profile
- [ ] Tap "Logout"
- [ ] **EXPECTED:** Redirected to login screen
- [ ] **EXPECTED:** No user data visible

**Login:**
- [ ] Enter username and password
- [ ] Tap "Sign In"
- [ ] **EXPECTED:** Login successful
- [ ] **EXPECTED:** Redirected to feed (NOT onboarding)
- [ ] **EXPECTED:** User data loads correctly

**Failed Login:**
- [ ] Try wrong password
- [ ] **EXPECTED:** "Invalid credentials" error
- [ ] **EXPECTED:** Not locked out after 1 attempt

**Issues Found:**
```
[Write any issues here]
```

---

## 4. CORE FEATURES

### 4.1 Create a Post

- [ ] Tap "+" or "Create" button
- [ ] Enter post content (min 10 characters)
- [ ] Select community (optional)
- [ ] Add hashtags (test: #faith #prayer)
- [ ] Tap "Post"
- [ ] **EXPECTED:** Post appears in feed
- [ ] **EXPECTED:** Shows your profile picture and name

### 4.2 Communities

**Browse:**
- [ ] Open Communities tab
- [ ] See list of communities
- [ ] Community cards show name, description, member count

**Join:**
- [ ] Tap "Join" on a community
- [ ] **EXPECTED:** Button changes to "Joined"
- [ ] **EXPECTED:** Community appears in "My Communities"

**View:**
- [ ] Tap on joined community
- [ ] See community feed
- [ ] See members list
- [ ] See community events

**Leave:**
- [ ] Tap "Leave Community"
- [ ] Confirm
- [ ] **EXPECTED:** Removed from community

### 4.3 Direct Messages

**Send DM:**
- [ ] Find another user (or use test account)
- [ ] Tap "Message"
- [ ] Type message
- [ ] Send
- [ ] **EXPECTED:** Message appears in conversation

**Receive DM:**
- [ ] (Use second device/account to send you a message)
- [ ] **EXPECTED:** Push notification received
- [ ] **EXPECTED:** Message appears in DM inbox
- [ ] **EXPECTED:** Can reply

### 4.4 Events

**Create Event:**
- [ ] Open Events tab
- [ ] Tap "Create Event"
- [ ] Fill in title, description, date/time
- [ ] Add location (optional)
- [ ] Select community
- [ ] Tap "Create"
- [ ] **EXPECTED:** Event created

**RSVP:**
- [ ] Find an event
- [ ] Tap "RSVP" / "Attend"
- [ ] **EXPECTED:** Status shows "Attending"

**View on Map:**
- [ ] Events with location show on map
- [ ] Tap marker opens event details

### 4.5 Prayer Requests

**Submit:**
- [ ] Go to Prayer Requests
- [ ] Tap "New Request"
- [ ] Enter title and description
- [ ] Select privacy (public/community/private)
- [ ] Submit
- [ ] **EXPECTED:** Appears in feed

**Pray:**
- [ ] Find a prayer request
- [ ] Tap "I Prayed" or "Pray"
- [ ] **EXPECTED:** Prayer count increases

**Issues Found:**
```
[Write any issues here]
```

---

## 5. PROFILE & ACCOUNT MANAGEMENT

### View Profile

- [ ] Tap profile/avatar
- [ ] See your username, bio, stats
- [ ] See your posts
- [ ] See joined communities

### Edit Profile

- [ ] Tap "Edit Profile"
- [ ] Change display name
- [ ] Update bio
- [ ] Change profile picture (test upload)
- [ ] Save changes
- [ ] **EXPECTED:** Changes reflect immediately

### Settings

- [ ] Open Settings
- [ ] Toggle notifications on/off
- [ ] Change privacy settings
- [ ] Update email preferences

### Delete Account (CRITICAL for Apple)

- [ ] Go to Settings → Delete Account
- [ ] Read warnings
- [ ] Check "I understand" box
- [ ] Type "DELETE" in confirmation field
- [ ] Enter password
- [ ] Tap "Delete My Account Permanently"
- [ ] Confirm in alert
- [ ] **EXPECTED:** Account deleted
- [ ] **EXPECTED:** Logged out
- [ ] **VERIFY:** User removed from Neon database

**Issues Found:**
```
[Write any issues here]
```

---

## 6. PUSH NOTIFICATIONS

**Setup:**
- [ ] App requests notification permission on first launch
- [ ] Grant permission

**Test Notification Types:**
- [ ] New DM notification
- [ ] Community post notification
- [ ] Event reminder notification
- [ ] Reply to your post notification

**Verify:**
- [ ] Notifications appear on lock screen
- [ ] Tapping notification opens relevant screen
- [ ] Badge count updates correctly

**Issues Found:**
```
[Write any issues here]
```

---

## 7. EDGE CASES & ERROR HANDLING

### Network Issues

- [ ] Turn on Airplane Mode
- [ ] Try to load feed
- [ ] **EXPECTED:** Graceful error message
- [ ] Turn off Airplane Mode
- [ ] **EXPECTED:** App recovers and loads data

### Invalid Input

- [ ] Try to create post with only spaces
- [ ] **EXPECTED:** Validation error
- [ ] Try to register with taken username
- [ ] **EXPECTED:** Clear error message

### Long Content

- [ ] Create post with 500+ characters
- [ ] **EXPECTED:** Displays correctly with "Read More"
- [ ] Post with multiple hashtags
- [ ] **EXPECTED:** All hashtags clickable

**Issues Found:**
```
[Write any issues here]
```

---

## 8. PERFORMANCE

- [ ] App launches in < 3 seconds
- [ ] Feed loads in < 2 seconds
- [ ] Scrolling is smooth (60fps)
- [ ] No crashes during normal usage
- [ ] No memory warnings
- [ ] Battery drain is reasonable

**Issues Found:**
```
[Write any issues here]
```

---

## 9. UI/UX REVIEW

### Visual Polish

- [ ] All icons display correctly
- [ ] No broken images
- [ ] Text is readable (font size, contrast)
- [ ] Buttons are clearly labeled
- [ ] Loading states show spinners

### Navigation

- [ ] Back button works on all screens
- [ ] Tab bar navigation is intuitive
- [ ] Deep linking works (from email verification)

### Accessibility

- [ ] All interactive elements are tappable (44x44pt minimum)
- [ ] Color contrast meets WCAG AA standards
- [ ] VoiceOver works on key screens (optional but good)

**Issues Found:**
```
[Write any issues here]
```

---

## 10. FINAL CHECKS

- [ ] Privacy Policy is accessible from signup
- [ ] Terms of Service is accessible from signup
- [ ] Contact/Support email is visible
- [ ] App version shows "1.0.0"
- [ ] No console errors in production

---

## TEST SUMMARY

**Total Issues Found:** _______

**Critical Issues (blocking launch):** _______

**Minor Issues (can fix later):** _______

**Overall Assessment:**
- [ ] Ready for App Store submission
- [ ] Needs fixes before submission
- [ ] Major issues - not ready

**Tester Notes:**
```
[Any additional comments or observations]
```

---

## Bug Reporting Template

If you find bugs, report them like this:

```
BUG #1
Title: [Brief description]
Severity: Critical / High / Medium / Low
Steps to Reproduce:
1.
2.
3.
Expected:
Actual:
Screenshot/Video: [link if available]
```
