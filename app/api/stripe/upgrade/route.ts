import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { stripe, getPriceId, getMeteredPriceId } from '@/lib/stripe';
import { z } from 'zod';
import { log } from '@/lib/logger';

const upgradeSchema = z.object({
  tier: z.enum(['booking', 'chatbot', 'bundle']),
  interval: z.enum(['month', 'year']),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tier, interval } = upgradeSchema.parse(body);

    // Prevent changing to same plan
    if (tier === user.subscriptionTier && interval === user.billingInterval) {
      return NextResponse.json(
        { error: 'You are already on this plan.' },
        { status: 400 }
      );
    }

    // Get the current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    // Build new line items
    const newLineItems: {
      id?: string;
      price: string;
      quantity?: number;
      deleted?: boolean;
    }[] = [];

    // Get new base price
    const newBasePriceId = getPriceId(tier, interval);

    // Find the current base subscription item (non-metered)
    const currentBaseItem = stripeSubscription.items.data.find(
      item => !item.price.recurring?.usage_type
    );

    if (currentBaseItem) {
      // Update existing base item
      newLineItems.push({
        id: currentBaseItem.id,
        price: newBasePriceId,
        quantity: 1,
      });
    } else {
      // Add new base item (shouldn't happen, but handle it)
      newLineItems.push({
        price: newBasePriceId,
        quantity: 1,
      });
    }

    // Handle metered pricing
    const currentMeteredItem = stripeSubscription.items.data.find(
      item => item.price.recurring?.usage_type === 'metered'
    );

    // Determine if new tier needs metered pricing
    const needsMetered = tier === 'chatbot' || tier === 'bundle';

    if (needsMetered) {
      const newMeteredPriceId = getMeteredPriceId(tier);

      if (currentMeteredItem) {
        // Update existing metered item
        newLineItems.push({
          id: currentMeteredItem.id,
          price: newMeteredPriceId,
        });
      } else {
        // Add new metered item
        newLineItems.push({
          price: newMeteredPriceId,
        });
      }
    } else if (currentMeteredItem) {
      // Remove metered item if switching to booking tier
      newLineItems.push({
        id: currentMeteredItem.id,
        deleted: true,
      } as any);
    }

    log.info('[Upgrade] Updating subscription', { itemCount: newLineItems.length });

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: newLineItems,
      proration_behavior: 'always_invoice', // Prorate and charge immediately
      metadata: {
        userId: user.id,
        tier,
        interval,
      },
    });

    log.info('[Upgrade] Subscription updated', { subscriptionId: updatedSubscription.id });

    // Update user's subscription info in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: tier,
        billingInterval: interval,
        subscriptionStatus: (updatedSubscription as any).status,
        currentPeriodEnd: (updatedSubscription as any).current_period_end
          ? new Date((updatedSubscription as any).current_period_end * 1000)
          : null,
      },
    });

    // Update subscription record
    const baseItem = updatedSubscription.items.data.find(item => !item.price.recurring?.usage_type);
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        tier,
        billingInterval: interval,
        stripePriceId: (baseItem?.price as any)?.id || '',
        status: (updatedSubscription as any).status,
        currentPeriodStart: (updatedSubscription as any).current_period_start
          ? new Date((updatedSubscription as any).current_period_start * 1000)
          : new Date(),
        currentPeriodEnd: (updatedSubscription as any).current_period_end
          ? new Date((updatedSubscription as any).current_period_end * 1000)
          : new Date(),
      },
    });

    log.info('[Upgrade] Database updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Subscription upgraded successfully',
      tier,
      interval,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    log.error('Error upgrading subscription', { error });
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
