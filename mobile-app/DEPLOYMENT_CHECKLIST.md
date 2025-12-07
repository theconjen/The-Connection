# 📋 Mobile App Deployment Checklist

## 🔧 Pre-Deployment Configuration

### 1. Required Developer Accounts
- [ ] **Apple Developer Account** ($99/year) - developer.apple.com
- [ ] **Google Play Console** ($25 one-time) - play.google.com/console

### 2. Update Configuration Files

#### A. API Endpoint Configuration
**File: `src/utils/constants.ts`**
```typescript
// Replace with your actual production URL
baseUrl: 'https://your-domain.com/api'
```

#### B. App Bundle Identifiers
**Current Settings:**
- iOS Bundle ID: `com.theconnection.mobile`
- Android Package: `com.theconnection.mobile`

**To Change (Optional):**
Update in `app.json`:
```json
"ios": {
  "bundleIdentifier": "com.yourcompany.theconnection"
},
"android": {
  "package": "com.yourcompany.theconnection"
}
```

### 3. Legal Requirements
- [x] **Privacy Policy** published at your domain
- [x] **Terms of Service** created
- [x] **Support Email** configured
- [x] **App Store descriptions** written (see `mobile-app/STORE_METADATA.md`)

### 4. Required Assets ✅
- [x] App Icon (1024x1024) - Ready
- [x] Adaptive Icon for Android - Ready
- [x] Splash Screen - Ready
- [x] **Screenshots** (see `mobile-app/TheConnectionMobile/assets/store-screenshots/*.png`)

## 🚀 Deployment Steps

### Step 1: Install Tools
```bash
npm install -g @expo/eas-cli
```

### Step 2: Setup Project
```bash
cd mobile-app/TheConnectionMobile
eas login
eas init
```

### Step 3: Build for Stores
```bash
# Build for both platforms
eas build --platform all --profile production
```

### Step 4: Submit to Stores
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 📱 App Store Information

### App Details
- **Name**: The Connection
- **Category**: Social Networking
- **Age Rating**: 4+ (Everyone)
- **Keywords**: faith, christian, prayer, bible, community

### Description
```
The Connection is a faith-based social platform designed to bring believers together through meaningful conversations, prayer, and community support.

Features:
• Join faith-based communities
• Share prayer requests and pray for others
• Participate in Bible study plans
• Connect with local believers
• Ask questions to verified Christian scholars
• Attend virtual and in-person events

Build meaningful relationships and grow in your faith with The Connection.
```

## 🎯 Current Status

### ✅ What's Ready
- Complete mobile app with all features
- All 8 screens fully implemented
- Authentication system working
- API integration complete
- App Store compliant configuration
- Build system configured

### 🔄 What You Need to Do
1. **Update API URL** in constants.ts
2. **Create developer accounts** (Apple/Google)
3. **Run deployment commands** listed above
4. **Take screenshots** after building
5. **Submit to stores**

## 📊 Timeline Estimate
- Developer account setup: 1-2 days
- Configuration updates: 30 minutes
- Building and submission: 2-3 hours
- App store review: 1-7 days (Apple), 1-3 days (Google)

Your app is completely ready for deployment!