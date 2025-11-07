import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../email';

const router = Router();

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

// POST /api/auth/magic { email }
router.post('/auth/magic', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'email required' });

  // Deterministic code for reviewer/demo accounts
  const deterministic = /^(review|tester)@/i.test(String(email)) ? '111222' : undefined;
  const code = deterministic ?? Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(16).toString('hex');
  magicStore[token] = { email, code, expiresAt: Date.now() + 1000 * 60 * 15 };

  // Email the code (mock-friendly)
  await sendMagicCode(email, code);

  // Also log for easy QA/TestFlight review
  console.log(`[MVP MAGIC] token=${token} code=${code} email=${email}`);

  return res.json({ token, message: 'Magic code sent' });
});

// POST /api/auth/verify { token, code } => { token: jwt, user }
router.post('/auth/verify', async (req, res) => {
  const { token, code } = req.body || {};
  const entry = magicStore[token];
  if (!entry) return res.status(400).json({ message: 'invalid token' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ message: 'expired' });
  if (entry.code !== String(code)) return res.status(400).json({ message: 'invalid code' });

  const user = { id: Math.floor(Math.random() * 1000000), email: entry.email };
  delete magicStore[token];

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
  const jwtToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '30d' });
  return res.json({ token: jwtToken, user });
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

  console.log('[MVP] New post created:', { id, author });
  res.status(201).json(post);
});

// POST /api/metrics { name }
router.post('/metrics', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'name required' });
  console.log('[METRIC]', name);
  res.json({ ok: true });
});

export default router;
