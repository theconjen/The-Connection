import { Router } from 'express';
import { z } from 'zod';
import { createPasswordResetToken, verifyResetToken, resetPassword } from '../reset-password';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for password reset requests
const resetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset submission
const resetSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Schema for password reset request
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for password reset submission
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

/**
 * POST /api/password-reset/request
 * Request a password reset email
 */
router.post('/request', resetRequestLimiter, async (req, res) => {
  console.info('[PASSWORD_RESET_ROUTE] HIT', new Date().toISOString());
  console.info('[PASSWORD_RESET_ROUTE] Request body:', req.body);

  try {
    // Validate input
    const { email } = requestResetSchema.parse(req.body);

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    console.info('[PASSWORD_RESET_ROUTE] Normalized email:', normalizedEmail);

    // Create reset token and send email
    const result = await createPasswordResetToken(normalizedEmail);
    console.info('[PASSWORD_RESET_ROUTE] createPasswordResetToken result:', result);

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.info('[PASSWORD_RESET_ROUTE] Validation error:', error.errors);
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }

    console.error('[PASSWORD_RESET_ROUTE] Error requesting password reset:', error);
    res.status(500).json({
      error: 'Failed to process password reset request',
    });
  }
});

/**
 * GET /api/password-reset/verify/:token
 * Verify that a reset token is valid
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
      });
    }

    // verifyResetToken is now async (uses database)
    const isValid = await verifyResetToken(token);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      });
    }

    res.json({
      valid: true,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({
      error: 'Failed to verify reset token',
    });
  }
});

/**
 * POST /api/password-reset/reset
 * Reset password using token
 */
router.post('/reset', resetSubmitLimiter, async (req, res) => {
  try {
    // Validate input
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Reset the password
    const success = await resetPassword(token, newPassword);

    if (!success) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      });
    }

    res.json({
      message: 'Password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }

    console.error('Error resetting password:', error);
    res.status(500).json({
      error: 'Failed to reset password',
    });
  }
});

export default router;
