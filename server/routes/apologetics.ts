import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

// Set up rate limiter for /apologetics: max 100 requests per 15 minutes per IP
const apologeticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit headers
});

const router = Router();

router.get('/apologetics', apologeticsLimiter, (_req, res) => {
  try {
    const env = process.env.NODE_ENV || 'development';
    const candidates = [
      path.resolve(process.cwd(), 'web', 'public', 'apologetics.json'),
      path.resolve(process.cwd(), 'public', 'apologetics.json'),
      path.resolve(process.cwd(), 'dist', 'public', 'apologetics.json'),
    ];
    for (const file of candidates) {
      if (fs.existsSync(file)) {
        const data = fs.readFileSync(file, 'utf-8');
        return res.json(JSON.parse(data));
      }
    }
    return res.json([]);
  } catch (err) {
    console.error('Error serving apologetics:', err);
    return res.json([]);
  }
});

export default router;
