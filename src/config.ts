import Constants from 'expo-constants';

const extra = (Constants.expoConfig as any)?.extra || {};

export function getApiBase(): string {
  // Prefer runtime extra. Expo injects EXPO_PUBLIC_* into manifest.extra as well.
  const base =
    extra.apiBase ||
    extra.EXPO_PUBLIC_API_BASE ||
    process.env.EXPO_PUBLIC_API_BASE ||
    '';

  const normalized = String(base).replace(/\/$/, '');
  return normalized || 'https://api.theconnection.app/api';
}

// GIF Service API Keys (public-tier keys for client-side use)
// These are free/public API keys designed for embedding in apps
// They are rate-limited by the service providers
export const GIF_CONFIG = {
  tenor: {
    apiKey: extra.tenorApiKey || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ',
    baseUrl: 'https://tenor.googleapis.com/v2',
  },
  giphy: {
    apiKey: extra.giphyApiKey || 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh',
    baseUrl: 'https://api.giphy.com/v1/gifs',
  },
};
