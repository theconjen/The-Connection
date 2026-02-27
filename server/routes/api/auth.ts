import { Router } from 'express';
import { hashPassword, verifyPassword } from '../../utils/passwords';
import { storage } from '../../storage-optimized';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../email';
import rateLimit from 'express-rate-limit';
import { buildErrorResponse } from '../../utils/errors';
import { getSessionUserId, setSessionUserId } from '../../utils/session';
import { generateVerificationToken, hashToken, createAndSendVerification } from '../../lib/emailVerification';
import { logger } from '../../lib/logger';
import { magicCodes } from '@shared/schema';
import { db } from '../../db';
import { eq, and, lt, isNull } from 'drizzle-orm';

const router = Router();

// SECURITY: Rate limiters for magic code authentication
const magicCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 magic code requests per 15 minutes
  message: 'Too many magic code requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const magicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per 15 minutes
  message: 'Too many verification attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: SHA-256 hash for magic codes
function hashMagicCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Cleanup expired magic codes periodically (every hour)
setInterval(async () => {
  try {
    await db.delete(magicCodes).where(lt(magicCodes.expiresAt, new Date()));
  } catch (e) {
    console.warn('[MAGIC] cleanup error:', e);
  }
}, 60 * 60 * 1000);

// Magic code: POST /api/auth/magic { email } with rate limiting
router.post('/auth/magic', magicCodeLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email required' });

    // SECURITY: Only allow deterministic codes via env vars (for App Store review)
    const reviewEmail = process.env.APP_REVIEW_EMAIL;
    const reviewCode = process.env.APP_REVIEW_CODE;
    const deterministic = (reviewEmail && reviewCode && String(email).toLowerCase() === reviewEmail.toLowerCase()) ? reviewCode : undefined;
    const code = deterministic ?? Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(16).toString('hex');

    // Store in database with hashed code (survives server restarts)
    await db.insert(magicCodes).values({
      token,
      email,
      codeHash: hashMagicCode(code),
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
    });

    // Email the code (plain text; mock-friendly)
    try {
      await sendEmail({
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@theconnection.app',
        subject: 'Your The Connection login code',
        text: `Your login code is: ${code}\n\nIt expires in 15 minutes.`,
      });
    } catch (e) {
      console.warn('[MAGIC] email send failed (mock ok):', e);
    }

    return res.json({ token, message: 'Magic code sent' });
  } catch (error) {
    console.error('Magic auth error:', error);
    res.status(500).json(buildErrorResponse('Server error during magic auth', error));
  }
});

// Verify magic code: POST /api/auth/verify { token, code } with rate limiting
router.post('/auth/verify', magicVerifyLimiter, async (req, res) => {
  try {
    const { token, code } = req.body || {};

    // Look up magic code from database
    const [entry] = await db.select().from(magicCodes).where(
      and(eq(magicCodes.token, token), isNull(magicCodes.usedAt))
    );
    if (!entry) return res.status(400).json({ message: 'invalid token' });
    if (new Date() > entry.expiresAt) return res.status(400).json({ message: 'expired' });
    if (entry.codeHash !== hashMagicCode(String(code))) return res.status(400).json({ message: 'invalid code' });

    // SECURITY: Look up real user by email instead of generating synthetic ID
    const user = await storage.getUserByEmail(entry.email);
    if (!user) {
      // Mark as used even if no user found
      await db.update(magicCodes).set({ usedAt: new Date() }).where(eq(magicCodes.token, token));
      return res.status(404).json({ message: 'No account found for this email' });
    }
    // Mark token as used
    await db.update(magicCodes).set({ usedAt: new Date() }).where(eq(magicCodes.token, token));

    // SECURITY: Enforce JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('FATAL ERROR: JWT_SECRET environment variable is required');
      return res.status(500).json(buildErrorResponse('Server configuration error', new Error('Missing JWT_SECRET')));
    }

    const { password: _, ...userData } = user;
    const jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    return res.json({ token: jwtToken, user: userData });
  } catch (error) {
    console.error('Magic verify error:', error);
    res.status(500).json(buildErrorResponse('Server error during verification', error));
  }
});

// Regular login endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info('Login attempt', { username, ip: req.ip });

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username or email
    let user = await storage.getUserByUsername(username);

    // If not found by username, try by email (supports "Username or Email" login)
    if (!user && username.includes('@')) {
      user = await storage.getUserByEmail(username);
    }

    if (!user) {
      logger.warn('Login failed - user not found', { username, ip: req.ip });
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // SECURITY: Check if account is locked out
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const remainingMs = new Date(user.lockoutUntil).getTime() - Date.now();
      const lockoutMinutes = Math.ceil(remainingMs / 60000);
      logger.warn('Login blocked - account locked', { username, userId: user.id, ip: req.ip });
      return res.status(423).json({
        message: `Account locked due to repeated failed attempts. Try again in ${lockoutMinutes} minute(s).`
      });
    }

    // Verify password using centralized utility (handles bcrypt + Argon2id)
    const passwordResult = await verifyPassword(password, user.password);

    if (!passwordResult.valid) {
      // SECURITY: Track failed attempts and lock out after 10 failures
      const newAttempts = (user.loginAttempts || 0) + 1;
      const maxAttempts = 10;
      const lockoutDuration = 2 * 60 * 60 * 1000; // 2 hours

      if (newAttempts >= maxAttempts) {
        const lockoutUntil = new Date(Date.now() + lockoutDuration);
        await storage.updateUser(user.id, {
          loginAttempts: newAttempts,
          lockoutUntil,
        });
        logger.warn('Login failed - account locked after max attempts', { username, userId: user.id, ip: req.ip });
        return res.status(423).json({
          message: 'Account locked due to too many failed login attempts. Please try again in 2 hours.'
        });
      }

      await storage.updateUser(user.id, { loginAttempts: newAttempts });
      logger.warn('Login failed - invalid password', { username, userId: user.id, ip: req.ip, attempt: newAttempts });
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // SECURITY: Reset failed login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      await storage.updateUser(user.id, {
        loginAttempts: 0,
        lockoutUntil: null,
      });
    }

    // Silently upgrade bcrypt hash to Argon2id on successful login
    if (passwordResult.upgradedHash) {
      await storage.updateUser(user.id, { password: passwordResult.upgradedHash });
    }

    // SECURITY: Block login for unverified users
    if (!user.emailVerified) {
      logger.warn('Login blocked - email not verified', { username, userId: user.id, email: user.email });
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in.',
        email: user.email,
      });
    }

    // 2FA CHECK: If user has 2FA enabled, require TOTP code
    if ((user as any).twoFactorEnabled) {
      const { totpCode } = req.body;

      if (!totpCode) {
        // First step: password correct, but 2FA code needed
        return res.status(200).json({
          requires2FA: true,
          userId: user.id,
          message: 'Two-factor authentication code required',
        });
      }

      // Verify TOTP code
      try {
        const { verifySync } = await import('otplib');
        const secret = (user as any).twoFactorSecret;

        if (!secret || !verifySync({ token: totpCode, secret }).valid) {
          logger.warn('Login failed - invalid 2FA code', { userId: user.id, ip: req.ip });
          return res.status(401).json({ message: 'Invalid two-factor authentication code' });
        }
      } catch (e) {
        logger.error('2FA verification error', { userId: user.id, error: e });
        return res.status(500).json({ message: 'Error verifying two-factor code' });
      }
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    // Generate JWT token for mobile apps (10 days for sliding session)
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const token = jwt.sign(
        { sub: user.id, email: user.email, username: user.username },
        jwtSecret,
        { expiresIn: '10d' }
      );

      logger.info('Login successful', { userId: user.id, username: user.username, method: 'jwt' });
      // Return token for mobile apps
      return res.json({ ...userData, token });
    }

    // Fallback: Session-based auth for web (if JWT not configured)
    if (req.session) {
      setSessionUserId(req, user.id);
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin || false;

      // Save session explicitly
      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json(buildErrorResponse("Error saving session", err));
        }
        res.json(userData);
      });
    } else {
      // No session and no JWT - return user data anyway
      res.json(userData);
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(buildErrorResponse("Server error during login", error));
  }
});

// SECURITY: Admin quick login endpoint disabled for security reasons
// Admins should use the regular login endpoint with their credentials

// Logout endpoint
router.post('/auth/logout', async (req, res) => {
  try {
    // For JWT-based auth (mobile apps), blacklist the token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Dynamically import to avoid circular dependency
      const { blacklistToken } = await import('../../lib/tokenBlacklist');
      blacklistToken(token);
      logger.info('Logout - JWT token blacklisted', { ip: req.ip });
      return res.json({ message: "Logged out successfully" });
    }

    // For session-based auth (web), destroy the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json(buildErrorResponse("Error logging out", err));
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Don't fail logout - just return success
    res.json({ message: "Logged out successfully" });
  }
});

// REMOVED: Get current user endpoint (redundant - shadows correct handlers with permissions)
// This endpoint was registered first via app.use('/api', authRoutes) and shadowed
// the correct /api/user handlers that return permissions.
// The correct /api/user endpoints are in:
//   - routes.ts:466 (app.get('/api/user', ...)) - returns user WITH permissions
//   - user.ts:32 (router.get('/', ...)) - returns user WITH permissions
// Removing this endpoint allows the correct handlers to execute.

// Token refresh endpoint - extends session for active users (sliding session)
// Call this when app comes to foreground to keep users logged in
router.post('/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const oldToken = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Verify the current token is valid
    let decoded: any;
    try {
      decoded = jwt.verify(oldToken, jwtSecret);
    } catch (error: any) {
      // Token is invalid or expired
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check if token is blacklisted
    const { isTokenBlacklisted } = await import('../../lib/tokenBlacklist');
    if (isTokenBlacklisted(oldToken)) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    // Get the user to ensure they still exist and are valid
    const userId = decoded.sub || decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Issue a fresh token with new 10-day expiry
    const newToken = jwt.sign(
      { sub: user.id, email: user.email, username: user.username },
      jwtSecret,
      { expiresIn: '10d' }
    );

    console.info(`[AUTH] Token refreshed for user ${user.id}`);

    // Return new token
    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// Send (or resend) verification email for a user's email address
// SECURITY: Always returns 200 to prevent email enumeration
router.post('/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email required' });

    const COOLDOWN_MS = 5 * 60 * 1000;
    const genericResponse = {
      ok: true,
      message: 'If an account with that email exists and is not yet verified, a verification email has been sent.',
    };

    const user = await storage.getUserByEmail(String(email));

    // SECURITY: Don't reveal if user exists or is already verified
    if (!user || user.emailVerified) {
      console.info('[SEND-VERIFICATION] No action needed for:', email, user ? '(already verified)' : '(not found)');
      return res.json(genericResponse);
    }

    // Rate limit resend at application level: allow once per 5 minutes
    const lastSent = (user as any).emailVerificationLastSentAt ? new Date((user as any).emailVerificationLastSentAt) : null;
    if (lastSent) {
      const delta = Date.now() - lastSent.getTime();
      if (delta < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - delta;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        // Return 429 with remaining cooldown so clients can show UI feedback
        return res.status(429).json({ message: 'Verification email recently sent; try again later', retryAfterSeconds: remainingSeconds });
      }
    }

    const apiBase = process.env.API_BASE_URL || 'https://theconnection.app';
    await createAndSendVerification(user.id, user.email, apiBase);
    console.info('[SEND-VERIFICATION] Email sent to:', email);

    return res.json(genericResponse);
  } catch (error) {
    console.error('send-verification error', error);
    // SECURITY: Don't reveal internal errors - return generic response
    res.json({
      ok: true,
      message: 'If an account with that email exists and is not yet verified, a verification email has been sent.',
    });
  }
});

// Verify token: GET or POST /api/auth/verify-email?token=... or { token }
// GET is for one-click email links, POST is for API clients
router.get('/auth/verify-email', async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Verification Error - The Connection</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Invalid Link</h1>
            <p>This verification link is invalid. Please check your email and try again.</p>
          </body>
        </html>
      `);
    }

    const user = await storage.getUserByEmailVerificationToken(String(token));
    if (!user) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Verification Error - The Connection</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { color: #dc2626; }
            </style>
          </head>
          <body>
            <h1 class="error">❌ Invalid or Expired Link</h1>
            <p>This verification link is invalid or has expired. Please request a new verification email.</p>
          </body>
        </html>
      `);
    }

    // Mark verified and clear token fields
    await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerifiedAt: new Date() as any,
      emailVerificationToken: null as any,
      emailVerificationTokenHash: null as any,
      emailVerificationExpiresAt: null as any,
      emailVerificationLastSentAt: null as any,
    } as any);

    // Success page with deep link back to app
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Email Verified - The Connection</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .success { color: #059669; }
            .button { 
              display: inline-block; 
              margin-top: 20px; 
              padding: 12px 30px; 
              background-color: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
            }
          </style>
        </head>
        <body>
          <h1 class="success">✅ Email Verified!</h1>
          <p>Your email has been successfully verified. You can now close this page and return to The Connection app.</p>
          <a href="theconnection://login" class="button">Open The Connection</a>
          <script>
            // Auto-redirect to app after 3 seconds
            setTimeout(() => {
              window.location.href = 'theconnection://login';
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('verify-email GET error', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Error - The Connection</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1 class="error">❌ Server Error</h1>
          <p>An error occurred while verifying your email. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

router.post('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'token required' });

    const user = await storage.getUserByEmailVerificationToken(String(token));
    if (!user) return res.status(400).json({ message: 'invalid or expired token' });

    await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerifiedAt: new Date() as any,
      emailVerificationToken: null as any,
      emailVerificationTokenHash: null as any,
      emailVerificationExpiresAt: null as any,
      emailVerificationLastSentAt: null as any,
    } as any);

    return res.json({ ok: true });
  } catch (error) {
    console.error('verify-email POST error', error);
    res.status(500).json(buildErrorResponse('Error verifying email', error));
  }
});

// Helper function to calculate age from date of birth
function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

// Registration endpoint
router.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, dob, ageConfirmed } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required' });
    }

    // SECURITY: Age Verification - DOB is required for COPPA/GDPR compliance
    if (!dob) {
      return res.status(400).json({ message: 'Date of birth is required to verify your age' });
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date of birth format. Use YYYY-MM-DD.' });
    }

    // Check DOB is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dobDate > today) {
      return res.status(400).json({ message: 'Date of birth cannot be in the future' });
    }

    // Check DOB is not unreasonably old (150 years)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 150);
    if (dobDate < maxAge) {
      return res.status(400).json({ message: 'Invalid date of birth' });
    }

    // SECURITY: Verify age is 13+ (COPPA compliance)
    const age = calculateAge(dobDate);
    if (age < 13) {
      console.info('[REGISTRATION] Age restriction blocked signup for user under 13');
      return res.status(403).json({
        code: 'AGE_RESTRICTED',
        message: 'You must be 13 or older to use this app.'
      });
    }

    const dobString = dobDate.toISOString().split('T')[0];

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // Create user with age assurance fields
    const user = await storage.createUser({
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: passwordHash,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      emailVerified: false,
      ...(dobString ? { dateOfBirth: dobString } : {}),
      ageGatePassed: true,
      ageVerifiedAt: new Date(),
    } as any);

    // Send email verification
    let verificationSent = false;
    try {
      const apiBase = process.env.API_BASE_URL || 'https://theconnection.app';
      await createAndSendVerification(user.id, user.email, apiBase);
      verificationSent = true;
      console.info('[REGISTRATION] Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('[REGISTRATION] Failed to send verification email:', emailError);
      // Don't fail registration if email fails - user can resend later
    }

    // SECURITY: Do NOT issue JWT/session until email is verified
    // Return success with requiresVerification flag - NO token
    const { password: _, ...userData } = user;
    return res.status(201).json({
      ...userData,
      verificationSent,
      requiresVerification: true,
      message: 'Account created! Please check your email to verify your account before logging in.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(buildErrorResponse('Server error during registration', error));
  }
});

// ============================================================================
// TWO-FACTOR AUTHENTICATION (TOTP)
// ============================================================================

import { requireAuth } from '../../middleware/auth';

// Setup 2FA: generate secret and return QR code URI
router.post('/auth/2fa/setup', requireAuth, async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user as any).twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const { generateSecret, generateURI } = await import('otplib');

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'The Connection', label: user.email, secret });

    // Store the secret temporarily (not yet enabled)
    await storage.updateUser(userId, { twoFactorSecret: secret } as any);

    res.json({
      secret,
      otpauthUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json(buildErrorResponse('Error setting up 2FA', error));
  }
});

// Verify and enable 2FA
router.post('/auth/2fa/verify', requireAuth, async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = (user as any).twoFactorSecret;
    if (!secret) {
      return res.status(400).json({ error: 'No 2FA setup in progress. Call /auth/2fa/setup first.' });
    }

    const { verifySync } = await import('otplib');

    if (!verifySync({ token: code, secret }).valid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    await storage.updateUser(userId, { twoFactorEnabled: true } as any);

    res.json({ message: 'Two-factor authentication enabled successfully' });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json(buildErrorResponse('Error verifying 2FA', error));
  }
});

// Disable 2FA (requires password confirmation)
router.post('/auth/2fa/disable', requireAuth, async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to disable 2FA' });
    }

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!(user as any).twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // Verify password
    const passwordResult = await verifyPassword(password, user.password);
    if (!passwordResult.valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable 2FA and clear secret
    await storage.updateUser(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    } as any);

    res.json({ message: 'Two-factor authentication disabled' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json(buildErrorResponse('Error disabling 2FA', error));
  }
});

export default router;

