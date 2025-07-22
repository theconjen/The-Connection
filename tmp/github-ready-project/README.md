# The Connection Mobile App

<div align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.72-blue.svg" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-49.0-000000.svg" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</div>

## Overview

The Connection is a React Native mobile application designed to bring believers together through meaningful conversations, prayer, and community support. Built with Expo and TypeScript, the app provides a comprehensive faith-based social platform optimized for mobile devices.

## Features

### 🏠 **Community Hub**
- Join faith-based communities and groups
- Connect with local believers
- Participate in discussions and fellowship

### 🙏 **Prayer Network**
- Share prayer requests with the community
- Pray for others and track prayer counts
- Anonymous prayer request options

### 📱 **Social Feed**
- Share thoughts, scripture, and encouragement
- Like and comment on posts
- Follow community conversations

### 📖 **Bible Study Tools**
- Access structured Bible reading plans
- Daily devotional content
- Study tools and resources

### ❓ **Apologetics Q&A**
- Ask faith-related questions
- Get answers from verified Christian scholars
- Browse popular questions and expert responses

### 📅 **Events & Gatherings**
- Discover virtual and in-person events
- Join community gatherings
- RSVP to church events and activities

### 👤 **Personal Profile**
- Customize your faith journey profile
- Track your spiritual growth
- Manage privacy settings

## Technical Stack

### Frontend
- **React Native 0.72** - Cross-platform mobile development
- **Expo 49.0** - Development and deployment platform
- **TypeScript 5.0** - Type-safe JavaScript
- **React Navigation 6** - Native navigation with bottom tabs
- **React Query** - Server state management
- **Expo Linear Gradient** - Beautiful gradient UI elements

### Backend Integration
- **RESTful API** - Clean API integration
- **AsyncStorage** - Local data persistence
- **Socket.io** - Real-time messaging support
- **Image Upload** - Photo sharing capabilities

### UI/UX
- **Native Components** - Platform-specific look and feel
- **Haptic Feedback** - Enhanced touch interactions
- **Pull-to-Refresh** - Native refresh patterns
- **Dark/Light Mode** - System theme support
- **Responsive Design** - Works on phones and tablets

## Project Structure

```
TheConnectionMobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── FeatureCard.tsx
│   │   ├── FloatingActionButton.tsx
│   │   ├── MobileCard.tsx
│   │   └── TouchFeedback.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.tsx
│   ├── navigation/          # App navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/             # App screens
│   │   ├── AuthScreen.tsx
│   │   ├── OptimizedHomeScreen.tsx
│   │   ├── CommunitiesScreen.tsx
│   │   ├── MicroblogsScreen.tsx
│   │   ├── PrayerRequestsScreen.tsx
│   │   ├── EventsScreen.tsx
│   │   ├── BibleStudyScreen.tsx
│   │   ├── ApologeticsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/            # API and external services
│   │   └── api.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── utils/               # Utility functions and constants
│       └── constants.ts
├── assets/                  # Images, icons, and media
├── docs/                    # Documentation
├── app.json                 # Expo configuration
├── eas.json                 # Build configuration
├── package.json             # Dependencies and scripts
└── App.tsx                  # App entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/the-connection-mobile.git
cd the-connection-mobile/TheConnectionMobile

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Development

```bash
# Start with specific platform
npx expo start --ios        # iOS Simulator
npx expo start --android    # Android Emulator
npx expo start --web        # Web browser

# Clear cache and restart
npx expo r -c
```

## Configuration

### API Setup

Update `src/utils/constants.ts` with your backend API URL:

```typescript
export const API_CONFIG = {
  baseUrl: 'https://your-api-domain.com/api',
  timeout: 30000,
  retryAttempts: 3,
};
```

### App Configuration

Key settings in `app.json`:
- **Bundle ID**: `com.theconnection.mobile`
- **App Name**: The Connection
- **Version**: 1.0.0
- **Orientation**: Portrait
- **Icon**: `./assets/icon.png`

## Building for Production

### Prerequisites for App Store Submission

- Apple Developer Account (iOS)
- Google Play Developer Account (Android)
- Expo account and EAS CLI

### Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both platforms
eas build --platform all
```

## App Store Information

### iOS App Store
- **Bundle ID**: `com.theconnection.mobile`
- **Category**: Social Networking
- **Content Rating**: 4+
- **Supports**: iPhone and iPad

### Google Play Store
- **Package Name**: `com.theconnection.mobile`
- **Category**: Social
- **Content Rating**: Everyone
- **Target SDK**: 33+

## Screenshots & Marketing

### App Store Description
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

### Keywords
`faith, christian, prayer, bible, community, church, devotional, worship, fellowship, spiritual`

## Testing

### Manual Testing Checklist
- [ ] User authentication (login/register)
- [ ] Navigation between all screens
- [ ] API connectivity
- [ ] Pull-to-refresh functionality
- [ ] Image upload and display
- [ ] Push notifications
- [ ] Offline handling
- [ ] Device permissions

### Automated Testing
```bash
# Run TypeScript checks
npx tsc --noEmit

# Run linting
npx expo lint

# Run tests (if configured)
npm test
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions including:
- App Store Connect setup
- Google Play Console configuration
- Asset requirements
- Submission process

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful component names
- Implement proper error handling
- Test on both iOS and Android
- Follow React Native performance guidelines
- Ensure accessibility compliance

## Architecture Decisions

### Why React Native + Expo?
- **Cross-platform** - Single codebase for iOS and Android
- **Fast development** - Hot reloading and debugging tools
- **Native performance** - JavaScript bridge with native modules
- **Easy deployment** - Expo build and update services

### State Management
- **React Query** for server state
- **React Context** for authentication
- **AsyncStorage** for local persistence
- **React Hooks** for component state

### Navigation
- **React Navigation 6** with bottom tabs
- **Stack navigation** for authentication flow
- **Deep linking** support for notifications

## Performance Optimizations

- Lazy loading of screens
- Image optimization and caching
- API request optimization
- Memory leak prevention
- Battery usage optimization

## Security Considerations

- Secure API token storage
- Input validation and sanitization
- Network security (HTTPS only)
- Biometric authentication support
- Privacy-compliant data handling

## Roadmap

### Version 1.1
- [ ] Push notifications
- [ ] Offline mode
- [ ] Enhanced search
- [ ] Voice messages

### Version 1.2
- [ ] Live streaming events
- [ ] Advanced privacy controls
- [ ] Multiple language support
- [ ] Accessibility improvements

## Support

- **Documentation**: [GitHub Wiki](https://github.com/yourusername/the-connection-mobile/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/the-connection-mobile/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/the-connection-mobile/discussions)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Expo team for the amazing development platform
- React Native community for ongoing support
- All beta testers and early adopters
- The faith community for inspiration and feedback

---

Built with ❤️ for the faith community