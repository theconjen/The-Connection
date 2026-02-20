import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage-optimized";
import { User, insertUserSchema } from "@shared/schema";
import { sendWelcomeEmail, sendEmail } from "./email";
import { createAndSendVerification } from "./lib/emailVerification";
import { APP_DOMAIN, BASE_URL, APP_URLS } from './config/domain';
import { hashPassword, verifyPassword } from './utils/passwords';
import rateLimit from 'express-rate-limit';
import { logLogin, logLoginFailed, logLogout, logRegistration } from './audit-logger';
import { sanitizePlainText } from './xss-protection';
import { z } from "zod";
import crypto from "crypto";
import { verifyRecaptchaToken } from "./utils/recaptcha";
import { buildErrorResponse } from "./utils/errors";
import { getSessionUserId, setSessionUserId } from './utils/session';

/**
 * Ultra Simple Auth System
 */

// Add custom session properties
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    isAdmin?: boolean;
    email?: string;
    isVerifiedApologeticsAnswerer?: boolean;
    loginAttempts?: number;
    lastLoginAttempt?: number;
  }
}

// SECURITY: Rate limiters for authentication endpoints
// Login rate limiter: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Registration rate limiter: 3 registrations per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per windowMs
  message: 'Too many registration attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiter: 3 attempts per hour
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Export authentication check middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const userId = getSessionUserId(req);
  if (userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Admin-only middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = getSessionUserId(req);
  if (userId && req.session?.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ message: "Unauthorized: Admin access required" });
}

// Sets up the authentication system
export function setupAuth(app: Express) {
  const registrationSchema = insertUserSchema.extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    displayName: z.string().min(0).optional(),
    phoneNumber: z.string().optional(),
  });

  // User registration endpoint with rate limiting
  app.post("/api/register", registerLimiter, async (req, res) => {
    try {
      const recaptchaToken = typeof req.body.recaptchaToken === 'string' ? req.body.recaptchaToken : undefined;
      const recaptchaValid = await verifyRecaptchaToken(recaptchaToken);
      if (!recaptchaValid) {
        return res.status(400).json({ message: "reCAPTCHA verification failed" });
      }

      const sanitizedPayload = {
        username: sanitizePlainText(req.body.username),
        email: sanitizePlainText(req.body.email),
        password: req.body.password,
        displayName: req.body.displayName ? sanitizePlainText(req.body.displayName) : undefined,
        phoneNumber: req.body.phoneNumber ? sanitizePlainText(req.body.phoneNumber) : undefined,
      };

      const parsed = registrationSchema.safeParse(sanitizedPayload);
      if (!parsed.success) {
        const firstError = parsed.error.issues?.[0];
        return res.status(400).json({
          message: firstError?.message ?? "Invalid registration data",
        });
      }
      const { username, email, password, displayName, phoneNumber } = parsed.data;
      const normalizedPhone = phoneNumber ? phoneNumber.replace(/[^+\d]/g, '') : undefined;
      
      // Check if username is taken
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email is taken
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }

      // Hash password with Argon2id
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword, // Store hashed password
        displayName: displayName || username,
        isAdmin: false,
        phoneNumber: normalizedPhone || undefined,
      });

      // Send verification email using new system with branded template
      const apiBase = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'https://the-connection.onrender.com';
      try {
        await createAndSendVerification(user.id, user.email, apiBase);
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }

      // SMS verification code for phone verification
      if (normalizedPhone) {
        const smsVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await storage.updateUser(user.id, {
          smsVerificationCode,
          smsVerified: false,
        });
      }

      // SECURITY: Log registration for audit trail
      await logRegistration(user.id, user.username, user.email, req);

      // Return success without logging in - user must verify email first
      return res.status(201).json({
        message: "Registration successful! Please check your email to verify your account.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName
        },
        requiresVerification: true
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json(buildErrorResponse("Error creating user", error));
    }
  });

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }
      const user = await storage.getUserByEmailVerificationToken(token);
      if (!user) {
        return res.status(404).json({ message: "Invalid or expired token" });
      }
      await storage.updateUser(user.id, { emailVerified: true, emailVerificationToken: null });
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json(buildErrorResponse("Failed to verify email", error));
    }
  });

  app.post("/api/auth/request-email-verification", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(String(req.session!.userId));
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const token = crypto.randomBytes(32).toString('hex');
      await storage.updateUser(userId, { emailVerificationToken: token, emailVerified: false });
      try {
        await sendEmail({
          to: user.email,
          from: process.env.EMAIL_FROM || 'noreply@theconnection.app',
          subject: "Verify your email",
          html: `<p>Use this token to verify your email: <strong>${token}</strong></p>`,
        });
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }
      res.json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Error requesting verification email:", error);
      res.status(500).json(buildErrorResponse("Failed to send verification email", error));
    }
  });

  app.post("/api/auth/request-sms-code", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(String(req.session!.userId));
      const phoneNumberRaw = typeof req.body?.phoneNumber === 'string' ? req.body.phoneNumber : '';
      if (!phoneNumberRaw) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const normalizedPhone = sanitizePlainText(phoneNumberRaw).replace(/[^+\d]/g, '');
      if (!normalizedPhone) {
        return res.status(400).json({ message: "Invalid phone number" });
      }
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await storage.updateUser(userId, {
        phoneNumber: normalizedPhone,
        smsVerificationCode: code,
        smsVerified: false,
      });
      res.json({ message: "SMS verification code generated" });
    } catch (error) {
      console.error("Error requesting SMS code:", error);
      res.status(500).json(buildErrorResponse("Failed to generate SMS code", error));
    }
  });

  app.post("/api/auth/verify-sms-code", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(String(req.session!.userId));
      const submittedCode = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      if (!submittedCode) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      const user = await storage.getUser(userId);
      if (!user || !user.smsVerificationCode) {
        return res.status(400).json({ message: "No SMS code on record" });
      }
      if (user.smsVerificationCode !== submittedCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      await storage.updateUser(userId, { smsVerified: true, smsVerificationCode: null });
      res.json({ message: "SMS verified successfully" });
    } catch (error) {
      console.error("SMS verification error:", error);
      res.status(500).json(buildErrorResponse("Failed to verify SMS", error));
    }
  });

  // Login endpoint with rate limiting
  app.post("/api/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      
      try {
        // Find user by username
        let user = await storage.getUserByUsername(username);
        
        // If not found by username, try by email
        if (!user && username.includes('@')) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user) {
          // SECURITY: Log failed login attempt
          await logLoginFailed(username, 'User not found', req);
          return res.status(401).json({ message: "Invalid username or password" });
        }

        // SECURITY: Check if account is locked out
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
          const remainingMs = new Date(user.lockoutUntil).getTime() - Date.now();
          const lockoutMinutes = Math.ceil(remainingMs / 60000);
          await logLoginFailed(username, 'Account locked', req);
          return res.status(423).json({
            message: `Account locked due to repeated failed attempts. Try again in ${lockoutMinutes} minute(s).`
          });
        }

        // Check password using centralized verifyPassword (handles bcrypt + Argon2id)
        const passwordResult = await verifyPassword(password, user.password);
        if (!passwordResult.valid) {

          const newAttempts = (user.loginAttempts || 0) + 1;
          const maxAttempts = 10;
          const lockoutDuration = 2 * 60 * 60 * 1000;

          if (newAttempts >= maxAttempts) {
            const lockoutUntil = new Date(Date.now() + lockoutDuration);
            await storage.updateUser(user.id, {
              loginAttempts: newAttempts,
              lockoutUntil,
            });

            await logLoginFailed(username, `Account locked after ${maxAttempts} attempts`, req);

            return res.status(423).json({
              message: `Account locked due to too many failed login attempts. Please try again in 2 hours.`
            });
          }

          await storage.updateUser(user.id, { loginAttempts: newAttempts });
          await logLoginFailed(username, `Invalid password (attempt ${newAttempts}/${maxAttempts})`, req);

          return res.status(401).json({
            message: `Invalid username or password. ${maxAttempts - newAttempts} attempt(s) remaining before lockout.`
          });
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

        if (!user.emailVerified) {
          // User not verified - send verification email with new branded template
          const apiBase = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'https://the-connection.onrender.com';
          try {
            await createAndSendVerification(user.id, user.email, apiBase);
          } catch (error) {
            console.error("Failed to send verification email during login:", error);
          }

          return res.status(403).json({ 
            message: "Please verify your email before logging in. A new verification email has been sent.",
            requiresVerification: true 
          });
        }
        setSessionUserId(req, user.id);
        req.session.username = user.username;
        req.session.isAdmin = user.isAdmin || false;
        req.session.email = user.email;

        // Create session and return user data
        req.session.save(async (err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json(buildErrorResponse("Error creating session", err));
          }

          console.info(`Session saved with ID: ${req.sessionID}`);

          // SECURITY: Log successful login
          await logLogin(user.id, user.username, req);

          // Generate JWT token for mobile apps
          const jwtSecret = process.env.JWT_SECRET;
          let jwtToken = null;
          if (jwtSecret) {
            try {
              const jwt = require('jsonwebtoken');
              jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
            } catch (error) {
              console.error('Error generating JWT:', error);
            }
          }

          // Return user data without password, with optional JWT token
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json({
            ...userWithoutPassword,
            token: jwtToken, // JWT token for mobile apps (null if JWT_SECRET not configured)
          });
        });
      } catch (error) {
        console.error(`Error retrieving user ${username}:`, error);
        return res.status(500).json(buildErrorResponse("Database error", error));
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json(buildErrorResponse("Server error", error));
    }
  });

  // SECURITY: Admin login endpoint disabled for security reasons
  // Admins should use the regular login endpoint with their credentials
  // If you need to access admin functions, create an admin user with proper credentials
  // and use the regular /api/login endpoint

  // Logout endpoint
  app.post("/api/logout", async (req, res) => {
    const userId = getSessionUserId(req);

    if (userId && req.session) {
      const username = req.session.username || 'unknown';

      // SECURITY: Log logout for audit trail
      await logLogout(userId, username, req);

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json(buildErrorResponse("Error logging out", err));
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });

  // Current user endpoint has been moved to routes.ts to include permissions
}
