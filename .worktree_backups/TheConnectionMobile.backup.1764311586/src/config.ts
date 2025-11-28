import Constants from 'expo-constants';

export function getApiBase(): string {
  // Prefer runtime extra. Expo injects EXPO_PUBLIC_* into manifest.extra as well.
  const extra = (Constants.expoConfig as any)?.extra || {};
  const base = extra.apiBase || extra.EXPO_PUBLIC_API_BASE || '';
  return String(base).replace(/\/$/, '');
}
