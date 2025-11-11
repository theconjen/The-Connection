import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage-optimized";
import { User } from "@shared/schema";
import { sendWelcomeEmail } from "./email";
import { APP_DOMAIN, BASE_URL, APP_URLS } from './config/domain';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { logLogin, logLoginFailed, logLogout, logRegistration } from './audit-logger';
import { sanitizePlainText } from './xss-protection';

/**
 * Ultra Simple Auth System
 */

// Add custom session properties
declare module 'express-session' {
  interface SessionData {
    // userId may be stored as a string (session stores) or number (internal use)
    userId?: string | number;
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
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Admin-only middleware
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId && req.session.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ message: "Unauthorized: Admin access required" });
}

// Sets up the authentication system
export function setupAuth(app: Express) {
  // User registration endpoint with rate limiting
  app.post("/api/register", registerLimiter, async (req, res) => {
    try {
      let { username, email, password, displayName } = req.body;

      // SECURITY: Sanitize user inputs to prevent XSS
      username = sanitizePlainText(username);
      email = sanitizePlainText(email);
      displayName = displayName ? sanitizePlainText(displayName) : undefined;

      // Basic validation
      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Username, email, and password are required"
        });
      }
      
      // Strong password requirements
      if (password.length < 12) {
        return res.status(400).json({
          message: "Password must be at least 12 characters long"
        });
      }

      // Check for complexity: uppercase, lowercase, number, and special character
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        return res.status(400).json({
          message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        });
      }
      
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

      // Hash password with bcrypt (salt rounds: 12)
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      console.log(`[REGISTRATION] Creating user with data:`, { username, email, displayName: displayName || username });
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword, // Store hashed password
        displayName: displayName || username,
        isAdmin: false,
      });
      
      console.log(`[REGISTRATION] User created successfully:`, { 
        id: user.id, 
        username: user.username, 
        idType: typeof user.id,
        userObject: JSON.stringify(user, null, 2)
      });

      // Send welcome email (ignore errors)
      try {
        await sendWelcomeEmail(user.email, user.displayName || username);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }

      // SECURITY: Log registration for audit trail
      await logRegistration(user.id, user.username, user.email, req);

      // Log the user in - ensure session exists first
      if (!req.session) {
        console.error("[REGISTRATION] No session available on request");
        return res.status(500).json({ message: "Session initialization failed" });
      }
      
      console.log(`[REGISTRATION] Before setting session data - Current session:`, {
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        currentUserId: req.session?.userId,
        currentUsername: req.session?.username
      });
      
      req.session.userId = user.id.toString();
      req.session.username = user.username;
      req.session.isAdmin = user.isAdmin || false;
      
      console.log(`[REGISTRATION] After setting session data for user ${user.username}:`, {
        userId: req.session.userId,
        username: req.session.username,
        isAdmin: req.session.isAdmin,
        sessionID: req.sessionID,
        userIdType: typeof req.session.userId,
        originalUserId: user.id,
        originalUserIdType: typeof user.id
      });
      
      // Save session and return user data
      req.session.save((err) => {
        if (err) {
          console.error("[REGISTRATION] Session save error:", err);
          return res.status(500).json({ message: "Error creating session" });
        }
        
        console.log(`[REGISTRATION] Session saved successfully for user ${user.username} (ID: ${user.id}), Session ID: ${req.sessionID}`);
        console.log(`[REGISTRATION] Final session state after save:`, {
          userId: req.session?.userId,
          username: req.session?.username,
          isAdmin: req.session?.isAdmin,
          sessionID: req.sessionID
        });
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Error creating user" });
    }
  });

  // Login endpoint with rate limiting
  app.post("/api/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      console.log(`Login attempt for username: ${username}`);
      
      try {
        // Find user by username
        let user = await storage.getUserByUsername(username);
        
        // If not found by username, try by email
        if (!user && username.includes('@')) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user) {
          console.log(`User not found: ${username}`);
          // SECURITY: Log failed login attempt
          await logLoginFailed(username, 'User not found', req);
          return res.status(401).json({ message: "Invalid username or password" });
        }

        // SECURITY: Check if account is locked out
        if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
          const lockoutMinutes = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
          console.log(`Account locked for user: ${username}, ${lockoutMinutes} minutes remaining`);
          await logLoginFailed(username, 'Account locked', req);
          return res.status(423).json({
            message: `Account is locked due to too many failed login attempts. Please try again in ${lockoutMinutes} minute(s).`
          });
        }

        // Check password using bcrypt
        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
          console.log(`Invalid password for user: ${username}`);

          // SECURITY: Increment failed login attempts
          const newAttempts = (user.loginAttempts || 0) + 1;
          const maxAttempts = 5;
          const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

          if (newAttempts >= maxAttempts) {
            // Lock the account
            const lockoutUntil = new Date(Date.now() + lockoutDuration);
            await storage.updateUser(user.id, {
              loginAttempts: newAttempts,
              lockoutUntil: lockoutUntil,
            });

            console.log(`Account locked for user: ${username} after ${maxAttempts} failed attempts`);
            await logLoginFailed(username, `Account locked after ${maxAttempts} attempts`, req);

            return res.status(423).json({
              message: `Account locked due to too many failed login attempts. Please try again in 15 minutes.`
            });
          } else {
            // Increment attempts but don't lock yet
            await storage.updateUser(user.id, {
              loginAttempts: newAttempts,
            });

            console.log(`Failed login attempt ${newAttempts}/${maxAttempts} for user: ${username}`);
            await logLoginFailed(username, `Invalid password (attempt ${newAttempts}/${maxAttempts})`, req);

            return res.status(401).json({
              message: `Invalid username or password. ${maxAttempts - newAttempts} attempt(s) remaining before account lockout.`
            });
          }
        }

        // SECURITY: Reset failed login attempts on successful login
        if (user.loginAttempts && user.loginAttempts > 0) {
          await storage.updateUser(user.id, {
            loginAttempts: 0,
            lockoutUntil: null,
          });
        }
        
        // Save user ID in session
        req.session.userId = user.id.toString();
        req.session.username = user.username;
        req.session.isAdmin = user.isAdmin || false;
        req.session.email = user.email;
        
        console.log(`Setting session data for user ${username}:`, {
          userId: req.session.userId,
          username: req.session.username,
          sessionID: req.sessionID
        });
        
        // Create session and return user data
        req.session.save(async (err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Error creating session" });
          }

          console.log(`User logged in successfully: ${username} (ID: ${user.id}), Session saved with ID: ${req.sessionID}`);

          // SECURITY: Log successful login
          await logLogin(user.id, user.username, req);

          // Return user data without password
          const { password, ...userWithoutPassword } = user;
          return res.status(200).json(userWithoutPassword);
        });
      } catch (error) {
        console.error(`Error retrieving user ${username}:`, error);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // SECURITY: Admin login endpoint disabled for security reasons
  // Admins should use the regular login endpoint with their credentials
  // If you need to access admin functions, create an admin user with proper credentials
  // and use the regular /api/login endpoint

  // Logout endpoint
  app.post("/api/logout", async (req, res) => {
    if (req.session && req.session.userId) {
      const userId = parseInt(String(req.session.userId));
      const username = req.session.username || 'unknown';

      // SECURITY: Log logout for audit trail
      await logLogout(userId, username, req);

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging out" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Already logged out" });
    }
  });

  // Current user endpoint
  app.get("/api/user", async (req, res) => {
    try {
      console.log(`/api/user request - SessionID: ${req.sessionID}, Session data:`, {
        hasSession: !!req.session,
        userId: req.session?.userId,
        username: req.session?.username,
        sessionID: req.sessionID
      });
      
      if (!req.session || !req.session.userId) {
        console.log("Authentication failed - no session or userId");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      try {
  const userId = parseInt(String(req.session.userId));
        const user = await storage.getUser(userId);
        
        if (!user) {
          // Session exists but user doesn't - clear session
          req.session.destroy((err) => {
            if (err) console.error("Error destroying invalid session:", err);
          });
          return res.status(401).json({ message: "User not found" });
        }
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      } catch (error) {
        console.error(`Error retrieving user ID ${req.session.userId}:`, error);
        return res.status(500).json({ message: "Database error" });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
}
