import Constants from 'expo-constants';

const getSentryDsn = (): string => {
  const extra = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra ?? {};
  return extra.sentryDsn || extra.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN || '';
};

let initializationAttempted = false;
let sentryClient: any = null;

const initSentry = () => {
  if (initializationAttempted) {
    return sentryClient;
  }

  initializationAttempted = true;
  const dsn = getSentryDsn();
  if (!dsn) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('sentry-expo');
    Sentry.init({
      dsn,
      enableInExpoDevelopment: false,
      debug: __DEV__,
    });
    sentryClient = Sentry;
  } catch (error) {
    if (__DEV__) {
      console.warn('[ErrorReporting] Failed to initialize Sentry', error);
    }
  }

  return sentryClient;
};

export type ErrorContext = Record<string, unknown>;

export const captureError = (error: unknown, context?: ErrorContext) => {
  const client = initSentry();
  if (client?.Native?.captureException) {
    client.Native.captureException(error, { extra: context });
  } else if (__DEV__) {
    console.error('[ErrorReporting] captureError (dev fallback)', error, context);
  }
};

export const captureMessage = (message: string, context?: ErrorContext) => {
  const client = initSentry();
  if (client?.Native?.captureMessage) {
    client.Native.captureMessage(message, { extra: context });
  } else if (__DEV__) {
    console.warn('[ErrorReporting] captureMessage (dev fallback)', message, context);
  }
};

export const isErrorReportingEnabled = (): boolean => Boolean(initSentry());
