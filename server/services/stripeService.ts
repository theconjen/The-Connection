/**
 * Stripe Service - Church subscription payments
 *
 * Handles checkout sessions, subscriptions, and webhooks.
 * IMPORTANT: Never expose Stripe secret key or sensitive data to clients.
 */

import Stripe from 'stripe';

// Initialize Stripe (only if secret key is configured)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Price IDs from environment (configured in Stripe Dashboard)
const PRICE_IDS: Record<string, string | undefined> = {
  stewardship: process.env.STRIPE_PRICE_STEWARDSHIP,
  partner: process.env.STRIPE_PRICE_PARTNER,
};

/**
 * Check if Stripe is configured and available
 */
export function isStripeConfigured(): boolean {
  return !!stripe && !!stripeSecretKey;
}

/**
 * Create a checkout session for upgrading to a paid plan
 */
export async function createCheckoutSession(params: {
  orgId: number;
  orgName: string;
  tier: 'stewardship' | 'partner';
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  existingCustomerId?: string;
}): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const priceId = PRICE_IDS[params.tier];
  if (!priceId) {
    throw new Error(`Price ID not configured for tier: ${params.tier}`);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      orgId: params.orgId.toString(),
      tier: params.tier,
    },
    subscription_data: {
      metadata: {
        orgId: params.orgId.toString(),
        tier: params.tier,
      },
    },
  };

  // Use existing customer or create new one
  if (params.existingCustomerId) {
    sessionParams.customer = params.existingCustomerId;
  } else {
    sessionParams.customer_email = params.customerEmail;
    sessionParams.customer_creation = 'always';
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Create a billing portal session for managing subscription
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return { url: session.url };
}

/**
 * Cancel a subscription (downgrades to free at period end)
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Cancel at period end (gives user access until their billing period ends)
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Verify and parse a webhook event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    return null;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Map Stripe subscription status to our billing status
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'inactive';
  }
}
