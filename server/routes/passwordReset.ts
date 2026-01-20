import { Router } from 'express';
import { z } from 'zod';
import {
  createPasswordResetToken,
  resolveResetToken,
  resetPassword,
  normalizeToken,
  isValidResetTokenFormat,
  hashResetToken,
  TokenStatus,
  ResetPasswordResult
} from '../reset-password';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const router = Router();

// ============================================================================
// SERVER BOOT LOGGING
// ============================================================================

const SERVER_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = SERVER_ENV === 'production';
const SERVER_HOST = process.env.RENDER_EXTERNAL_HOSTNAME || process.env.HOSTNAME || 'localhost';
const DB_URL = process.env.DATABASE_URL || 'not-set';
const DB_HOST = DB_URL.match(/@([^:/]+)/)?.[1] || 'unknown';
const DB_NAME = DB_URL.match(/\/([^?]+)/)?.[1]?.split('?')[0] || 'unknown';
const DB_FINGERPRINT = `${DB_HOST.substring(0, 8)}.../${DB_NAME}`;

console.info(`[PASSWORD_RESET][INIT] ========================================`);
console.info(`[PASSWORD_RESET][INIT] env=${SERVER_ENV}`);
console.info(`[PASSWORD_RESET][INIT] host=${SERVER_HOST}`);
console.info(`[PASSWORD_RESET][INIT] dbFingerprint=${DB_FINGERPRINT}`);
console.info(`[PASSWORD_RESET][INIT] tokenLookupMode=hashed (SHA-256 + PEPPER)`);
console.info(`[PASSWORD_RESET][INIT] pepperConfigured=${!!process.env.PASSWORD_RESET_PEPPER}`);
console.info(`[PASSWORD_RESET][INIT] ========================================`);

// ============================================================================
// RATE LIMITING
// ============================================================================

const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const resetSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// (D) Rate limiter for VERIFY endpoint - same as confirm
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow more verify calls (client may call on page load)
  message: 'Too many token verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// SCHEMAS
// ============================================================================

const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ============================================================================
// HELPERS
// ============================================================================

function shouldIncludeDiagnostics(req: any): boolean {
  const isDev = !IS_PRODUCTION;
  const hasAdminHeader = req.headers['x-debug-diagnostics'] === process.env.ADMIN_DEBUG_SECRET;
  return isDev || hasAdminHeader;
}

function logRequestStart(route: string, requestId: string) {
  console.info(`[PASSWORD_RESET][${route}] stage=REQUEST_START requestId=${requestId} env=${SERVER_ENV} dbFingerprint=${DB_FINGERPRINT}`);
}

// Status to HTTP code mapping
const STATUS_TO_CODE: Record<string, string> = {
  'OK': 'OK',
  'NOT_FOUND': 'TOKEN_INVALID_OR_EXPIRED',
  'EXPIRED': 'TOKEN_INVALID_OR_EXPIRED',
  'USED': 'TOKEN_USED',
  'INVALID_FORMAT': 'TOKEN_INVALID_OR_EXPIRED',
  'MISSING_FIELDS': 'MISSING_FIELDS',
  'USER_NOT_FOUND': 'TOKEN_INVALID_OR_EXPIRED',
  'UPDATE_FAILED': 'INTERNAL_ERROR',
  'ERROR': 'INTERNAL_ERROR',
};

const STATUS_TO_MESSAGE: Record<string, string> = {
  'OK': 'Success',
  'NOT_FOUND': 'Invalid reset token. Please request a new one.',
  'EXPIRED': 'This reset token has expired. Please request a new one.',
  'USED': 'This reset token has already been used. Please request a new one.',
  'INVALID_FORMAT': 'Invalid token format.',
  'MISSING_FIELDS': 'Token and new password are required.',
  'USER_NOT_FOUND': 'Unable to reset password. Please contact support.',
  'UPDATE_FAILED': 'Failed to update password. Please try again.',
  'ERROR': 'An unexpected error occurred. Please try again.',
};

// ============================================================================
// CONSISTENCY GUARD
// ============================================================================

interface ResponseDiagnostics {
  status: string;
  reason: string;
  foundRow: boolean;
  expired: boolean;
  used: boolean;
}

function assertConsistency(
  execResult: ResetPasswordResult,
  responseDiagnostics: ResponseDiagnostics,
  requestId: string
): void {
  const mismatches: string[] = [];

  if (execResult.status !== responseDiagnostics.status) {
    mismatches.push(`status: exec=${execResult.status} response=${responseDiagnostics.status}`);
  }
  if (execResult.foundRow !== responseDiagnostics.foundRow) {
    mismatches.push(`foundRow: exec=${execResult.foundRow} response=${responseDiagnostics.foundRow}`);
  }
  if (execResult.expired !== responseDiagnostics.expired) {
    mismatches.push(`expired: exec=${execResult.expired} response=${responseDiagnostics.expired}`);
  }
  if (execResult.used !== responseDiagnostics.used) {
    mismatches.push(`used: exec=${execResult.used} response=${responseDiagnostics.used}`);
  }

  if (mismatches.length > 0) {
    console.error(`[PASSWORD_RESET][CONSISTENCY_ERROR] requestId=${requestId} mismatches: ${mismatches.join(', ')}`);
    if (!IS_PRODUCTION) {
      throw new Error(`INTERNAL_DIAGNOSTIC_MISMATCH: ${mismatches.join(', ')}`);
    }
  }
}

// ============================================================================
// POST /api/password-reset/request
// ============================================================================

router.post('/request', resetRequestLimiter, async (req, res) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  logRequestStart('REQUEST', requestId);

  try {
    const { email } = requestResetSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    console.info(`[PASSWORD_RESET][REQUEST] stage=PROCESS email=${normalizedEmail} requestId=${requestId}`);

    // Pass requestId for correlation logging
    const result = await createPasswordResetToken(normalizedEmail, requestId);

    // Log structured result for correlation (tokenHashSuffix only, no raw token data)
    console.info(`[PASSWORD_RESET][REQUEST] stage=RESULT requestId=${requestId} userId=${result.userId} tokenHashSuffix=${result.tokenHashSuffix} rowId=${result.insertedRowId} invalidated=${result.numTokensInvalidated} emailSent=${result.emailSent} resendMessageId=${result.emailMessageId || 'none'}`);

    // Build response
    const response: any = {
      message: 'If an account with that email exists, we have sent a password reset link.',
      requestId,
    };

    // DEV ONLY: Include token for testing (NEVER in production)
    if (!IS_PRODUCTION && result.devToken) {
      response.devToken = result.devToken;
      response.devTokenHashSuffix = result.tokenHashSuffix;
      console.info(`[PASSWORD_RESET][REQUEST] stage=DEV_TOKEN_RETURNED requestId=${requestId} tokenHashSuffix=${result.tokenHashSuffix}`);
    }

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.info(`[PASSWORD_RESET][REQUEST] stage=VALIDATION_ERROR requestId=${requestId}`);
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        error: 'Invalid email address',
        requestId,
      });
    }

    console.error(`[PASSWORD_RESET][REQUEST] stage=ERROR requestId=${requestId}:`, error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      error: 'Failed to process request',
      requestId,
    });
  }
});

// ============================================================================
// GET /api/password-reset/verify/:token
// GET /api/password-reset/verify?token=...
// (D) VERIFY endpoint - checks token validity without consuming it
// ============================================================================

// Handler function for verify
async function handleVerify(req: any, res: any) {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  const includeDiagnostics = shouldIncludeDiagnostics(req);

  logRequestStart('VERIFY', requestId);

  try {
    // Support both /verify/:token and /verify?token=...
    const token = req.params.token || (req.query.token as string);

    if (!token) {
      console.info(`[PASSWORD_RESET][VERIFY] stage=MISSING_TOKEN requestId=${requestId}`);
      return res.status(400).json({
        code: 'MISSING_FIELDS',
        error: 'Token is required',
        valid: false,
        requestId,
      });
    }

    // SINGLE SOURCE OF TRUTH - delegate to resolveResetToken
    // Uses same normalizeToken() + hashResetToken() as REQUEST endpoint
    const result = await resolveResetToken(token, requestId, 'VERIFY');

    // Log with tokenHashSuffix for correlation (NEVER log raw token)
    console.info(`[PASSWORD_RESET][VERIFY] stage=RESULT status=${result.status} tokenHashSuffix=${result.tokenHashSuffix} foundRow=${result.foundRow} expired=${result.expired} used=${result.used} requestId=${requestId}`);

    if (result.status !== 'OK') {
      // SECURITY: Never return userId/email in response
      const response: any = {
        code: STATUS_TO_CODE[result.status],
        error: STATUS_TO_MESSAGE[result.status],
        valid: false,
        requestId,
      };

      // Only include diagnostics in dev or with admin header
      // SECURITY: Never include tokenPrefix/tokenSuffix even in diagnostics
      if (includeDiagnostics) {
        response.diagnostics = {
          status: result.status,
          reason: result.reason,
          tokenLen: result.tokenLen,
          tokenHashSuffix: result.tokenHashSuffix,
          foundRow: result.foundRow,
          expired: result.expired,
          used: result.used,
        };
      }

      return res.status(400).json(response);
    }

    // SECURITY: Only return valid=true, never userId/email
    res.json({
      valid: true,
      message: 'Token is valid',
      requestId,
    });
  } catch (error) {
    console.error(`[PASSWORD_RESET][VERIFY] stage=ERROR requestId=${requestId}:`, error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      error: 'Failed to verify token',
      valid: false,
      requestId,
    });
  }
}

// Register both routes for verify (with and without token param)
router.get('/verify/:token', verifyLimiter, handleVerify);
router.get('/verify', verifyLimiter, handleVerify);

// ============================================================================
// POST /api/password-reset/reset
// ============================================================================

router.post('/reset', resetSubmitLimiter, async (req, res) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  const includeDiagnostics = shouldIncludeDiagnostics(req);

  logRequestStart('RESET', requestId);
  console.info(`[PASSWORD_RESET][RESET] stage=BODY_KEYS keys=${Object.keys(req.body || {}).join(',')} requestId=${requestId}`);

  try {
    const { token, newPassword } = req.body;

    // Validate password strength (only if provided)
    if (newPassword) {
      try {
        passwordSchema.parse(newPassword);
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          console.info(`[PASSWORD_RESET][RESET] stage=WEAK_PASSWORD requestId=${requestId}`);
          return res.status(400).json({
            code: 'WEAK_PASSWORD',
            error: zodError.errors.map(e => e.message).join('. '),
            requestId,
          });
        }
      }
    }

    // SINGLE SOURCE OF TRUTH - delegate to resetPassword
    // Uses same normalizeToken() + hashResetToken() as REQUEST and VERIFY
    const execResult = await resetPassword(token, newPassword, requestId);

    console.info(`[PASSWORD_RESET][RESET] stage=EXEC_RESULT status=${execResult.status} success=${execResult.success} tokenHashSuffix=${execResult.tokenHashSuffix} requestId=${requestId}`);

    if (!execResult.success) {
      // Build response diagnostics (must match execResult exactly)
      const responseDiagnostics: ResponseDiagnostics = {
        status: execResult.status,
        reason: execResult.reason,
        foundRow: execResult.foundRow,
        expired: execResult.expired,
        used: execResult.used,
      };

      // CONSISTENCY GUARD - assert response matches exec
      assertConsistency(execResult, responseDiagnostics, requestId);

      const response: any = {
        code: STATUS_TO_CODE[execResult.status] || 'INTERNAL_ERROR',
        error: STATUS_TO_MESSAGE[execResult.status] || 'An unexpected error occurred.',
        requestId,
      };

      // Only include diagnostics in dev or with admin header
      // SECURITY: NEVER include tokenPrefix/tokenSuffix in production
      if (includeDiagnostics) {
        response.diagnostics = {
          status: execResult.status,
          reason: execResult.reason,
          tokenLen: execResult.tokenLen,
          tokenIsHex: execResult.tokenIsHex,
          // REMOVED: tokenPrefix, tokenSuffix - never expose raw token data
          tokenHashSuffix: execResult.tokenHashSuffix,
          foundRow: execResult.foundRow,
          expired: execResult.expired,
          used: execResult.used,
          createdAt: execResult.createdAt,
          expiresAt: execResult.expiresAt,
        };
      }

      const httpStatus = execResult.status === 'ERROR' || execResult.status === 'UPDATE_FAILED' ? 500 : 400;

      console.info(`[PASSWORD_RESET][RESET] stage=RESPONSE_ERROR code=${response.code} status=${execResult.status} tokenHashSuffix=${execResult.tokenHashSuffix} requestId=${requestId}`);

      return res.status(httpStatus).json(response);
    }

    // Success
    console.info(`[PASSWORD_RESET][RESET] stage=RESPONSE_SUCCESS tokenHashSuffix=${execResult.tokenHashSuffix} requestId=${requestId}`);

    res.json({
      message: 'Password has been successfully reset. You can now log in with your new password.',
      requestId,
    });

  } catch (error) {
    if (error instanceof Error && error.message.startsWith('INTERNAL_DIAGNOSTIC_MISMATCH')) {
      console.error(`[PASSWORD_RESET][RESET] stage=CONSISTENCY_FAILURE requestId=${requestId}:`, error.message);
      return res.status(500).json({
        code: 'INTERNAL_DIAGNOSTIC_MISMATCH',
        error: 'Internal consistency error. Please try again.',
        requestId,
      });
    }

    console.error(`[PASSWORD_RESET][RESET] stage=ERROR requestId=${requestId}:`, error);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      error: 'Failed to reset password. Please try again.',
      requestId,
    });
  }
});

export default router;
