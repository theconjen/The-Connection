/**
 * JWT Token Blacklist
 *
 * Simple in-memory blacklist for invalidated JWT tokens.
 * Tokens are automatically removed after they would have expired anyway.
 *
 * Note: This uses in-memory storage, so blacklist is cleared on server restart.
 * For production with multiple server instances, consider using Redis instead.
 */

// Map of token hash -> expiry timestamp
const blacklist = new Map<string, number>();

// Token expiry time (should match JWT expiry - 7 days)
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Cleanup interval (run every hour to remove expired entries)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Hash a token for storage (we don't store the actual token)
 */
function hashToken(token: string): string {
  // Simple hash using built-in crypto
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 32);
}

/**
 * Add a token to the blacklist
 * @param token The JWT token to blacklist
 * @param expiresIn Optional custom expiry time in milliseconds (defaults to 7 days)
 */
export function blacklistToken(token: string, expiresIn: number = TOKEN_EXPIRY_MS): void {
  const hash = hashToken(token);
  const expiresAt = Date.now() + expiresIn;
  blacklist.set(hash, expiresAt);
  console.info(`[TOKEN_BLACKLIST] Token blacklisted, hash suffix: ...${hash.substring(24)}, expires: ${new Date(expiresAt).toISOString()}`);
}

/**
 * Check if a token is blacklisted
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
 * Clean up expired entries from the blacklist
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  let removed = 0;

  for (const [hash, expiresAt] of blacklist.entries()) {
    if (now > expiresAt) {
      blacklist.delete(hash);
      removed++;
    }
  }

  if (removed > 0) {
    console.info(`[TOKEN_BLACKLIST] Cleanup removed ${removed} expired entries, ${blacklist.size} remaining`);
  }
}

// Start cleanup interval
setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);

// Log initialization
console.info('[TOKEN_BLACKLIST] Token blacklist initialized');
