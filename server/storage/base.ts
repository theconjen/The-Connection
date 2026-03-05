/**
 * Shared imports and utilities for storage domain modules.
 * All domain modules import from here rather than from db/schema directly.
 */
export { db } from '../db';
export { eq, and, or, desc, asc, lt, gt, sql, inArray, like, ilike, isNull } from 'drizzle-orm';
export { whereNotDeleted, andNotDeleted } from '../db/helpers';
export { encryptMessage, decryptMessage } from '../utils/encryption';

/**
 * Convert a search term into a tsquery string for PostgreSQL full-text search.
 */
export function toTsQuery(term: string): string {
  const sanitized = term.replace(/[&|!<>():*'"\\]/g, ' ').trim();
  if (!sanitized) return '';
  const words = sanitized.split(/\s+/).filter(Boolean);
  return words.map(w => `${w}:*`).join(' & ');
}
