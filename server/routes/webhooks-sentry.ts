/**
 * Sentry Webhook Handler
 *
 * Processes Sentry webhook events for error/alert notifications.
 * Stores alerts in the database for display in the admin dashboard.
 *
 * IMPORTANT: Never log raw request bodies or sensitive data.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { sentryAlerts } from '@shared/schema';

const router = Router();

/**
 * Verify Sentry webhook signature using HMAC-SHA256.
 * The signature is sent in the `sentry-hook-signature` header.
 */
function verifySentrySignature(body: string, signature: string): boolean {
  const secret = process.env.SENTRY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('Sentry webhook: SENTRY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract alert details from Sentry webhook payload based on resource type.
 */
function parseAlertPayload(resource: string, action: string, payload: any): {
  title: string;
  message: string | null;
  level: string | null;
  sentryUrl: string | null;
  sentryEventId: string | null;
  project: string | null;
} {
  switch (resource) {
    case 'issue': {
      const issue = payload?.data?.issue ?? payload?.data ?? {};
      return {
        title: issue.title || `Issue ${action}`,
        message: issue.culprit || issue.metadata?.value || null,
        level: issue.level || 'error',
        sentryUrl: issue.permalink || null,
        sentryEventId: issue.id?.toString() || null,
        project: issue.project?.slug || issue.project?.name || null,
      };
    }
    case 'event_alert': {
      const event = payload?.data?.event ?? {};
      return {
        title: event.title || payload?.data?.triggered_rule || `Event alert ${action}`,
        message: event.culprit || event.message || null,
        level: event.level || payload?.data?.level || 'error',
        sentryUrl: event.web_url || event.url || null,
        sentryEventId: event.event_id || event.id?.toString() || null,
        project: event.project?.slug || event.project || null,
      };
    }
    case 'metric_alert': {
      const alert = payload?.data?.metric_alert ?? payload?.data ?? {};
      return {
        title: alert.alert_rule?.name || alert.title || `Metric alert ${action}`,
        message: payload?.data?.description_text || alert.description || null,
        level: action === 'critical' ? 'fatal' : action === 'warning' ? 'warning' : 'info',
        sentryUrl: alert.web_url || null,
        sentryEventId: alert.id?.toString() || null,
        project: null,
      };
    }
    default: {
      return {
        title: `Sentry ${resource} ${action}`,
        message: null,
        level: 'info',
        sentryUrl: null,
        sentryEventId: null,
        project: null,
      };
    }
  }
}

/**
 * POST /api/webhooks/sentry - Handle Sentry webhook events
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['sentry-hook-signature'] as string;
    const resource = req.headers['sentry-hook-resource'] as string;

    // Verify webhook signature
    if (!signature || !verifySentrySignature(rawBody, signature)) {
      console.error('Sentry webhook: Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const action = (req.headers['sentry-hook-action'] as string) || 'unknown';

    // Log event type only (not full payload)
    console.info(`Sentry webhook received: ${resource}.${action}`);

    // Sentry sends an "installation" event on setup verification - acknowledge it
    if (resource === 'installation') {
      return res.status(200).json({ received: true });
    }

    const parsed = parseAlertPayload(resource, action, req.body);

    await db.insert(sentryAlerts).values({
      sentryEventId: parsed.sentryEventId,
      resource: resource || 'unknown',
      action,
      title: parsed.title,
      message: parsed.message,
      level: parsed.level,
      sentryUrl: parsed.sentryUrl,
      project: parsed.project,
      payload: req.body,
    } as any);

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Sentry webhook error:', error);
    // Return 200 anyway so Sentry doesn't retry endlessly
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
});

export default router;
