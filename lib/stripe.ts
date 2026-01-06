import Stripe from 'stripe';
import { log } from '@/lib/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Price ID mappings from environment variables
export const STRIPE_PRICES = {
  booking: {
    monthly: process.env.STRIPE_PRICE_BOOKING_MONTHLY!,
    annual: process.env.STRIPE_PRICE_BOOKING_ANNUAL!,
  },
  chatbot: {
    monthly: process.env.STRIPE_PRICE_CHATBOT_BASE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_CHATBOT_BASE_ANNUAL!,
    messages: process.env.STRIPE_PRICE_CHATBOT_MESSAGES!,
  },
  bundle: {
    monthly: process.env.STRIPE_PRICE_BUNDLE_BASE_MONTHLY!,
    annual: process.env.STRIPE_PRICE_BUNDLE_BASE_ANNUAL!,
    messages: process.env.STRIPE_PRICE_BUNDLE_MESSAGES!,
  },
  seat: {
    monthly: process.env.STRIPE_PRICE_SEAT_MONTHLY!,
    annual: process.env.STRIPE_PRICE_SEAT_ANNUAL!,
  },
} as const;

// Subscription tier types
export type SubscriptionTier = 'free' | 'booking' | 'chatbot' | 'bundle';
export type BillingInterval = 'month' | 'year';

// Get the base price ID for a tier and interval
export function getPriceId(tier: Exclude<SubscriptionTier, 'free'>, interval: BillingInterval): string {
  // Map 'month' to 'monthly' and 'year' to 'annual'
  const priceKey = interval === 'month' ? 'monthly' : 'annual';
  return STRIPE_PRICES[tier][priceKey];
}

// Get the metered price ID for chatbot tiers
export function getMeteredPriceId(tier: 'chatbot' | 'bundle'): string {
  return STRIPE_PRICES[tier].messages;
}

// Create or retrieve a Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string): Promise<string> {
  const { prisma } = await import('@/lib/prisma');

  // Check if user already has a Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Save customer ID to database
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// Create a checkout session for subscription
export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  interval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const { userId, email, tier, interval, successUrl, cancelUrl } = params;

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(userId, email);

  // Build line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: getPriceId(tier, interval),
      quantity: 1,
    },
  ];

  // Add metered pricing for chatbot and bundle tiers
  if (tier === 'chatbot' || tier === 'bundle') {
    lineItems.push({
      price: getMeteredPriceId(tier),
    });
  }

  // Create checkout session with Stripe Link enabled
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card', 'link'],
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      interval,
    },
    subscription_data: {
      metadata: {
        userId,
        tier,
        interval,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return session;
}

// Create a portal session for managing subscription
export async function createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Report metered usage to Stripe
export async function reportUsage(params: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
}): Promise<any> {
  const { subscriptionItemId, quantity, timestamp } = params;

  // Note: Usage reporting will be implemented when needed
  // For now, Stripe will automatically track usage via meter events
  log.debug('[Stripe] Usage reporting deferred to meter events', {
    subscriptionItemId,
    quantity
  });

  return { id: 'pending', quantity };
}

// Cancel a subscription at period end
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

// Reactivate a subscription that was set to cancel
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

// Get subscription by ID
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Get customer by ID
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  return await stripe.customers.retrieve(customerId) as Stripe.Customer;
}
