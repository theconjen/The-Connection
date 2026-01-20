/**
 * Expo App Configuration
 *
 * This config reads from environment variables for sensitive data.
 * Create a .env file (don't commit it!) with:
 *   GIPHY_API_KEY=your_key_here
 *   SENTRY_DSN=your_dsn_here
 *   API_URL=https://api.theconnection.app/api
 *
 * Expo automatically loads .env files - no explicit import needed.
 */

const IS_DEV = process.env.APP_ENV !== 'production';

export default ({ config }: any) => ({
  ...config,
  name: 'The Connection',
  slug: 'theconnection',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'theconnection',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.theconnection.mobile',
    buildNumber: '5',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'The Connection needs your location to show nearby events and communities.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'The Connection needs your location to show nearby events and communities.',
      NSCameraUsageDescription:
        'The Connection needs access to your camera to upload photos for your profile and posts.',
      NSPhotoLibraryUsageDescription:
        'The Connection needs access to your photo library to upload photos for your profile and posts.',
      NSPhotoLibraryAddUsageDescription:
        'The Connection needs access to save photos to your library.',
      NSCalendarsUsageDescription:
        'The Connection needs access to your calendar to add events you\'re attending.',
      NSUserNotificationsUsageDescription:
        'The Connection needs to send you notifications about community posts, events, and messages.',
      // SECURITY: Disable arbitrary loads in production, only allow for localhost in dev
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
        ...(IS_DEV
          ? {
              NSExceptionDomains: {
                localhost: {
                  NSExceptionAllowsInsecureHTTPLoads: true,
                  NSIncludesSubdomains: true,
                },
              },
            }
          : {}),
      },
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a2a4a',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_CALENDAR',
      'WRITE_CALENDAR',
      'NOTIFICATIONS',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission:
          'The Connection needs access to your photos to share images in posts.',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'The Connection needs your location to show nearby events and add location to posts.',
        locationWhenInUsePermission:
          'The Connection needs your location to show nearby events and add location to posts.',
      },
    ],
    'expo-notifications',
  ],
  extra: {
    // API configuration - REQUIRED in production (no fallback)
    // In dev, falls back to localhost. In production, config validator blocks startup if missing.
    apiBase: process.env.API_URL || '',

    // Giphy API key - REQUIRED in production
    giphyApiKey: process.env.GIPHY_API_KEY || '',

    // Sentry DSN - REQUIRED in production
    sentryDsn: process.env.SENTRY_DSN || '',
    sentryOrg: 'the-connection',
    sentryProject: 'the-connection',

    // Router origin
    router: {
      origin: 'https://app.theconnection.app',
    },

    // EAS project ID
    eas: {
      projectId: 'c11dcfad-026c-4c8d-8dca-bec9e2bc049a',
    },
  },
});
