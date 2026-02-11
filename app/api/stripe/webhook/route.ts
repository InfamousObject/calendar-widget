import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { log } from '@/lib/logger';

// Disable body parsing for webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    log.error('Webhook signature verification failed', { message: error?.message });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  log.info('[Webhook] Received event', { type: event.type, id: event.id });

  // Check if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId: event.id }
  });

  if (existing?.processed) {
    log.info('[Webhook] Event already processed', { eventId: event.id });
    return NextResponse.json({ received: true });
  }

  // Create idempotency record
  await prisma.webhookEvent.create({
    data: {
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
      processed: false
    }
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        log.debug('[Webhook] Unhandled event type', { type: event.type });
    }

    // Mark as processed after successful handling
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processed: true }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error('[Webhook] Error processing webhook', { error });
    // Don't mark as processed if error occurred
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { customer, subscription } = session;

  if (!customer || !subscription) {
    log.error('[Webhook] Missing customer or subscription in checkout session', { sessionId: session.id });
    return;
  }

  const subscriptionId = typeof subscription === 'string' ? subscription : subscription.id;
  const customerId = typeof customer === 'string' ? customer : customer.id;

  // Get full subscription details
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;

  // Try to get metadata from session first, then fall back to subscription
  let metadata = session.metadata;
  if (!metadata?.userId && stripeSubscription.metadata) {
    metadata = stripeSubscription.metadata;
  }

  if (!metadata?.userId) {
    log.error('[Webhook] Missing userId in metadata', { subscriptionId });
    return;
  }

  // Extract tier and interval from metadata
  const tier = metadata.tier as 'booking' | 'chatbot' | 'bundle';
  const interval = metadata.interval as 'month' | 'year';

  log.info('[Webhook] Checkout completed', { tier, interval });
  log.debug('[Webhook] Subscription period', {
    start: stripeSubscription.current_period_start,
    end: stripeSubscription.current_period_end,
  });

  // Update user's subscription info
  await prisma.user.update({
    where: { id: metadata.userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: tier,
      subscriptionStatus: stripeSubscription.status,
      billingInterval: interval,
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    },
  });

  // Create or update subscription record
  const subscriptionItems = stripeSubscription.items.data;
  const baseItem = subscriptionItems.find((item: any) => !item.price.recurring?.usage_type);

  // Check for seat items and calculate seat counts
  const seatPriceIds = [STRIPE_PRICES.seat.monthly, STRIPE_PRICES.seat.annual];
  const seatItem = subscriptionItems.find((item: any) => seatPriceIds.includes(item.price.id));
  const additionalSeats = seatItem?.quantity || 0;

  // Included seats based on tier (1 for all paid tiers)
  const includedSeats = 1;
  const totalSeats = includedSeats + additionalSeats;

  await prisma.subscription.upsert({
    where: { userId: metadata.userId },
    create: {
      userId: metadata.userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: baseItem?.price.id || '',
      stripeCustomerId: customerId,
      tier,
      billingInterval: interval,
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : new Date(),
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : new Date(),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      // Initialize seat counts
      includedSeats,
      additionalSeats,
      totalSeats,
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: baseItem?.price.id || '',
      tier,
      billingInterval: interval,
      status: stripeSubscription.status,
      currentPeriodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : new Date(),
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : new Date(),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
      // Update seat counts
      includedSeats,
      additionalSeats,
      totalSeats,
    },
  });

  log.info('[Webhook] Subscription created/updated successfully');
  // TODO: Implement server-side conversion API for GA4 Measurement Protocol
  // trackConversion('purchase', { value: session.amount_total / 100, currency: 'usd', transaction_id: session.id, tier })
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    include: { subscription: true },
  });

  if (!user) {
    log.error('[Webhook] No user found for customer', { customerId });
    return;
  }

  log.info('[Webhook] Subscription updated', { status: subscription.status });

  // Check for seat quantity changes
  const seatPriceIds = [STRIPE_PRICES.seat.monthly, STRIPE_PRICES.seat.annual];
  const seatItem = subscription.items.data.find(
    (item) => seatPriceIds.includes(item.price.id)
  );

  // Calculate additional seats (0 if no seat item found)
  const additionalSeats = seatItem?.quantity || 0;
  const includedSeats = user.subscription?.includedSeats || 1;
  const totalSeats = includedSeats + additionalSeats;

  log.info('[Webhook] Seat info from subscription', {
    additionalSeats,
    includedSeats,
    totalSeats,
    hasSeatItem: !!seatItem,
  });

  // Update user's subscription status
  const sub: any = subscription;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: sub.status,
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    },
  });

  // Update subscription record with seat changes
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: sub.status,
      currentPeriodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : new Date(),
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : new Date(),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      // Sync seat quantities from Stripe
      additionalSeats,
      totalSeats,
    },
  });
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    log.error('[Webhook] No user found for customer', { customerId });
    return;
  }

  log.info('[Webhook] Subscription deleted');

  // Downgrade to free tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });

  // Update subscription record
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });
}

// Handle successful payment
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    return;
  }

  log.info('[Webhook] Payment succeeded');

  // Ensure subscription is marked as active
  if (user.subscriptionStatus !== 'active') {
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: 'active' },
    });
  }
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  if (!customerId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    return;
  }

  log.info('[Webhook] Payment failed');

  // Mark subscription as past_due
  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: 'past_due' },
  });

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: 'past_due' },
  });

  // Send payment failure alert
  try {
    const { sendPaymentFailureAlert } = await import('@/lib/email');

    await sendPaymentFailureAlert({
      userEmail: user.email,
      userName: user.name || 'there',
      invoiceAmount: invoice.amount_due / 100, // Convert cents to dollars
      dueDate: new Date(invoice.due_date! * 1000),
      invoiceUrl: invoice.hosted_invoice_url || '',
    });
  } catch (error) {
    log.error('[Webhook] Failed to send payment failure email', error);
    // Don't fail the webhook processing if email fails
  }
}
