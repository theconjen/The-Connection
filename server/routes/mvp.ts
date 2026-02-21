import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { sendEmail } from '../email';
import { buildErrorResponse } from '../utils/errors';
import { storage } from '../storage-optimized';

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

// In-memory feed for MVP (volatile)
const feed: Array<{ id: string; text: string; createdAt: string; author?: string; communityId?: number }> = [];

// Simple magic link/code store (in-memory)
const magicStore: Record<string, { email: string; code: string; expiresAt: number }> = {};

// Helper to send magic code via email (plain text)
async function sendMagicCode(email: string, code: string) {
  try {
    await sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'no-reply@theconnection.app',
      subject: 'Your The Connection login code',
      text: `Your login code is: ${code}\n\nIt expires in 15 minutes.`,
    });
  } catch (err) {
    // In mock mode sendEmail logs; swallow errors to not block login
    console.warn('[MAGIC] sendMagicCode failed (continuing):', err);
  }
}

// POST /api/auth/magic { email } with rate limiting
router.post('/auth/magic', magicCodeLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'email required' });

  // SECURITY: Only allow deterministic codes via env vars (for App Store review)
  const reviewEmail = process.env.APP_REVIEW_EMAIL;
  const reviewCode = process.env.APP_REVIEW_CODE;
  const deterministic = (reviewEmail && reviewCode && String(email).toLowerCase() === reviewEmail.toLowerCase()) ? reviewCode : undefined;
  const code = deterministic ?? Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(16).toString('hex');
  magicStore[token] = { email, code, expiresAt: Date.now() + 1000 * 60 * 15 };

  // Email the code (mock-friendly)
  await sendMagicCode(email, code);

  // Also log for easy QA/TestFlight review

  return res.json({ token, message: 'Magic code sent' });
});

// POST /api/auth/verify { token, code } => { token: jwt, user } with rate limiting
router.post('/auth/verify', magicVerifyLimiter, async (req, res) => {
  const { token, code } = req.body || {};
  const entry = magicStore[token];
  if (!entry) return res.status(400).json({ message: 'invalid token' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ message: 'expired' });
  if (entry.code !== String(code)) return res.status(400).json({ message: 'invalid code' });

  // SECURITY: Look up real user by email instead of generating synthetic ID
  const user = await storage.getUserByEmail(entry.email);
  if (!user) {
    delete magicStore[token];
    return res.status(404).json({ message: 'No account found for this email' });
  }
  delete magicStore[token];

  // SECURITY: Enforce JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is required');
    return res.status(500).json(buildErrorResponse('Server configuration error', new Error('Missing JWT_SECRET')));
  }

  const { password: _, ...userData } = user;
  const jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
  return res.json({ token: jwtToken, user: userData });
});

// GET /api/feed - read-only array of posts (kept for MVP in-memory; real feed lives in /api/feed router)
router.get('/feed', (_req, res) => {
  const items = feed.slice().reverse().slice(0, 100);
  res.json(items);
});

// POST /api/posts { text, author?, communityId? }
router.post('/posts', (req, res) => {
  const { text, author, communityId } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ message: 'text required' });
  const content = text.trim();
  if (content.length === 0 || content.length > 500) return res.status(400).json({ message: 'text must be 1-500 chars' });

  const id = crypto.randomBytes(8).toString('hex');
  const createdAt = new Date().toISOString();
  const post = { id, text: content, createdAt, author, communityId: communityId ? Number(communityId) : undefined };
  feed.push(post);

  res.status(201).json(post);
});

// POST /api/metrics { name }
router.post('/metrics', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name required' });
  res.json({ ok: true });
});

export default router;
