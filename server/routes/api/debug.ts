import express from 'express';
import Sentry from '../../lib/sentry';

const router = express.Router();

// Trigger an uncaught error to allow Sentry to capture via error middleware
router.get('/throw', (_req, _res) => {
  throw new Error('Sentry test error (uncaught)');
});

// Capture an exception manually and return success
router.get('/capture', (_req, res) => {
  try {
    throw new Error('Sentry manual capture from /api/debug/capture');
  } catch (err) {
    Sentry.captureException(err, { tags: { route: '/api/debug/capture' } });
    const eventId = Sentry.lastEventId?.() ?? null;
    res.json({ ok: true, captured: true, eventId });
  }
});

router.get('/available', (_req, res) => {
  res.json({ sentryAvailable: Sentry.isAvailable() });
});

export default router;
