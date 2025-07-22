# The Connection Mobile App - Deployment Guide

## Prerequisites

Before deploying the mobile app, ensure you have:

1. **Development Environment**
   - Node.js 18+ installed
   - Expo CLI: `npm install -g @expo/cli`
   - EAS CLI: `npm install -g eas-cli`

2. **Developer Accounts**
   - Apple Developer Account ($99/year) for iOS
   - Google Play Developer Account ($25 one-time) for Android

3. **Expo Account**
   - Create account at expo.dev
   - Login: `eas login`

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Endpoint
Update `src/utils/constants.ts`:
```typescript
export const API_CONFIG = {
  baseUrl: 'https://your-production-domain.com/api',
  timeout: 30000,
  retryAttempts: 3,
};
```

### 3. Initialize EAS
```bash
eas init
```

## Building for Production

### iOS Build
```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production
```

### Android Build
```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

### Build Both Platforms
```bash
eas build --platform all --profile production
```

## App Store Configuration

### iOS App Store Connect

1. **Create App Record**
   - Bundle ID: `com.theconnection.mobile`
   - App Name: "The Connection"
   - SKU: `theconnection-mobile-001`

2. **App Information**
   - Primary Category: Social Networking
   - Secondary Category: Lifestyle
   - Content Rating: 4+

3. **App Store Description**
   ```
   The Connection is a faith-based social platform designed to bring believers together through meaningful conversations, prayer, and community support.

   Features:
   • Join faith-based communities
   • Share prayer requests and pray for others
   • Participate in Bible study plans
   • Connect with local believers
   • Ask questions to verified Christian scholars
   • Attend virtual and in-person events

   Build meaningful relationships and grow in your faith with The Connection - where faith meets community.
   ```

4. **Keywords**
   ```
   faith, christian, prayer, bible, community, church, devotional, worship, fellowship, spiritual
   ```

### Google Play Console

1. **App Information**
   - App Name: The Connection
   - Short Description: Faith-based community platform for prayer, Bible study, and fellowship
   - Full Description: [Same as iOS description]
   - Category: Social
   - Content Rating: Everyone

2. **Store Listing**
   - Developer Name: [Your Name/Organization]
   - Developer Email: [Your Contact Email]
   - Privacy Policy URL: https://your-domain.com/privacy-policy
   - Support URL: https://your-domain.com/support

## Submission Process

### iOS Submission
1. Build production version: `eas build --platform ios --profile production`
2. Submit to App Store: `eas submit --platform ios`
3. Configure submission in App Store Connect
4. Submit for review

### Android Submission
1. Build production AAB: `eas build --platform android --profile production`
2. Submit to Play Store: `eas submit --platform android`
3. Create release in Play Console
4. Submit for review

## Required Assets

Create these assets before submission:

### App Icons
- **iOS**: 1024x1024 PNG (no transparency, no rounded corners)
- **Android**: 1024x1024 PNG

### Screenshots
- **iOS**: Various sizes for iPhone and iPad
- **Android**: Phone and tablet screenshots

### Feature Graphic (Android)
- 1024x500 PNG for Play Store listing

## Environment Configuration

### Production Environment Variables
Ensure these are configured for production:

```typescript
// src/utils/constants.ts
export const API_CONFIG = {
  baseUrl: 'https://production-api.theconnection.com/api',
  timeout: 30000,
  retryAttempts: 3,
};
```

### Push Notifications
1. Configure push credentials in Expo Dashboard
2. Test on physical devices
3. Update app.json with notification settings

## Testing Before Submission

### Development Testing
```bash
# Start development server
npx expo start

# Test on simulator/emulator
npx expo start --ios
npx expo start --android
```

### Production Testing
```bash
# Build and test production version
eas build --platform all --profile preview
```

### Manual Testing Checklist
- [ ] User authentication (login/register)
- [ ] Navigation between all screens
- [ ] API connectivity to production server
- [ ] Push notifications
- [ ] Camera/image upload
- [ ] Location permissions
- [ ] Offline handling
- [ ] App crashes/error handling

## Monitoring and Analytics

### Crash Reporting
Consider integrating:
- Sentry for error tracking
- Bugsnag for crash reporting

### Analytics
- Expo Analytics (built-in)
- Firebase Analytics
- Custom analytics for user engagement

## Update Process

### Over-the-Air Updates
```bash
# Publish update without app store review
eas update --branch production
```

### App Store Updates
For native changes requiring app store review:
1. Update version in app.json
2. Build new version: `eas build --platform all --profile production`
3. Submit to stores: `eas submit --platform all`

## Troubleshooting

### Common Build Issues
```bash
# Clear cache and rebuild
npx expo r -c
eas build --clear-cache --platform all
```

### API Connection Issues
- Verify production API URL in constants.ts
- Check CORS settings on backend
- Ensure HTTPS for production

### Push Notification Issues
- Configure credentials in Expo Dashboard
- Test on physical devices only
- Verify permissions in app.json

## Support

For deployment assistance:
- Review Expo documentation: docs.expo.dev
- Check build logs in Expo Dashboard
- Contact support: [your-support-email]

## Security Considerations

- Never commit sensitive data to version control
- Use environment variables for API keys
- Implement proper authentication flows
- Test on physical devices before release
- Review app permissions and data usage