import Constants from 'expo-constants';

export const API_BASE =
  (Constants?.expoConfig as any)?.extra?.apiBase ||
  process.env.EXPO_PUBLIC_API_BASE ||
  '';
