import express from "express";
import Stripe from "stripe";
import { db } from "../db";
import { organizations, organizationUsers } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = express.Router();

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil"
  });
}

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Create checkout session for organization plan upgrade
router.post("/checkout", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ message: "Stripe not configured" });
    }

    const { organizationId, plan } = req.body;
    
    const orgIdNum = parseInt(organizationId);

    // Verify user is admin of the organization
    const currentUserId = typeof req.session!.userId === "string"
      ? parseInt(req.session!.userId as any)
      : (req.session!.userId as number);

    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, orgIdNum),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    // Get organization details
    const [organization] = await db
      .select()
      .from(organizations)
  .where(eq(organizations.id, orgIdNum))
      .limit(1);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price: plan === "premium"
          ? process.env.STRIPE_PREMIUM_PRICE!
          : process.env.STRIPE_STANDARD_PRICE!,
        quantity: 1
      }],
      metadata: {
        organizationId: orgIdNum.toString(),
        plan
      },
      success_url: `${process.env.BASE_URL || 'http://localhost:5000'}/organizations/${orgIdNum}?success=true`,
      cancel_url: `${process.env.BASE_URL || 'http://localhost:5000'}/organizations/${orgIdNum}?canceled=true`,
      customer_email: (req.session!.email as string) || undefined,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

// Webhook handler for Stripe events
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ message: "Stripe not configured" });
  }

  let event: Stripe.Event;

  try {
    const sig = req.headers["stripe-signature"] as string;
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Webhook secret not configured" });
    }

    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.organizationId) {
          const organizationId = parseInt(session.metadata.organizationId);
          const plan = session.metadata.plan || "standard";
          
          // Update organization plan
          await db
            .update(organizations)
            .set({
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              updatedAt: new Date()
            })
            .where(eq(organizations.id, organizationId));
            
          console.log(`✅ Organization ${organizationId} upgraded to ${plan} plan`);
        }
        break;
        
      case "invoice.payment_succeeded":
  const invoice = event.data.object as Stripe.Invoice;
  console.log(`✅ Payment succeeded for subscription ${(invoice as any).subscription}`);
        break;
        
      case "invoice.payment_failed":
  const failedInvoice = event.data.object as Stripe.Invoice;
  console.log(`❌ Payment failed for subscription ${(failedInvoice as any).subscription}`);
        // Could implement logic to downgrade organization plan
        break;
        
      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        
        // Downgrade organization to free plan
        await db
          .update(organizations)
          .set({
            plan: "free",
            stripeSubscriptionId: null,
            updatedAt: new Date()
          })
          .where(eq(organizations.stripeSubscriptionId, subscription.id));
          
        console.log(`✅ Subscription ${subscription.id} cancelled, organization downgraded to free`);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(400).json({ message: "Error processing webhook" });
  }

  res.json({ received: true });
});

// Get billing information for organization
router.get("/billing/:organizationId", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(400).json({ message: "Stripe not configured" });
    }

    const organizationId = parseInt(req.params.organizationId);
    
    // Verify user is admin of the organization
    const currentUserId = typeof req.session!.userId === "string"
      ? parseInt(req.session!.userId as any)
      : (req.session!.userId as number);

    const adminCheck = await db
      .select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, organizationId),
        eq(organizationUsers.userId, currentUserId),
        eq(organizationUsers.role, "admin")
      ))
      .limit(1);

    if (adminCheck.length === 0) {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!organization || !organization.stripeCustomerId) {
      return res.json({ plan: organization?.plan || "free", billing: null });
    }

    // Get customer billing information
    const customer = await stripe.customers.retrieve(organization.stripeCustomerId);
    
    let subscription = null;
    if (organization.stripeSubscriptionId) {
      subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId);
    }

    res.json({
      plan: organization.plan,
      billing: {
        customer,
        subscription
      }
    });
  } catch (error) {
    console.error("Error fetching billing info:", error);
    res.status(500).json({ message: "Failed to fetch billing information" });
  }
});

export default router;