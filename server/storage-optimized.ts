// Optimized storage configuration for production
// This file eliminates MemStorage bloat when using database

import { DbStorage } from './storage-db-only';

// Force database storage in production to eliminate MemStorage bloat
export const storage = new DbStorage();

// Remove all MemStorage code from production builds
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Using optimized database-only storage (MemStorage removed for performance)');
}
