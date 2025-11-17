// Shared constants for mobile and web
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_UPLOAD_SIZE_MB = 25;
export const CACHE_TIMES = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
} as const;
