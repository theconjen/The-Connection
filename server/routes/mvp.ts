import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory feed for MVP (volatile)
const feed: Array<{ id: string; text: string; createdAt: string; author?: string }> = [];

// Simple magic link flow: POST /api/auth/magic { email }
// This will "send" a code to console (mock) and store a short-lived token map in-memory.
const magicStore: Record<string, { email: string; code: string; expiresAt: number }> = {};

router.post('/auth/magic', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'email required' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(16).toString('hex');
  magicStore[token] = { email, code, expiresAt: Date.now() + 1000 * 60 * 15 };

  // Mock email: print to console for TestFlight / local debugging
  console.log(`[MVP MAGIC] token=${token} code=${code} email=${email}`);

  return res.json({ token, message: 'Mock magic link sent (check server console for code)' });
});

// POST /api/auth/verify { token, code }
router.post('/auth/verify', async (req, res) => {
  const { token, code } = req.body || {};
  const entry = magicStore[token];
  if (!entry) return res.status(400).json({ message: 'invalid token' });
  if (Date.now() > entry.expiresAt) return res.status(400).json({ message: 'expired' });
  if (entry.code !== String(code)) return res.status(400).json({ message: 'invalid code' });

  // Create a minimal session object - for MVP we'll return a stub user
  const user = { id: Math.floor(Math.random() * 1000000), email: entry.email };

  // Optionally clear the magic entry
  delete magicStore[token];

  // NOTE: we don't set server session here (stateless for MVP). Client can store user.
  return res.json({ user });
});

// GET /api/feed - read-only array of posts
router.get('/feed', (req, res) => {
  // Return most recent items first
  const items = feed.slice().reverse();
  res.json(items);
});

// POST /api/posts { text, author? }
router.post('/posts', (req, res) => {
  const { text, author } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ message: 'text required' });

  const id = crypto.randomBytes(8).toString('hex');
  const createdAt = new Date().toISOString();
  const post = { id, text, createdAt, author };
  feed.push(post);

  console.log('[MVP] New post created:', { id, author });

  // Emit a quick metric (console); in future this can POST to /metrics
  console.log('[METRIC] post_created');

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
