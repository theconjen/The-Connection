import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    apiBase: process.env.EXPO_PUBLIC_API_BASE,
  },
  runtimeVersion: { policy: 'sdkVersion' },
});
