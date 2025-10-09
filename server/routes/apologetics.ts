import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

router.get('/apologetics', (_req, res) => {
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
