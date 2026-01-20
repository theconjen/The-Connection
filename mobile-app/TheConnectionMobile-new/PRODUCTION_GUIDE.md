# Production Deployment Guide

## Overview

Moving from Expo Go (development) to App Store/Play Store (production).

---

## 🎯 Current State: Development with Expo Go

**What you're using now:**
- `npx expo start` → Expo Go app
- Fast development, hot reload
- No native builds needed
- Perfect for development ✅

---

## 🚀 Path to Production

### Step 1: Install EAS CLI (Expo Application Services)

```bash
npm install -g eas-cli
eas login
```

**What is EAS?**
- Cloud build service (builds your app on Expo's servers)
- Handles all the complex native code compilation
- Fixes compatibility issues automatically
- Much easier than local builds

### Step 2: Configure Your Project

```bash
eas build:configure
```

This creates `eas.json` (already done ✅) with build profiles:
- **development**: For testing native features
- **preview**: For internal testing
- **production**: For App Store/Play Store

### Step 3: Update app.json for Production

Add the plugin configurations back (EAS handles them properly):

```json
{
  "expo": {
    "name": "The Connection",
    "slug": "theconnection",
    "version": "1.0.0",

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
          "photosPermission": "The Connection needs access to your photos.",
          "cameraPermission": "The Connection needs access to your camera."
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "The Connection needs access to your photo library."
        }
      ]
    ],

    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "app.theconnection.mobile",
      "buildNumber": "5"  // Increment this for each build
    },

    "android": {
      "package": "app.theconnection.mobile",
      "versionCode": 5,  // Increment this for each build
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### Step 4: Create Production Builds

#### iOS Build:

```bash
# First build (generates .ipa file)
eas build --platform ios --profile production

# This will:
# 1. Upload your code to EAS servers
# 2. Install all dependencies
# 3. Run expo prebuild (generates native code)
# 4. Compile with Xcode
# 5. Generate signed .ipa file
# 6. Give you a download link

# Time: ~15-20 minutes
```

#### Android Build:

```bash
# First build (generates .aab file for Play Store)
eas build --platform android --profile production

# For APK (for direct install/testing):
eas build --platform android --profile preview

# Time: ~10-15 minutes
```

### Step 5: Test Before Submission

#### iOS Testing (TestFlight):

```bash
# Submit to TestFlight for internal testing
eas submit --platform ios --latest
```

Then invite testers via App Store Connect → TestFlight.

#### Android Testing:

```bash
# Submit to Play Store internal testing
eas submit --platform android --latest
```

Or download APK and install directly.

### Step 6: Submit to App Stores

#### iOS App Store:

1. **Apple Developer Account** ($99/year)
2. **Create app in App Store Connect:**
   - App name: "The Connection"
   - Bundle ID: app.theconnection.mobile
   - Screenshots, description, etc.

3. **Submit for review:**
```bash
eas submit --platform ios
```

4. **Apple Review** (1-3 days usually)
5. **Go Live!** 🎉

#### Google Play Store:

1. **Google Play Console** ($25 one-time)
2. **Create app listing:**
   - App name: "The Connection"
   - Package name: app.theconnection.mobile
   - Screenshots, description, etc.

3. **Submit for review:**
```bash
eas submit --platform android
```

4. **Google Review** (1-3 days usually)
5. **Go Live!** 🎉

---

## 🔧 Fixing the expo-device Build Error

The error you saw is fixed by using EAS Build, but if you ever need to build locally:

### Update expo-device:

```bash
npm install expo-device@latest
```

### Or patch the file manually:

**node_modules/expo-device/ios/UIDevice.swift** (line 188):
```swift
// Replace:
return TARGET_OS_SIMULATOR != 0

// With:
#if targetEnvironment(simulator)
  return true
#else
  return false
#endif
```

**But don't do this!** EAS Build handles it automatically.

---

## 📋 Pre-Production Checklist

### Assets:
- [ ] App icon (1024x1024px)
- [ ] Splash screen (2048x2048px)
- [ ] Screenshots for both iOS and Android
- [ ] App Store screenshots (6.5" and 5.5" for iOS)
- [ ] Play Store graphics (feature graphic, etc.)

### App Store Metadata:
- [ ] App name
- [ ] Description (short & full)
- [ ] Keywords
- [ ] Category
- [ ] Age rating
- [ ] Privacy policy URL
- [ ] Support URL

### Code:
- [ ] Increment version numbers (buildNumber/versionCode)
- [ ] Test all features thoroughly
- [ ] Remove console.logs
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Set API endpoints to production URLs
- [ ] Test on real devices (not just simulator)

### Accounts:
- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Developer Account ($25 one-time)
- [ ] Expo account (free for basic, paid for teams)

---

## 💰 Cost Breakdown

### Free Tier (Good for testing):
- Expo EAS: Free tier includes 30 builds/month
- Development: $0

### Paid (For production):
- Apple Developer: $99/year
- Google Play: $25 one-time
- Expo EAS Production: $29/month (unlimited builds)

**Total Year 1**: ~$475 ($99 + $25 + $29×12)

---

## 🔄 Update Workflow (After Launch)

```bash
# 1. Make code changes
# 2. Test in Expo Go
# 3. Increment version numbers in app.json
# 4. Build new version
eas build --platform all --profile production

# 5. Submit update
eas submit --platform all

# 6. Users get update in 1-3 days (after review)
```

### Over-the-Air (OTA) Updates:

For JavaScript-only changes (no native code):

```bash
eas update --branch production --message "Bug fixes"
```

Users get updates instantly without app store review! 🚀

---

## 📱 Development Build (Optional But Recommended)

Before production, create a development build to test native features:

```bash
# Install dev client
npm install expo-dev-client

# Build development version
eas build --profile development --platform ios

# Install on your device via link/QR code
# Now you can test all native features without Expo Go
```

**Benefits:**
- Test real native code
- Debug native issues
- Still has fast refresh
- More like production environment

---

## 🆘 Common Issues & Solutions

### Build Fails with "No bundle identifier":
- Make sure `bundleIdentifier` (iOS) and `package` (Android) are set in app.json

### "Provisioning profile error" (iOS):
- EAS handles this automatically
- Or manually create in Apple Developer Portal

### "Keystore error" (Android):
- EAS creates and manages keystores automatically
- Stored securely in your Expo account

### App rejected for "Location permission explanation":
- Make sure your permission messages are clear and specific
- Explain exactly why you need each permission

### Build times too long:
- Upgrade to paid Expo plan for faster build servers
- Use `resourceClass: "m-medium"` or higher in eas.json

---

## 📚 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Review Guidelines](https://play.google.com/console/about/guides/releasewithconfidence/)
- [Expo Application Services](https://expo.dev/eas)

---

## 🎯 TL;DR - Quick Production Steps

```bash
# 1. Install EAS
npm install -g eas-cli
eas login

# 2. Configure
eas build:configure

# 3. Build for production
eas build --platform ios --profile production
eas build --platform android --profile production

# 4. Download and test

# 5. Submit to stores
eas submit --platform ios
eas submit --platform android

# 6. Wait for approval (1-3 days)

# 7. 🎉 Your app is live!
```

---

## Next Steps

**Right Now (Development):**
- Keep using Expo Go
- `npx expo start`
- Fast development

**When Features Are Complete:**
- Create development build
- Test thoroughly on real devices

**When Ready to Launch:**
- Follow this guide
- Build with EAS
- Submit to stores
- Go live!

**After Launch:**
- Monitor crashes/errors
- Push updates via EAS Update
- Iterate and improve

---

**You're currently in Stage 1 (Development). When you're ready for Stage 2 or 3, come back to this guide!** 📱✨
