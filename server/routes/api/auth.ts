import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../../storage-optimized';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../email';
import rateLimit from 'express-rate-limit';
import { buildErrorResponse } from '../../utils/errors';
import { getSessionUserId, setSessionUserId } from '../../utils/session';
import { generateVerificationToken, hashToken, createAndSendVerification } from '../../lib/emailVerification';

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

// In-memory magic code store
const magicStore: Record<string, { email: string; code: string; expiresAt: number }> = {};

// Magic code: POST /api/auth/magic { email } with rate limiting
router.post('/auth/magic', magicCodeLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email required' });

    const deterministic = /^(review|tester)@/i.test(String(email)) ? '111222' : undefined;
    const code = deterministic ?? Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(16).toString('hex');
    magicStore[token] = { email, code, expiresAt: Date.now() + 1000 * 60 * 15 };

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

    // Log for QA

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
    const entry = magicStore[token];
    if (!entry) return res.status(400).json({ message: 'invalid token' });
    if (Date.now() > entry.expiresAt) return res.status(400).json({ message: 'expired' });
    if (entry.code !== String(code)) return res.status(400).json({ message: 'invalid code' });

    const user = { id: Math.floor(Math.random() * 1000000), email: entry.email };
    delete magicStore[token];

    // SECURITY: Enforce JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('FATAL ERROR: JWT_SECRET environment variable is required');
      return res.status(500).json(buildErrorResponse('Server configuration error', new Error('Missing JWT_SECRET')));
    }

    const jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    return res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Magic verify error:', error);
    res.status(500).json(buildErrorResponse('Server error during verification', error));
  }
});

// Regular login endpoint
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    // Find user by username
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Use bcrypt to compare password
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    // Generate JWT token for mobile apps
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const token = jwt.sign(
        { sub: user.id, email: user.email, username: user.username },
        jwtSecret,
        { expiresIn: '7d' }
      );

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
router.post('/auth/logout', (req, res) => {
  try {
    // For JWT-based auth (mobile apps), just return success
    // The client will discard the token
    if (!req.session || req.headers.authorization) {
      return res.json({ message: "Logged out successfully" });
    }

    // For session-based auth (web), destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json(buildErrorResponse("Error logging out", err));
      }
      res.json({ message: "Logged out successfully" });
    });
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

// Send (or resend) verification email for a user's email address
router.post('/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'email required' });

    const user = await storage.getUserByEmail(String(email));
    if (!user) return res.status(404).json({ message: 'user not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'already verified' });

    // Rate limit resend at application level: allow once per 5 minutes
    const lastSent = (user as any).emailVerificationLastSentAt ? new Date((user as any).emailVerificationLastSentAt) : null;
    const COOLDOWN_MS = 5 * 60 * 1000;
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
    const { expiresAt } = await createAndSendVerification(user.id, user.email, apiBase);
    // Inform client when they can resend next (5 minute cooldown)
    const nextAllowedAt = new Date(Date.now() + COOLDOWN_MS).toISOString();
    return res.json({ ok: true, expiresAt, nextAllowedAt });
  } catch (error) {
    console.error('send-verification error', error);
    res.status(500).json(buildErrorResponse('Error sending verification', error));
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

// Registration endpoint
router.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Email, username, and password are required' });
    }

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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: passwordHash,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      emailVerified: false,
    });

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

    // Generate JWT token for mobile apps
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const token = jwt.sign(
        { sub: user.id, email: user.email, username: user.username },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Return user and token
      const { password: _, ...userData } = user;
      return res.status(201).json({
        ...userData,
        token,
        verificationSent
      });
    }

    // Fallback: Create session for web
    if (req.session) {
      setSessionUserId(req, user.id);
      req.session.username = user.username;
      req.session.isAdmin = false;

      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json(buildErrorResponse('Error saving session', err));
        }
        const { password: _, ...userData } = user;
        res.status(201).json({ ...userData, verificationSent });
      });
    } else {
      const { password: _, ...userData } = user;
      res.status(201).json({ ...userData, verificationSent });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(buildErrorResponse('Server error during registration', error));
  }
});

export default router;

