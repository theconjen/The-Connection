# 🚀 Production Deployment Checklist

Use this checklist when you're ready to deploy to App Store / Play Store.

---

## ☑️ Pre-Deployment

### Code Ready
- [ ] All features tested in Expo Go
- [ ] No critical bugs
- [ ] All API endpoints pointing to production
- [ ] Error tracking enabled (Sentry/Bugsnag)
- [ ] Analytics configured (if using)
- [ ] Remove all `console.log` statements
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted

### Assets Ready
- [ ] App icon 1024x1024px (no transparency, no rounded corners)
- [ ] Splash screen 2048x2048px
- [ ] iOS screenshots (6.5", 5.5" required)
- [ ] Android screenshots (phone & tablet)
- [ ] Feature graphic for Play Store (1024x500px)

### Accounts Setup
- [ ] Apple Developer Account ($99/year) - [developer.apple.com](https://developer.apple.com)
- [ ] Google Play Console ($25 one-time) - [play.google.com/console](https://play.google.com/console)
- [ ] Expo account - [expo.dev](https://expo.dev)

### App Store Listings Prepared
- [ ] App name decided
- [ ] Short description (30 chars for iOS, 80 for Android)
- [ ] Full description written
- [ ] Keywords researched (iOS only)
- [ ] Support email
- [ ] Marketing URL
- [ ] Privacy policy URL
- [ ] Age rating determined

---

## 🔨 Building

### 1. Update Version Numbers

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",  // User-facing version
    "ios": {
      "buildNumber": "1"  // Increment each build
    },
    "android": {
      "versionCode": 1    // Increment each build
    }
  }
}
```

### 2. Add Plugins Back to app.json

```json
"plugins": [
  "expo-router",
  "expo-secure-store",
  [
    "expo-location",
    {
      "locationAlwaysAndWhenInUsePermission": "The Connection needs your location to show nearby events and communities."
    }
  ],
  [
    "expo-image-picker",
    {
      "photosPermission": "The Connection needs access to your photos to upload profile pictures and post images.",
      "cameraPermission": "The Connection needs access to your camera to take photos for your profile and posts."
    }
  ],
  [
    "expo-media-library",
    {
      "photosPermission": "The Connection needs access to your photo library.",
      "savePhotosPermission": "The Connection needs permission to save photos."
    }
  ]
]
```

### 3. Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 4. Build Apps

```bash
# iOS
npm run build:ios
# Wait ~15-20 minutes
# Download .ipa when complete

# Android
npm run build:android
# Wait ~10-15 minutes
# Download .aab when complete
```

---

## 📱 iOS Submission

### 1. Create App in App Store Connect
1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+"
3. Fill in:
   - Name: "The Connection"
   - Language: English
   - Bundle ID: app.theconnection.mobile
   - SKU: theconnection-mobile

### 2. Prepare Listing
- [ ] Upload screenshots (6.5" and 5.5" required)
- [ ] App icon (auto-filled from build)
- [ ] Description
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] Category: Social Networking
- [ ] Age Rating: 4+

### 3. Submit Build
```bash
npm run submit:ios
```

Or manually upload in App Store Connect → TestFlight.

### 4. Fill Out Review Information
- [ ] Demo account credentials (if app requires login)
- [ ] Notes for reviewer
- [ ] Contact information

### 5. Submit for Review
Click "Submit for Review" in App Store Connect.

**Wait 1-3 days for approval** ⏰

---

## 📱 Android Submission

### 1. Create App in Play Console
1. Go to [play.google.com/console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - App name: "The Connection"
   - Language: English
   - App or game: App
   - Free or paid: Free

### 2. Complete Questionnaires
- [ ] Store presence → Main store listing
- [ ] Policy → Privacy policy
- [ ] Policy → App access (if login required)
- [ ] Policy → Ads (None if not using)
- [ ] Policy → Content rating
- [ ] Policy → Target audience

### 3. Prepare Listing
- [ ] Upload screenshots (phone & tablet)
- [ ] Feature graphic (1024x500px)
- [ ] App icon (auto-filled from build)
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] Category: Social
- [ ] Contact details

### 4. Submit Build
```bash
npm run submit:android
```

Or manually upload in Play Console → Production → Create new release.

### 5. Complete Release Details
- [ ] Release name: "1.0.0 - Initial Release"
- [ ] Release notes
- [ ] Countries: Worldwide (or select specific)

### 6. Review and Publish
Click "Review release" → "Start rollout to Production"

**Wait 1-3 days for approval** ⏰

---

## 📬 After Submission

### Monitor Status
- [ ] Check email for updates from Apple/Google
- [ ] Check App Store Connect / Play Console dashboards

### Possible Outcomes

#### ✅ Approved
- **iOS**: App appears in App Store within 24 hours
- **Android**: App appears in Play Store within a few hours
- 🎉 **Congratulations!** Your app is live!

#### ❌ Rejected
- Read rejection reason carefully
- Fix the issue
- Increment build number
- Build again
- Resubmit

### Common Rejection Reasons
- Missing privacy policy
- Unclear permission explanations
- App crashes on review
- Missing demo account
- Violates guidelines (spam, inappropriate content)

---

## 🎯 Post-Launch

### Week 1
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Test on multiple devices
- [ ] Fix critical bugs immediately

### Prepare Updates
```bash
# 1. Make changes
# 2. Update version numbers in app.json
# 3. Build new version
npm run build:all

# 4. Submit update
npm run submit:ios
npm run submit:android
```

### For Small Updates (JavaScript only):
```bash
npm run update
# Users get update instantly, no review needed!
```

---

## 📊 Success Metrics

Track these after launch:
- [ ] Downloads per day
- [ ] Active users
- [ ] Retention rate (Day 1, Day 7, Day 30)
- [ ] Crash-free rate (aim for >99%)
- [ ] User ratings and reviews
- [ ] Feature usage

---

## 🆘 Emergency Contacts

- **Apple Review Team**: From App Store Connect
- **Google Play Support**: From Play Console
- **Expo Support**: https://expo.dev/contact
- **Community**: https://forums.expo.dev

---

## 💡 Tips for Faster Approval

### iOS:
- Clear demo account instructions
- Respond quickly to review feedback
- Good screenshots and description
- Test on real device before submitting
- Avoid controversial content

### Android:
- Complete all policy sections
- Clear and accurate descriptions
- Proper content rating
- Privacy policy URL required
- Test on multiple Android versions

---

## 🔄 Version Update Checklist

For each new version:
- [ ] Increment `version` in app.json (e.g., 1.0.0 → 1.0.1)
- [ ] Increment `buildNumber` (iOS) and `versionCode` (Android)
- [ ] Update release notes
- [ ] Test thoroughly
- [ ] Build and submit
- [ ] Monitor for issues

---

## 📱 Current Status

**Right now:**
- ✅ Using Expo Go for development
- ✅ All native features installed
- ✅ EAS configuration ready
- ⏸️ Waiting for production readiness

**When ready to deploy:**
- Use this checklist
- Follow `PRODUCTION_GUIDE.md` for detailed steps
- Budget 1-2 weeks for first submission (including review time)

---

**Good luck with your launch! 🚀**
