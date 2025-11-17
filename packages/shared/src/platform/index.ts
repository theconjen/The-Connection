/**
 * Platform-specific implementations
 *
 * These modules automatically resolve to .web.ts or .native.ts
 * based on the platform (metro bundler or vite)
 */

export { storage } from './storage';
export type { Storage } from './storage';

export { navigation } from './navigation';
export type { Navigation } from './navigation';

export { sharing } from './sharing';
export type { Sharing, ShareOptions, ShareResult } from './sharing';
