// In many modules we import from `storage-optimized` for performance reasons.
// To avoid surprising DB calls in development when USE_DB is not set, re-export
// the canonical `storage` from `./storage` which already respects USE_DB.
import { storage as realStorage } from './storage';

// Re-export canonical storage instance. Tests should mount routers with their
// own in-memory storage instances instead of relying on module-level shims.
export { realStorage as storage };

if (process.env.NODE_ENV === 'development') {
  console.log('Using storage-optimized shim (delegates to ./storage)');
}
