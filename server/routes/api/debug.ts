import express from 'express';
import { Sentry } from '../../lib/sentry';

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
    try {
      (Sentry as any).captureException(err);
    } catch (_) {
      // ignore capture failures
    }
    const eventId = (Sentry as any).lastEventId?.() ?? null;
    res.json({ ok: true, captured: true, eventId });
  }
});

router.get('/available', (_req, res) => {
  // Sentry is available if a client has been installed on the current hub
  const client = (Sentry as any).getCurrentHub?.()?.getClient?.() ?? null;
  res.json({ sentryAvailable: !!client });
});

// Run a quick Anthropic test from inside the server process so we can
// verify Sentry AI instrumentation and transactions. Requires
// `ANTHROPIC_API_KEY` to be set in the environment and the `anthropic`
// package to be installed. This endpoint is intended for local testing.
router.get('/anthropic', async (_req, res) => {
  // Try to load Sentry SDK directly so we can start a transaction.
  let SentrySDK: any = null;
  try {
    // Use require interop for ESM/CommonJS safety
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const imported = require('@sentry/node');
    SentrySDK = (imported as any).default ?? imported;
  } catch (err) {
    // If Sentry SDK not present, continue — wrapper may still be available
  }

  // Load Anthropic SDK. Prefer the official `@anthropic-ai/sdk` package and
  // fall back to `anthropic` if present. Use `createRequire` so this works
  // from ESM runtime contexts.
  let AnthropicPkg: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    try {
      AnthropicPkg = require('@anthropic-ai/sdk');
    } catch (_) {
      AnthropicPkg = require('anthropic');
    }
  } catch (err) {
    return res.status(501).json({ ok: false, error: 'Anthropic SDK not installed' });
  }

  // Normalize to a constructor function/class
  let AnthropicCtor: any = AnthropicPkg?.default ?? AnthropicPkg;
  if (!AnthropicCtor && AnthropicPkg?.Anthropic) {
    AnthropicCtor = AnthropicPkg.Anthropic;
  }
  if (!AnthropicCtor) {
    return res.status(501).json({ ok: false, error: 'Anthropic SDK not installed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ ok: false, error: 'ANTHROPIC_API_KEY not set in environment' });
  }

  try {
    const client = new AnthropicCtor({ apiKey });

    let transaction: any = null;
    try {
      if (SentrySDK && typeof SentrySDK.startTransaction === 'function') {
        transaction = SentrySDK.startTransaction({ name: 'anthropic.request' });
        SentrySDK.getCurrentHub().configureScope((scope: any) => scope.setSpan(transaction));
      }
    } catch (err) {
      // ignore transaction start errors
    }

    // Run the Anthropic call
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Tell me a joke (test)' }],
    });

    // Add a small child span if transaction exists
    try {
      if (transaction && typeof transaction.startChild === 'function') {
        const span = transaction.startChild({ op: 'anthropic.request', description: 'create message' });
        span.setData('model', 'claude-3-5-sonnet');
        span.finish();
      }
    } catch (err) {
      // ignore
    }

    // Finish transaction
    try {
      if (transaction) transaction.finish();
    } catch (err) {
      // ignore
    }

    // Return both the Anthropic response and Sentry event/trace identifiers
    const eventId = (Sentry as any).lastEventId?.() ?? null;
    const traceId = transaction?.traceId ?? null;

    return res.json({ ok: true, captured: true, eventId, traceId, response });
  } catch (err: any) {
    // Capture exception in Sentry and return error
    try {
      (Sentry as any).captureException(err);
    } catch (_) {
      // ignore capture failures
    }

    return res.status(500).json({ ok: false, error: String(err?.message ?? err) });
  }
});

export default router;
