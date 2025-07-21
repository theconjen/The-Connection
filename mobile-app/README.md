# The Connection Mobile App

A React Native mobile application converted from the web version of The Connection religious social platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI: `npm install -g @expo/cli`
- For iOS: macOS with Xcode 16+ (required for App Store deployment)
- For Android: Android Studio with API level 35

### Installation

1. **Install dependencies:**
```bash
cd mobile-app/TheConnectionMobile
npm install
```

2. **Start development server:**
```bash
npx expo start
```

3. **Run on devices:**
- iOS: `npx expo start --ios` (requires macOS)
- Android: `npx expo start --android`
- Web: `npx expo start --web`

## 📱 App Store Deployment

### iOS App Store Requirements

#### 1. Apple Developer Account
- Sign up for Apple Developer Program ($99/year)
- Set up certificates and provisioning profiles

#### 2. Update Bundle Identifier
Edit `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.theconnection"
    }
  }
}
```

#### 3. Build for Production
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production
```

#### 4. Submit to App Store
```bash
eas submit --platform ios
```

### Android Google Play Store Requirements

#### 1. Google Play Console Account
- Sign up for Google Play Console ($25 one-time fee)

#### 2. Update Package Name
Edit `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.theconnection"
    }
  }
}
```

#### 3. Build for Production
```bash
# Build for Android
eas build --platform android --profile production
```

#### 4. Submit to Google Play
```bash
eas submit --platform android
```

## 🔧 Configuration

### API Configuration
Update the API endpoint in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'https://your-production-api.com/api';
```

### App Icons and Splash Screen
Replace files in the `assets/` directory:
- `icon.png` - 1024x1024px app icon
- `adaptive-icon.png` - Android adaptive icon
- `splash-icon.png` - Splash screen image

### App Store Assets Required

#### iOS App Store
- App icons: 1024x1024px
- Screenshots for iPhone 15 Pro Max (6.7"), iPhone 15 (6.1"), iPad Pro (12.9")
- App preview videos (optional)
- App description and keywords
- Privacy Policy URL

#### Google Play Store
- High-res icon: 512x512px
- Feature graphic: 1024x500px
- Screenshots for phones and tablets
- Short and full descriptions
- Content rating questionnaire

## 🔐 Environment Setup

### Development
Create `.env.local`:
```
API_BASE_URL=http://localhost:5000/api
ENVIRONMENT=development
```

### Production
Configure in EAS:
```bash
eas secret:create --scope project --name API_BASE_URL --value https://your-api.com/api
eas secret:create --scope project --name ENVIRONMENT --value production
```

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] Remove all console.log statements
- [ ] Test on real devices (iOS and Android)
- [ ] Verify app performance on various device models
- [ ] Test all navigation flows
- [ ] Verify API integration works with production backend

### App Store Compliance
- [ ] App follows platform-specific design guidelines
- [ ] Privacy policy implemented and accessible
- [ ] App handles permissions gracefully
- [ ] Offline functionality (if applicable)
- [ ] No prohibited content or functionality

### Asset Preparation
- [ ] App icons for all required sizes generated
- [ ] Screenshots captured on latest devices
- [ ] App Store descriptions written
- [ ] Metadata translated (if targeting multiple regions)

## 🚀 Build Commands

### Development Build
```bash
npx expo start
```

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android  
eas build --platform android --profile production

# Both platforms
eas build --platform all --profile production
```

### Submit to Stores
```bash
# iOS App Store
eas submit --platform ios --latest

# Google Play Store
eas submit --platform android --latest
```

## 📱 App Store Guidelines

### iOS App Store Review Guidelines
- Follow Apple's Human Interface Guidelines
- Implement proper error handling
- Handle network failures gracefully
- Respect user privacy and data
- No crashes or major bugs

### Google Play Policy
- Target latest Android API level (35 for 2025)
- Follow Material Design principles
- Implement proper permissions
- Handle Android back button correctly
- Test on various screen sizes

## 🔄 Update Strategy

### Over-the-Air Updates (OTA)
```bash
# Configure EAS Update
eas update:configure

# Publish update
eas update --branch production --message "Bug fixes and improvements"
```

### App Store Updates
For major changes requiring new builds:
1. Update version in `app.json`
2. Build new version with EAS
3. Submit to app stores for review

## 📊 Analytics & Monitoring

### App Performance
- Integrate Expo Analytics
- Monitor crash reports
- Track user engagement

### Production Monitoring
- Set up error reporting (Sentry)
- Monitor API response times
- Track conversion rates

## 🛠 Troubleshooting

### Common Issues
1. **Build Failures**: Check dependencies and versions
2. **App Store Rejection**: Review guidelines and fix issues
3. **Performance Issues**: Profile and optimize code
4. **API Issues**: Verify backend connectivity

### Support Resources
- Expo Documentation: https://docs.expo.dev
- React Native Documentation: https://reactnative.dev
- Apple Developer Support
- Google Play Console Help

---

## 🎯 Next Steps for App Store Success

1. **Complete the mobile app development** by installing dependencies
2. **Set up proper backend API** with HTTPS and authentication
3. **Create App Store assets** (icons, screenshots, descriptions)
4. **Test thoroughly** on physical devices
5. **Submit for review** following platform guidelines
6. **Monitor and iterate** based on user feedback

The mobile app is ready for App Store deployment with proper configuration and testing.