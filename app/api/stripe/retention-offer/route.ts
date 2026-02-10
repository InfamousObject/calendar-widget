import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { stripe, getPriceId, getMeteredPriceId } from '@/lib/stripe';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { switchToAnnual } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }

    const tier = user.subscriptionTier as 'booking' | 'chatbot' | 'bundle';
    if (!['booking', 'chatbot', 'bundle'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Create a 20% off coupon for the next invoice
    const coupon = await stripe.coupons.create({
      percent_off: 20,
      duration: 'once',
      metadata: { userId: user.id, reason: 'retention_offer' },
    });

    log.info('[Retention] Created 20% off coupon', {
      couponId: coupon.id,
      userId: user.id,
    });

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const isCurrentlyMonthly = user.billingInterval === 'month';

    if (switchToAnnual && isCurrentlyMonthly) {
      // Switch to annual billing and apply coupon
      const annualPriceId = getPriceId(tier, 'year');

      // Find the base price item (non-metered)
      const basePriceItem = subscription.items.data.find((item) => {
        const recurring = (item.price as any).recurring;
        return recurring && recurring.usage_type !== 'metered';
      });

      if (!basePriceItem) {
        return NextResponse.json(
          { error: 'Could not find base subscription item' },
          { status: 500 }
        );
      }

      const updateParams: any = {
        items: [
          {
            id: basePriceItem.id,
            price: annualPriceId,
          },
        ],
        discounts: [{ coupon: coupon.id }],
        proration_behavior: 'create_prorations',
      };

      // If the tier has metered pricing, update the metered item too
      if (tier === 'chatbot' || tier === 'bundle') {
        const meteredItem = subscription.items.data.find((item) => {
          const recurring = (item.price as any).recurring;
          return recurring && recurring.usage_type === 'metered';
        });
        if (meteredItem) {
          updateParams.items.push({
            id: meteredItem.id,
            price: getMeteredPriceId(tier),
          });
        }
      }

      await stripe.subscriptions.update(user.stripeSubscriptionId, updateParams);

      // Update billing interval in DB
      await prisma.user.update({
        where: { id: user.id },
        data: { billingInterval: 'year' },
      });

      if (user.subscription) {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { billingInterval: 'year' },
        });
      }

      // Undo cancel-at-period-end if it was set
      if (user.cancelAtPeriodEnd) {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { cancelAtPeriodEnd: false },
        });
        if (user.subscription) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { cancelAtPeriodEnd: false },
          });
        }
      }

      log.info('[Retention] Switched to annual with 20% off coupon', {
        userId: user.id,
        tier,
        couponId: coupon.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Switched to annual billing with 20% off your next payment',
        switchedToAnnual: true,
      });
    } else {
      // Apply coupon to existing subscription only
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        discounts: [{ coupon: coupon.id }],
      });

      // Undo cancel-at-period-end if it was set
      if (user.cancelAtPeriodEnd) {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { cancelAtPeriodEnd: false },
        });
        if (user.subscription) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { cancelAtPeriodEnd: false },
          });
        }
      }

      log.info('[Retention] Applied 20% off coupon to existing subscription', {
        userId: user.id,
        tier,
        couponId: coupon.id,
      });

      return NextResponse.json({
        success: true,
        message: '20% off applied to your next payment',
        switchedToAnnual: false,
      });
    }
  } catch (error) {
    log.error('[Retention] Error applying retention offer', { error });
    return NextResponse.json(
      { error: 'Failed to apply retention offer' },
      { status: 500 }
    );
  }
}
