import crypto from 'crypto';
import { storage } from './storage-optimized';
import { sendPasswordResetEmail } from './email';
import { db } from './db';
import { passwordResetTokens } from '@shared/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { hashPassword } from './utils/passwords';

// ============================================================================
// ENVIRONMENT & CONFIGURATION
// ============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEBUG_RESET_VERIFY_INSERT = process.env.DEBUG_RESET_VERIFY_INSERT === 'true';

// SERVER_PEPPER: Required in production for secure hashing
// MUST be a random 32+ character string
const SERVER_PEPPER = process.env.PASSWORD_RESET_PEPPER || '';

// Fail fast in production if pepper is missing
if (IS_PRODUCTION && !SERVER_PEPPER) {
  console.error('[PASSWORD_RESET][FATAL] PASSWORD_RESET_PEPPER is required in production');
  throw new Error('PASSWORD_RESET_PEPPER environment variable is required in production');
}

// DB fingerprint for logging (safe to log - masked)
const DB_URL = process.env.DATABASE_URL || 'not-set';
const DB_HOST = DB_URL.match(/@([^:/]+)/)?.[1] || 'unknown';
const DB_NAME = DB_URL.match(/\/([^?]+)/)?.[1]?.split('?')[0] || 'unknown';
const DB_FINGERPRINT = `${DB_HOST.substring(0, 8)}.../${DB_NAME}`;

// ============================================================================
// CONSTANTS
// ============================================================================

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour (60 minutes)
const TOKEN_EXPIRY_MINUTES = 60;
const TOKEN_LENGTH = 64;
const TOKEN_REGEX = /^[a-f0-9]{64}$/;
const TABLE_NAME = 'password_reset_tokens';

// ============================================================================
// TOKEN STATUS ENUM - Single source of truth for all token states
// ============================================================================

export type TokenStatus = 'OK' | 'NOT_FOUND' | 'EXPIRED' | 'USED' | 'INVALID_FORMAT';

// ============================================================================
// SHARED HELPERS - Used by BOTH request and confirm endpoints
// ============================================================================

/**
 * Normalize token input.
 * INVARIANT: Server and client MUST use identical normalization.
 *
 * Steps:
 * 1. Extract token from URL if present (token=...)
 * 2. Strip all whitespace/newlines
 * 3. Trim
 * 4. Convert to lowercase
 */
export function normalizeToken(input: string): string {
  if (!input) return '';

  let token = input;

  // Extract token from URL if present
  if (token.includes('token=')) {
    const match = token.match(/token=([a-f0-9]+)/i);
    if (match) token = match[1];
  } else if (token.includes('://')) {
    const match = token.match(/[?&]token=([a-f0-9]+)/i);
    if (match) token = match[1];
  }

  // Strip all whitespace/newlines, trim, lowercase
  // MUST match client: token.replace(/\s+/g, '').trim().toLowerCase()
  token = token.replace(/\s+/g, '').trim().toLowerCase();

  return token;
}

/**
 * Validate token format.
 * @returns true if exactly 64 hex characters
 */
export function isValidResetTokenFormat(token: string): boolean {
  return TOKEN_REGEX.test(token);
}

/**
 * Hash a normalized token for secure storage.
 * Uses SHA-256 with SERVER_PEPPER for added security.
 *
 * INVARIANT: Both REQUEST (store) and VERIFY/CONFIRM (lookup) MUST use this function.
 *
 * @param normalizedToken - Already normalized token (call normalizeToken first)
 * @returns 64-char hex hash
 */
export function hashResetToken(normalizedToken: string): string {
  // In production, pepper is required (enforced at startup)
  // In dev, pepper may be empty (hash will still work, just less secure)
  const payload = normalizedToken + SERVER_PEPPER;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// Legacy alias for backward compatibility
export const hashToken = hashResetToken;

// ============================================================================
// RESOLVE TOKEN RESULT - Returned by resolveResetToken()
// ============================================================================

export interface ResolveTokenResult {
  status: TokenStatus;
  reason: string;
  userId: number | null;
  tokenHashSuffix: string;
  // Diagnostics (always populated for logging)
  tokenLen: number;
  tokenIsHex: boolean;
  tokenPrefix: string;  // Only used in dev logs
  tokenSuffix: string;  // Only used in dev logs
  foundRow: boolean;
  expired: boolean;
  used: boolean;
  createdAt: string | null;
  expiresAt: string | null;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate a secure reset token (64 hex chars)
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ============================================================================
// RESOLVE RESET TOKEN - SINGLE SOURCE OF TRUTH
// ============================================================================

/**
 * Resolve a reset token to its status.
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR ALL TOKEN VALIDATION.
 * All routes MUST call this function - no duplicated lookup logic allowed.
 *
 * Uses shared helpers: normalizeToken() + hashResetToken()
 *
 * @param rawToken - Raw token input (will be normalized)
 * @param requestId - Correlation ID for logging
 * @param route - Route name for logging (e.g., 'VERIFY', 'RESET')
 * @returns ResolveTokenResult with status and diagnostics
 */
export async function resolveResetToken(
  rawToken: string | undefined,
  requestId: string,
  route: string
): Promise<ResolveTokenResult> {
  const logPrefix = `[RESOLVE_TOKEN][${route}]`;

  // Initialize result with defaults
  const result: ResolveTokenResult = {
    status: 'INVALID_FORMAT',
    reason: 'Token validation not completed',
    userId: null,
    tokenHashSuffix: 'none',
    tokenLen: 0,
    tokenIsHex: false,
    tokenPrefix: 'none',
    tokenSuffix: 'none',
    foundRow: false,
    expired: false,
    used: false,
    createdAt: null,
    expiresAt: null,
  };

  console.info(`${logPrefix} stage=START dbFingerprint=${DB_FINGERPRINT} requestId=${requestId}`);

  // Step 1: Check for missing token
  if (!rawToken) {
    result.status = 'INVALID_FORMAT';
    result.reason = 'Token is missing';
    console.info(`${logPrefix} stage=VALIDATE status=INVALID_FORMAT reason="missing" requestId=${requestId}`);
    return result;
  }

  // Step 2: Normalize token using shared helper
  const token = normalizeToken(rawToken);
  result.tokenLen = token.length;
  result.tokenIsHex = isValidResetTokenFormat(token);

  // Store prefix/suffix for dev diagnostics only (NEVER log in production)
  result.tokenPrefix = token.length >= 6 ? token.substring(0, 6) : token || 'none';
  result.tokenSuffix = token.length >= 6 ? token.substring(token.length - 6) : token || 'none';

  // SECURITY: In production, only log tokenLen and isHex, not raw prefix/suffix
  if (IS_PRODUCTION) {
    console.info(`${logPrefix} stage=NORMALIZE tokenLen=${result.tokenLen} isHex=${result.tokenIsHex} requestId=${requestId}`);
  } else {
    console.info(`${logPrefix} stage=NORMALIZE tokenLen=${result.tokenLen} isHex=${result.tokenIsHex} prefix=${result.tokenPrefix} suffix=${result.tokenSuffix} requestId=${requestId}`);
  }

  // Step 3: Validate format BEFORE DB query
  if (!result.tokenIsHex || result.tokenLen !== TOKEN_LENGTH) {
    result.status = 'INVALID_FORMAT';
    result.reason = `Invalid format: expected ${TOKEN_LENGTH} hex chars, got ${result.tokenLen} chars, isHex=${result.tokenIsHex}`;
    console.info(`${logPrefix} stage=VALIDATE status=INVALID_FORMAT reason="${result.reason}" requestId=${requestId}`);
    return result;
  }

  // Step 4: Hash using shared helper and lookup
  // tokenHashSuffix is SAFE to log (it's the hash suffix, not the token)
  const tokenHash = hashResetToken(token);
  result.tokenHashSuffix = tokenHash.substring(tokenHash.length - 8);

  console.info(`${logPrefix} stage=LOOKUP tokenHashSuffix=${result.tokenHashSuffix} tableName=${TABLE_NAME} dbFingerprint=${DB_FINGERPRINT} requestId=${requestId}`);

  try {
    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);

    if (!tokenRecord) {
      result.status = 'NOT_FOUND';
      result.reason = 'Token not found in database';
      result.foundRow = false;
      console.info(`${logPrefix} stage=LOOKUP status=NOT_FOUND foundRow=false tokenHashSuffix=${result.tokenHashSuffix} requestId=${requestId}`);
      return result;
    }

    // Token found - populate all diagnostics
    result.foundRow = true;
    result.userId = tokenRecord.userId;
    result.createdAt = tokenRecord.createdAt?.toISOString() || null;
    result.expiresAt = tokenRecord.expiresAt.toISOString();

    const now = new Date();
    result.expired = tokenRecord.expiresAt < now;
    result.used = tokenRecord.usedAt !== null;

    console.info(`${logPrefix} stage=FOUND userId=${result.userId} foundRow=true expired=${result.expired} used=${result.used} tokenHashSuffix=${result.tokenHashSuffix} requestId=${requestId}`);

    // Step 5: Check expiry
    if (result.expired) {
      result.status = 'EXPIRED';
      result.reason = `Token expired at ${result.expiresAt}`;
      console.info(`${logPrefix} stage=CHECK status=EXPIRED expiresAt=${result.expiresAt} requestId=${requestId}`);
      return result;
    }

    // Step 6: Check if used
    if (result.used) {
      result.status = 'USED';
      result.reason = 'Token has already been used';
      console.info(`${logPrefix} stage=CHECK status=USED requestId=${requestId}`);
      return result;
    }

    // Token is valid
    result.status = 'OK';
    result.reason = 'Token is valid';
    console.info(`${logPrefix} stage=COMPLETE status=OK userId=${result.userId} tokenHashSuffix=${result.tokenHashSuffix} requestId=${requestId}`);
    return result;

  } catch (error) {
    console.error(`${logPrefix} stage=ERROR dbFingerprint=${DB_FINGERPRINT} requestId=${requestId}:`, error);
    result.status = 'NOT_FOUND';
    result.reason = 'Database error during lookup';
    return result;
  }
}

// ============================================================================
// VERIFY RESET TOKEN
// ============================================================================

/**
 * Verify a password reset token.
 * Delegates to resolveResetToken() - no duplicated logic.
 */
export async function verifyResetToken(rawToken: string, requestId: string): Promise<boolean> {
  const result = await resolveResetToken(rawToken, requestId, 'VERIFY');
  return result.status === 'OK';
}

// ============================================================================
// RESET PASSWORD RESULT
// ============================================================================

export interface ResetPasswordResult {
  success: boolean;
  status: TokenStatus | 'MISSING_FIELDS' | 'USER_NOT_FOUND' | 'UPDATE_FAILED' | 'ERROR';
  reason: string;
  requestId: string;
  // From resolveResetToken
  tokenLen: number;
  tokenIsHex: boolean;
  tokenPrefix: string;
  tokenSuffix: string;
  tokenHashSuffix: string;
  foundRow: boolean;
  expired: boolean;
  used: boolean;
  createdAt: string | null;
  expiresAt: string | null;
  userId: number | null;
}

// ============================================================================
// RESET PASSWORD
// ============================================================================

/**
 * Reset password using token.
 * Delegates token validation to resolveResetToken() - no duplicated logic.
 * Uses shared helpers: normalizeToken() + hashResetToken()
 */
export async function resetPassword(
  rawToken: string | undefined,
  newPassword: string | undefined,
  requestId: string
): Promise<ResetPasswordResult> {
  const logPrefix = '[RESET_PASSWORD][EXEC]';

  // Initialize result
  const result: ResetPasswordResult = {
    success: false,
    status: 'ERROR',
    reason: 'Not completed',
    requestId,
    tokenLen: 0,
    tokenIsHex: false,
    tokenPrefix: 'none',
    tokenSuffix: 'none',
    tokenHashSuffix: 'none',
    foundRow: false,
    expired: false,
    used: false,
    createdAt: null,
    expiresAt: null,
    userId: null,
  };

  console.info(`${logPrefix} stage=START dbFingerprint=${DB_FINGERPRINT} requestId=${requestId}`);

  // Check for missing fields
  if (!rawToken || !newPassword) {
    result.status = 'MISSING_FIELDS';
    result.reason = `Missing: token=${!!rawToken} password=${!!newPassword}`;
    console.info(`${logPrefix} stage=VALIDATE status=MISSING_FIELDS reason="${result.reason}" requestId=${requestId}`);
    return result;
  }

  // Delegate to resolveResetToken - SINGLE SOURCE OF TRUTH
  const tokenResult = await resolveResetToken(rawToken, requestId, 'RESET');

  // Copy all diagnostics from tokenResult
  result.tokenLen = tokenResult.tokenLen;
  result.tokenIsHex = tokenResult.tokenIsHex;
  result.tokenPrefix = tokenResult.tokenPrefix;
  result.tokenSuffix = tokenResult.tokenSuffix;
  result.tokenHashSuffix = tokenResult.tokenHashSuffix;
  result.foundRow = tokenResult.foundRow;
  result.expired = tokenResult.expired;
  result.used = tokenResult.used;
  result.createdAt = tokenResult.createdAt;
  result.expiresAt = tokenResult.expiresAt;
  result.userId = tokenResult.userId;

  // If token is not OK, return with token status
  if (tokenResult.status !== 'OK') {
    result.status = tokenResult.status;
    result.reason = tokenResult.reason;
    console.info(`${logPrefix} stage=TOKEN_CHECK status=${result.status} tokenHashSuffix=${result.tokenHashSuffix} requestId=${requestId}`);
    return result;
  }

  // Token is valid - proceed with password reset
  const userId = tokenResult.userId!;

  try {
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      result.status = 'USER_NOT_FOUND';
      result.reason = `User ${userId} not found`;
      console.info(`${logPrefix} stage=USER_LOOKUP status=USER_NOT_FOUND userId=${userId} requestId=${requestId}`);
      return result;
    }

    // Hash and update password using Argon2id
    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);

    if (!updatedUser) {
      result.status = 'UPDATE_FAILED';
      result.reason = 'Password update failed';
      console.info(`${logPrefix} stage=UPDATE status=UPDATE_FAILED userId=${userId} requestId=${requestId}`);
      return result;
    }

    // Mark token as used - use same hashing as lookup
    const token = normalizeToken(rawToken);
    const tokenHash = hashResetToken(token);
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.tokenHash, tokenHash));

    result.success = true;
    result.status = 'OK';
    result.reason = 'Password reset successful';
    console.info(`${logPrefix} stage=COMPLETE status=OK userId=${userId} tokenHashSuffix=${result.tokenHashSuffix} requestId=${requestId}`);
    return result;

  } catch (error) {
    console.error(`${logPrefix} stage=ERROR requestId=${requestId}:`, error);
    result.status = 'ERROR';
    result.reason = 'Exception during password update';
    return result;
  }
}

// ============================================================================
// CREATE PASSWORD RESET TOKEN
// ============================================================================

/**
 * Result from createPasswordResetToken for structured logging
 */
export interface CreateTokenResult {
  success: boolean;
  requestId: string;
  userId: number | null;
  tokenHashSuffix: string;
  insertedRowId: number | null;
  expiresAt: string | null;
  invalidatedPrevious: boolean;
  numTokensInvalidated: number;
  emailSent: boolean;
  emailMessageId: string | null;
  // For debug verification
  verifyInsertFound?: boolean;
  // DEV ONLY: raw token for testing (NEVER in production)
  devToken?: string;
}

/**
 * Create a password reset token for a user.
 * Stores hashed token in database for security.
 *
 * Uses shared helpers: normalizeToken() + hashResetToken()
 *
 * Structured logging enables correlation:
 * "email sent" → "token stored" → "token used"
 *
 * POLICY:
 * - Token TTL: 60 minutes
 * - Older tokens invalidated on new request: YES
 * - One-time use: YES
 */
export async function createPasswordResetToken(
  email: string,
  requestId?: string
): Promise<CreateTokenResult> {
  const reqId = requestId || crypto.randomUUID();
  const logPrefix = '[PASSWORD_RESET_REQUEST]';

  const result: CreateTokenResult = {
    success: false,
    requestId: reqId,
    userId: null,
    tokenHashSuffix: 'none',
    insertedRowId: null,
    expiresAt: null,
    invalidatedPrevious: false,
    numTokensInvalidated: 0,
    emailSent: false,
    emailMessageId: null,
  };

  try {
    const normalizedEmail = email.trim().toLowerCase();

    console.info(`${logPrefix} stage=START email=${normalizedEmail} dbFingerprint=${DB_FINGERPRINT} requestId=${reqId}`);

    const user = await storage.getUserByEmail(normalizedEmail);

    if (!user) {
      // Don't reveal if email exists - silent success
      console.info(`${logPrefix} stage=NO_USER email=${normalizedEmail} requestId=${reqId}`);
      result.success = true; // Silent success for security
      return result;
    }

    result.userId = user.id;
    console.info(`${logPrefix} stage=USER_FOUND userId=${user.id} requestId=${reqId}`);

    // Invalidate existing tokens and count how many
    const invalidateResult = await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt)
      ))
      .returning({ id: passwordResetTokens.id });

    result.invalidatedPrevious = invalidateResult.length > 0;
    result.numTokensInvalidated = invalidateResult.length;

    // Generate and store new token using shared helpers
    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken); // Uses normalized token + pepper
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    result.tokenHashSuffix = tokenHash.substring(tokenHash.length - 8);
    result.expiresAt = expiresAt.toISOString();

    // DEV ONLY: Include raw token for testing (NEVER in production)
    if (!IS_PRODUCTION) {
      result.devToken = rawToken;
    }

    // Insert and get the row ID
    const insertResult = await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      email: user.email,
      expiresAt,
    }).returning({ id: passwordResetTokens.id });

    result.insertedRowId = insertResult[0]?.id || null;

    // (C) Debug-only verification after insert
    if (DEBUG_RESET_VERIFY_INSERT || !IS_PRODUCTION) {
      try {
        const [verifyRow] = await db
          .select({ id: passwordResetTokens.id })
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.tokenHash, tokenHash))
          .limit(1);

        result.verifyInsertFound = !!verifyRow;

        if (!verifyRow) {
          console.error(`${logPrefix} stage=VERIFY_INSERT_FAILED tokenHashSuffix=${result.tokenHashSuffix} rowId=${result.insertedRowId} dbFingerprint=${DB_FINGERPRINT} requestId=${reqId}`);
          // In dev, this is a critical error
          if (!IS_PRODUCTION) {
            throw new Error(`INSERT_VERIFY_MISMATCH: inserted row ${result.insertedRowId} but SELECT returned nothing`);
          }
        } else {
          console.info(`${logPrefix} stage=VERIFY_INSERT_OK verifyFound=true tokenHashSuffix=${result.tokenHashSuffix} requestId=${reqId}`);
        }
      } catch (verifyError) {
        if (!IS_PRODUCTION) throw verifyError;
        console.error(`${logPrefix} stage=VERIFY_INSERT_ERROR requestId=${reqId}:`, verifyError);
      }
    }

    // Send email - rawToken goes in email (not the hash)
    const emailResult = await sendPasswordResetEmail(user.email, user.username, rawToken);
    result.emailSent = !!emailResult;

    // Capture message ID from email service (Resend/SES/SendGrid)
    if (emailResult && typeof emailResult === 'object' && 'id' in emailResult) {
      result.emailMessageId = (emailResult as any).id;
    } else if (typeof emailResult === 'string') {
      result.emailMessageId = emailResult;
    }

    // (B) Structured log with all required fields for correlation
    console.info(`${logPrefix} stage=INSERT_OK requestId=${reqId} env=${IS_PRODUCTION ? 'production' : 'development'} dbFingerprint=${DB_FINGERPRINT} tableName=${TABLE_NAME} userId=${user.id} tokenHashSuffix=${result.tokenHashSuffix} insertedRowId=${result.insertedRowId} expiresAt=${result.expiresAt} invalidatePrevious=${result.invalidatedPrevious} numTokensInvalidated=${result.numTokensInvalidated} resendMessageId=${result.emailMessageId || 'none'}`);

    result.success = true;
    return result;

  } catch (error) {
    console.error(`${logPrefix} stage=ERROR dbFingerprint=${DB_FINGERPRINT} requestId=${reqId}:`, error);
    return result;
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

export async function cleanupExpiredTokens(): Promise<number> {
  try {
    await db.delete(passwordResetTokens)
      .where(gt(new Date(), passwordResetTokens.expiresAt));
    console.info('[PASSWORD_RESET][CLEANUP] Expired tokens cleaned');
    return 0;
  } catch (error) {
    console.error('[PASSWORD_RESET][CLEANUP] Error:', error);
    return 0;
  }
}

// ============================================================================
// POLICY DOCUMENTATION (for acceptance criteria)
// ============================================================================
//
// Token TTL: 60 minutes
// Older tokens invalidated on new request: YES (all unused tokens for user are marked used)
// One-time use: YES (token marked used after successful password reset)
//
