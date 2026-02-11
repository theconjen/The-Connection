/**
 * Stripe Payment Routes
 *
 * Handles checkout sessions, billing portal, and webhooks for church subscriptions.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireOrgAdminOr404 } from '../middleware/org-admin';
import { requireSessionUserId } from '../utils/session';
import {
  isStripeConfigured,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  verifyWebhookSignature,
  mapStripeStatus,
} from '../services/stripeService';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/stripe/config - Check if Stripe is configured
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    configured: isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
});

/**
 * POST /api/stripe/checkout/:orgId - Create checkout session for plan upgrade
 */
router.post('/checkout/:orgId', requireAuth, requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    // Only owner can manage billing
    const userRole = await storage.getUserRoleInOrg(org.id, userId);
    if (userRole !== 'owner') {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Payments are not configured' });
    }

    const schema = z.object({
      tier: z.enum(['stewardship', 'partner']),
    });
    const { tier } = schema.parse(req.body);

    // Get existing billing info
    const billing = await storage.getOrgBilling(org.id);
    const user = await storage.getUser(userId);

    // Build URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/org-admin/${org.id}?tab=plan&success=true`;
    const cancelUrl = `${baseUrl}/org-admin/${org.id}?tab=plan&canceled=true`;

    const session = await createCheckoutSession({
      orgId: org.id,
      orgName: org.name,
      tier,
      successUrl,
      cancelUrl,
      customerEmail: user?.email,
      existingCustomerId: billing?.stripeCustomerId || undefined,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/stripe/portal/:orgId - Create billing portal session
 */
router.post('/portal/:orgId', requireAuth, requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    // Only owner can access billing portal
    const userRole = await storage.getUserRoleInOrg(org.id, userId);
    if (userRole !== 'owner') {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!isStripeConfigured()) {
      return res.status(400).json({ error: 'Payments are not configured' });
    }

    const billing = await storage.getOrgBilling(org.id);
    if (!billing?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const returnUrl = `${baseUrl}/org-admin/${org.id}?tab=plan`;

    const session = await createBillingPortalSession({
      customerId: billing.stripeCustomerId,
      returnUrl,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * POST /api/stripe/cancel/:orgId - Cancel subscription (downgrade to free)
 */
router.post('/cancel/:orgId', requireAuth, requireOrgAdminOr404(), async (req: Request, res: Response) => {
  try {
    const org = (req as any).org;
    const userId = requireSessionUserId(req);

    // Only owner can cancel
    const userRole = await storage.getUserRoleInOrg(org.id, userId);
    if (userRole !== 'owner') {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!isStripeConfigured()) {
      // If Stripe not configured, just update billing directly
      await storage.updateOrgBilling(org.id, {
        tier: 'free',
        status: 'inactive',
      });
      return res.json({ success: true });
    }

    const billing = await storage.getOrgBilling(org.id);
    if (!billing?.stripeSubscriptionId) {
      // No subscription, just update to free
      await storage.updateOrgBilling(org.id, {
        tier: 'free',
        status: 'inactive',
      });
      return res.json({ success: true });
    }

    // Cancel at period end
    await cancelSubscription(billing.stripeSubscriptionId);

    // Log activity
    await storage.logOrganizationActivity({
      organizationId: org.id,
      actorId: userId,
      action: 'subscription_canceled',
      targetType: 'billing',
      metadata: { previousTier: billing.tier },
    });

    res.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/stripe/webhook - Handle Stripe webhook events
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_failed: Payment failed
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Get raw body for signature verification (saved by express.json verify callback)
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      console.error('Stripe webhook: rawBody not available');
      return res.status(400).json({ error: 'Raw body not available' });
    }
    const event = verifyWebhookSignature(rawBody, signature);

    if (!event) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.info(`Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const orgId = parseInt(session.metadata?.orgId, 10);
        const tier = session.metadata?.tier;

        if (orgId && tier) {
          // Get or create billing record
          let billing = await storage.getOrgBilling(orgId);

          if (billing) {
            await storage.updateOrgBilling(orgId, {
              tier,
              status: 'active',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            });
          } else {
            await storage.createOrgBilling({
              organizationId: orgId,
              tier,
              status: 'active',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            });
          }

          console.info(`Org ${orgId} upgraded to ${tier}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const orgId = parseInt(subscription.metadata?.orgId, 10);

        if (orgId) {
          const status = mapStripeStatus(subscription.status);
          await storage.updateOrgBilling(orgId, {
            status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const orgId = parseInt(subscription.metadata?.orgId, 10);

        if (orgId) {
          // Downgrade to free
          await storage.updateOrgBilling(orgId, {
            tier: 'free',
            status: 'canceled',
            stripeSubscriptionId: null,
          });
          console.info(`Org ${orgId} downgraded to free`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscription = invoice.subscription;

        // Find org by subscription ID and update status
        // This is a simplified approach - in production, query by subscription ID
        console.warn(`Payment failed for subscription: ${subscription}`);
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
