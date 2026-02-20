/**
 * JWT Token Blacklist — Hybrid In-Memory + PostgreSQL
 *
 * In-memory Map provides synchronous reads (required because getSessionUserId
 * is sync and called in 324+ places). PostgreSQL provides persistence across
 * server restarts.
 *
 * On startup, initializeBlacklist() loads non-expired tokens from the DB into
 * the Map. blacklistToken() writes to both Map (sync) and DB (fire-and-forget).
 * isTokenBlacklisted() reads from Map only (no async overhead).
 */

import crypto from 'crypto';

// In-memory Map: tokenHash -> expiresAt timestamp (ms)
const blacklist = new Map<string, number>();

// Token expiry time (should match max JWT expiry — 10 days for sliding sessions)
const TOKEN_EXPIRY_MS = 10 * 24 * 60 * 60 * 1000;

// Cleanup interval (run every hour)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Hash a token for storage (we don't store the actual token)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 32);
}

/**
 * Load non-expired blacklisted tokens from PostgreSQL into the in-memory Map.
 * Call this once on server startup. Safe to call multiple times (idempotent).
 */
export async function initializeBlacklist(): Promise<void> {
  try {
    const { db } = await import('../db');
    const { tokenBlacklist: tokenBlacklistTable } = await import('@shared/schema');
    const { gt } = await import('drizzle-orm');

    const rows = await db
      .select({ tokenHash: tokenBlacklistTable.tokenHash, expiresAt: tokenBlacklistTable.expiresAt })
      .from(tokenBlacklistTable)
      .where(gt(tokenBlacklistTable.expiresAt, new Date()));

    for (const row of rows) {
      blacklist.set(row.tokenHash, row.expiresAt.getTime());
    }

    console.info(`[TOKEN_BLACKLIST] Initialized from DB: loaded ${rows.length} active entries`);
  } catch (error) {
    // Non-fatal: if DB is unavailable, we start with an empty blacklist.
    // The table may not exist yet (before first db:push).
    console.warn('[TOKEN_BLACKLIST] Could not load from DB (table may not exist yet):', (error as Error).message);
  }
}

/**
 * Add a token to the blacklist.
 * Sync write to Map + async fire-and-forget write to DB.
 * @param token The JWT token to blacklist
 * @param expiresIn Optional custom expiry time in milliseconds (defaults to 10 days)
 */
export function blacklistToken(token: string, expiresIn: number = TOKEN_EXPIRY_MS): void {
  const hash = hashToken(token);
  const expiresAt = Date.now() + expiresIn;
  blacklist.set(hash, expiresAt);

  console.info(`[TOKEN_BLACKLIST] Token blacklisted, hash suffix: ...${hash.substring(24)}, expires: ${new Date(expiresAt).toISOString()}`);

  // Fire-and-forget DB write
  persistToDb(hash, new Date(expiresAt)).catch((err) => {
    console.error('[TOKEN_BLACKLIST] Failed to persist to DB:', err.message);
  });
}

/**
 * Check if a token is blacklisted (synchronous — Map read only).
 * @param token The JWT token to check
 * @returns true if the token is blacklisted and not expired
 */
export function isTokenBlacklisted(token: string): boolean {
  const hash = hashToken(token);
  const expiresAt = blacklist.get(hash);

  if (!expiresAt) {
    return false;
  }

  // If the blacklist entry has expired, remove it
  if (Date.now() > expiresAt) {
    blacklist.delete(hash);
    return false;
  }

  return true;
}

/**
 * Get the current size of the blacklist
 */
export function getBlacklistSize(): number {
  return blacklist.size;
}

/**
 * Persist a blacklisted token hash to PostgreSQL.
 */
async function persistToDb(tokenHash: string, expiresAt: Date): Promise<void> {
  const { db } = await import('../db');
  const { tokenBlacklist: tokenBlacklistTable } = await import('@shared/schema');
  const { sql } = await import('drizzle-orm');

  // Use ON CONFLICT to handle duplicate hashes gracefully
  await db.execute(sql`
    INSERT INTO token_blacklist (token_hash, expires_at)
    VALUES (${tokenHash}, ${expiresAt})
    ON CONFLICT (token_hash) DO NOTHING
  `);
}

/**
 * Clean up expired entries from both Map and DB.
 */
async function cleanupExpiredTokens(): Promise<void> {
  const now = Date.now();
  let removed = 0;

  // Clean in-memory Map
  for (const [hash, expiresAt] of blacklist.entries()) {
    if (now > expiresAt) {
      blacklist.delete(hash);
      removed++;
    }
  }

  if (removed > 0) {
    console.info(`[TOKEN_BLACKLIST] Cleanup removed ${removed} expired entries from memory, ${blacklist.size} remaining`);
  }

  // Clean DB
  try {
    const { db } = await import('../db');
    const { tokenBlacklist: tokenBlacklistTable } = await import('@shared/schema');
    const { lt } = await import('drizzle-orm');

    await db.delete(tokenBlacklistTable).where(lt(tokenBlacklistTable.expiresAt, new Date()));
  } catch (error) {
    console.error('[TOKEN_BLACKLIST] DB cleanup error:', (error as Error).message);
  }
}

// Start cleanup interval
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);

// Log initialization
console.info('[TOKEN_BLACKLIST] Token blacklist module loaded (call initializeBlacklist() to hydrate from DB)');
