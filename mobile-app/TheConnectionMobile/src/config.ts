import Constants from 'expo-constants';

export function getApiBase(): string {
  // Prefer runtime extra. Expo injects EXPO_PUBLIC_* into manifest.extra as well.
  const extra = (Constants.expoConfig as any)?.extra || {};
  const fallbackDevBase = extra.apiBaseDefaults?.development || 'http://localhost:3000/api';
  const base = sanitizeBase(
    extra.apiBase || extra.EXPO_PUBLIC_API_BASE || process.env.EXPO_PUBLIC_API_BASE || ''
  );

  const resolved = base || (__DEV__ ? sanitizeBase(fallbackDevBase) : '');

  if (!resolved) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE is missing. Set it via eas.json or app.json extra.apiBase before building.'
    );
  }

  if (!__DEV__ && isLocalhost(resolved)) {
    throw new Error(
      `EXPO_PUBLIC_API_BASE cannot point to localhost (${resolved}) for non-development builds. Use the preview or production API.`
    );
  }

  return resolved;
}

function sanitizeBase(value?: string): string {
  return value ? String(value).trim().replace(/\/$/, '') : '';
}

function isLocalhost(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname.startsWith('127.');
  } catch (err) {
    // If the URL is invalid, treat it as misconfiguration for non-dev builds via the empty check above
    return false;
  }
}
