// In many modules we import from `storage-optimized` for performance reasons.
// To avoid surprising DB calls in development when USE_DB is not set, re-export
// the canonical `storage` from `./storage` which already respects USE_DB.
export { storage } from './storage';

if (process.env.NODE_ENV === 'development') {
  console.log('Using storage-optimized shim (delegates to ./storage)');
}
