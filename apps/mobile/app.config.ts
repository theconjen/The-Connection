import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  plugins: ['expo-router'],
  extra: {
    apiBase: process.env.EXPO_PUBLIC_API_BASE,
  },
  runtimeVersion: { policy: 'sdkVersion' },
});
