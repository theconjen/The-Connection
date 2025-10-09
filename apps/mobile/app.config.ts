import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: 'The Connection',
  slug: 'the-connection',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  plugins: ['expo-router'],
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
  extra: { apiBase: process.env.EXPO_PUBLIC_API_BASE },
  runtimeVersion: { policy: 'sdkVersion' },
});
