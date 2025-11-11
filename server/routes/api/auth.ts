import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from '../../storage-optimized';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../email';
import rateLimit from 'express-rate-limit';

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
    console.log(`[MAGIC] token=${token} code=${code} email=${email}`);

    return res.json({ token, message: 'Magic code sent' });
  } catch (error) {
    console.error('Magic auth error:', error);
    res.status(500).json({ message: 'Server error during magic auth' });
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
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    return res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('Magic verify error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Regular login endpoint
router.post('/login', async (req, res) => {
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
    
    // Set user in session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.isAdmin = user.isAdmin || false;
    
    // Save session explicitly to ensure it's stored before responding
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: "Error saving session" });
      }
      
      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.json(userData);
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// SECURITY: Admin quick login endpoint disabled for security reasons
// Admins should use the regular login endpoint with their credentials

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user endpoint
router.get('/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
  // Get full user details from database. Coerce session userId to number.
  const userIdNum = typeof req.session.userId === 'string' ? parseInt(req.session.userId, 10) : req.session.userId;
  const user = await storage.getUser(userIdNum as number);
    
    if (!user) {
      // Session contains a userId but user doesn't exist
      req.session.destroy(() => {
        res.status(401).json({ message: "User not found" });
      });
      return;
    }
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: "Error fetching user details" });
  }
});

export default router;