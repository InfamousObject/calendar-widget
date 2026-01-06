/**
 * One-time script to sync existing Stripe subscriptions to database
 * Run with: npx tsx scripts/sync-subscription.ts <email>
 */

import Stripe from 'stripe';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';

async function syncSubscription(email: string) {
  console.log(`\n🔄 Syncing subscription for: ${email}\n`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error('❌ User not found with email:', email);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id} (${user.email})`);

  // Get Stripe customer
  if (!user.stripeCustomerId) {
    console.error('❌ User does not have a Stripe customer ID');
    process.exit(1);
  }

  console.log(`✅ Stripe Customer ID: ${user.stripeCustomerId}`);

  // Get all subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    limit: 10,
  });

  if (subscriptions.data.length === 0) {
    console.error('❌ No subscriptions found for this customer');
    process.exit(1);
  }

  // Get the most recent active subscription
  const activeSubscription = (subscriptions.data.find(sub => sub.status === 'active') || subscriptions.data[0]) as Stripe.Subscription & {
    current_period_start: number;
    current_period_end: number;
  };

  console.log(`\n✅ Found subscription: ${activeSubscription.id}`);
  console.log(`   Status: ${activeSubscription.status}`);
  console.log(`   Created: ${new Date(activeSubscription.created * 1000).toLocaleString()}`);

  // Extract tier and interval from metadata
  const tier = activeSubscription.metadata.tier as 'booking' | 'chatbot' | 'bundle';
  const interval = activeSubscription.metadata.interval as 'month' | 'year';

  if (!tier || !interval) {
    console.error('❌ Subscription missing tier or interval metadata');
    console.error('   Metadata:', activeSubscription.metadata);
    process.exit(1);
  }

  console.log(`   Tier: ${tier}`);
  console.log(`   Interval: ${interval}`);

  // Update user's subscription info
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: activeSubscription.id,
      subscriptionTier: tier,
      subscriptionStatus: activeSubscription.status,
      billingInterval: interval,
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
    },
  });

  console.log(`\n✅ Updated user record`);

  // Create or update subscription record
  const subscriptionItems = activeSubscription.items.data;
  const baseItem = subscriptionItems.find(item => !item.price.recurring?.usage_type);

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: activeSubscription.id,
      stripePriceId: baseItem?.price.id || '',
      stripeCustomerId: user.stripeCustomerId,
      tier,
      billingInterval: interval,
      status: activeSubscription.status,
      currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      trialEnd: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000) : null,
    },
    update: {
      stripeSubscriptionId: activeSubscription.id,
      stripePriceId: baseItem?.price.id || '',
      tier,
      billingInterval: interval,
      status: activeSubscription.status,
      currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      trialEnd: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000) : null,
    },
  });

  console.log(`✅ Updated subscription record`);

  console.log(`\n🎉 Subscription synced successfully!\n`);
  console.log(`User is now on the ${tier} tier (${interval}ly billing)`);
  console.log(`Next billing date: ${new Date(activeSubscription.current_period_end * 1000).toLocaleDateString()}\n`);
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/sync-subscription.ts <email>');
  process.exit(1);
}

syncSubscription(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error syncing subscription:', error);
    process.exit(1);
  });
