import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let imported: any = null;
try {
  imported = require('@sentry/node');
} catch (_err) {
  // If Sentry isn't installed or available at runtime, we operate as a no-op.
  imported = null;
}

const Sentry = (imported && ((imported as any).default ?? imported)) ?? null;

export function isAvailable(): boolean {
  return !!Sentry;
}

export function captureException(err: unknown, context?: { level?: string; user?: any; tags?: Record<string, string> }) {
  if (!Sentry) return;
  try {
    if (context) {
      (Sentry as any).withScope((scope: any) => {
        if (context.level) scope.setLevel(context.level);
        if (context.user) scope.setUser(context.user);
        if (context.tags) Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, String(v)));
        (Sentry as any).captureException(err);
      });
    } else {
      (Sentry as any).captureException(err);
    }
  } catch (_e) {
    // swallow to avoid secondary failures
  }
}

export function captureMessage(message: string, level?: string) {
  if (!Sentry) return;
  try {
    (Sentry as any).captureMessage(message, level as any);
  } catch (_e) {
    // ignore
  }
}

export function setUser(user: any) {
  if (!Sentry) return;
  try {
    if (typeof (Sentry as any).setUser === 'function') {
      (Sentry as any).setUser(user);
    } else if (typeof (Sentry as any).configureScope === 'function') {
      (Sentry as any).configureScope((scope: any) => scope.setUser(user));
    }
  } catch (_e) {}
}

export function addBreadcrumb(breadcrumb: any) {
  if (!Sentry) return;
  try {
    (Sentry as any).addBreadcrumb?.(breadcrumb as any);
  } catch (_e) {}
}

export function lastEventId(): string | null {
  if (!Sentry) return null;
  try {
    return (Sentry as any).lastEventId?.() ?? null;
  } catch (_e) {
    return null;
  }
}

export default {
  isAvailable,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  lastEventId,
};
