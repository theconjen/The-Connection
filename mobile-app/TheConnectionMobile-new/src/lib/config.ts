/**
 * Configuration Validator
 *
 * PRODUCTION HARDENING: Validates all required config at startup.
 * In production builds, missing config BLOCKS the app from loading.
 */

import Constants from 'expo-constants';

export interface AppConfig {
  apiBase: string;
  giphyApiKey: string;
  sentryDsn: string;
}

// Track if validation has been performed
let configValidated = false;
let validatedConfig: AppConfig | null = null;
let configErrors: string[] = [];

/**
 * Get a config value from Expo constants
 */
function getConfigValue(key: string): string | undefined {
  return (Constants.expoConfig?.extra as any)?.[key];
}

/**
 * Validate all required configuration.
 * Returns errors array - empty if all config is valid.
 */
export function validateConfig(): string[] {
  const errors: string[] = [];

  const apiBase = getConfigValue('apiBase');
  const giphyApiKey = getConfigValue('giphyApiKey');
  const sentryDsn = getConfigValue('sentryDsn');

  // API URL is REQUIRED in production
  if (!apiBase) {
    if (__DEV__) {
      // In dev, warn but allow localhost fallback
    } else {
      errors.push('API_URL is not configured. App cannot start.');
    }
  }

  // GIPHY key is required for GIF functionality
  if (!giphyApiKey) {
    if (!__DEV__) {
      errors.push('GIPHY_API_KEY is not configured. GIF picker will not work.');
    }
  }

  // Sentry DSN is required for error tracking
  if (!sentryDsn) {
    if (!__DEV__) {
      errors.push('SENTRY_DSN is not configured. Error tracking will not work.');
    }
  }

  return errors;
}

/**
 * Get validated config. Throws if config is invalid in production.
 */
export function getConfig(): AppConfig {
  if (!configValidated) {
    configErrors = validateConfig();
    configValidated = true;

    if (configErrors.length > 0 && !__DEV__) {
      // In production, this is a fatal error
      throw new Error(`Configuration Error:\n${configErrors.join('\n')}`);
    }

    validatedConfig = {
      apiBase: getConfigValue('apiBase') || (__DEV__ ? 'http://localhost:5001' : ''),
      giphyApiKey: getConfigValue('giphyApiKey') || '',
      sentryDsn: getConfigValue('sentryDsn') || '',
    };
  }

  return validatedConfig!;
}

/**
 * Check if config is valid (for UI display)
 */
export function isConfigValid(): boolean {
  if (!configValidated) {
    configErrors = validateConfig();
    configValidated = true;
  }
  return configErrors.length === 0;
}

/**
 * Get config errors (for error screen display)
 */
export function getConfigErrors(): string[] {
  if (!configValidated) {
    configErrors = validateConfig();
    configValidated = true;
  }
  return configErrors;
}

/**
 * Check if a specific feature is available based on config
 */
export function isFeatureAvailable(feature: 'giphy' | 'sentry' | 'api'): boolean {
  const config = getConfig();
  switch (feature) {
    case 'giphy':
      return !!config.giphyApiKey;
    case 'sentry':
      return !!config.sentryDsn;
    case 'api':
      return !!config.apiBase;
    default:
      return false;
  }
}
