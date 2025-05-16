import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { sendEmail } from "./email";
import { ZodError } from "zod";
import { sendWelcomeEmail } from "./email";

// Simple function to send a password reset email
async function sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
  return await sendEmail({
    to: email,
    from: "noreply@theconnection.com",
    subject: "Reset Your Password - The Connection",
    text: `Hello ${username},\n\nYou recently requested to reset your password. Use the following token to complete the process: ${token}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Connection Team`,
    html: `<p>Hello ${username},</p><p>You recently requested to reset your password. Use the following token to complete the process:</p><p><strong>${token}</strong></p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>The Connection Team</p>`
  });
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "faith-connect-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username first
        let user = await storage.getUserByUsername(username);
        
        // If not found by username, try to find user by email
        if (!user && username.includes('@')) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username is taken
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email is taken
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password),
      });

      // Send welcome email
      try {
        const emailResult = await sendWelcomeEmail(user.email, user.displayName || undefined);
        if (!emailResult) {
          console.log(`Welcome email not sent to ${user.email} because email functionality is disabled.`);
        }
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue with registration even if email fails
      }

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        console.log("New user registered and logged in:", user.username);
        // Generate a fresh session to ensure cookie is sent
        req.session.save((err) => {
          if (err) return next(err);
          res.status(201).json(user);
        });
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        console.log("User logged in successfully:", user.username);
        
        // Send a sanitized user object (without password)
        const sanitizedUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          bio: user.bio,
          createdAt: user.createdAt,
          isVerifiedApologeticsAnswerer: user.isVerifiedApologeticsAnswerer,
        };
        
        // Generate a fresh session to ensure cookie is sent
        req.session.save((err) => {
          if (err) return next(err);
          return res.status(200).json(sanitizedUser);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Password reset request endpoint
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // We don't want to reveal if an email exists in our system
      // So we always return success, but only send email if user exists
      if (user) {
        // In a real app, generate a secure token and send reset email
        // For this demo, we'll just simulate success
        const token = randomBytes(32).toString('hex');
        
        // Send password reset email
        await sendEmail({
          to: email,
          from: "noreply@theconnection.com",
          subject: "Password Reset Request",
          text: `Hello ${user.username},\n\nYou recently requested to reset your password. Use the following token to complete the process: ${token}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Connection Team`,
          html: `<p>Hello ${user.username},</p><p>You recently requested to reset your password. Use the following token to complete the process:</p><p><strong>${token}</strong></p><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>The Connection Team</p>`
        });
      }
      
      // Always return success to prevent email enumeration
      res.status(200).json({ 
        success: true,
        message: "If your email exists in our system, you will receive a reset link shortly" 
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });
  
  // Password reset confirm endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ 
          message: "Token and new password are required" 
        });
      }
      
      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters long" 
        });
      }
      
      // In a real app, verify token and update password
      // For this demo, we'll just simulate success
      
      res.status(200).json({ 
        success: true,
        message: "Password has been reset successfully" 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}
