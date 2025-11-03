import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  platforms: ['ios', 'android'], // disable web builds
  name: 'The Connection',
  slug: 'the-connection',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  assetBundlePatterns: ['**/*'],
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  plugins: ['expo-router'],
  updates: {
    url: 'https://u.expo.dev/c11dcfad-026c-4c8d-8dca-bec9e2bc049a',
  },
  ios: {
    bundleIdentifier: process.env.EXPO_IOS_BUNDLE_ID ?? 'com.theconnection.app',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: 'Used for profile picture uploads and community media posts.',
      NSPhotoLibraryUsageDescription: 'Used for selecting photos to share in communities.',
    },
  },
  android: {
    package: process.env.EXPO_ANDROID_PACKAGE ?? 'com.theconnection.app',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
  },
  extra: {
    apiBase: process.env.EXPO_PUBLIC_API_BASE,
    eas: {
      projectId: 'c11dcfad-026c-4c8d-8dca-bec9e2bc049a',
    },
  },
  runtimeVersion: { policy: 'sdkVersion' },
});
