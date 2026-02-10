import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { createCheckoutSession, reactivateSubscription, stripe, type SubscriptionTier, type BillingInterval } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { log } from '@/lib/logger';

const checkoutSchema = z.object({
  tier: z.enum(['booking', 'chatbot', 'bundle']),
  interval: z.enum(['month', 'year']),
  promotionCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active subscription (allow cancelAtPeriodEnd users through)
    if (user.subscriptionStatus === 'active' && user.subscriptionTier !== 'free' && !user.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from the billing page.' },
        { status: 400 }
      );
    }

    // Parse and validate request body (once, used by both reactivation and checkout paths)
    const body = await request.json();
    const { tier, interval, promotionCode } = checkoutSchema.parse(body);

    // If user has cancelAtPeriodEnd and is resubscribing to the same plan, just reactivate
    if (user.cancelAtPeriodEnd && user.stripeSubscriptionId && tier === user.subscriptionTier) {
      await reactivateSubscription(user.stripeSubscriptionId);

      // Apply promotion code as a discount if provided
      if (promotionCode) {
        try {
          const promoCodes = await stripe.promotionCodes.list({
            code: promotionCode,
            active: true,
            limit: 1,
          });
          if (promoCodes.data.length > 0) {
            const coupon = promoCodes.data[0].promotion?.coupon;
            const couponId = typeof coupon === 'string' ? coupon : coupon?.id;
            if (couponId) {
              await stripe.subscriptions.update(user.stripeSubscriptionId, {
                discounts: [{ coupon: couponId }],
              });
            }
          }
        } catch (error) {
          log.warn('Failed to apply promotion code on reactivation', {
            promotionCode,
            subscriptionId: user.stripeSubscriptionId,
            error,
          });
        }
      }

      // Update user record
      await prisma.user.update({
        where: { id: user.id },
        data: { cancelAtPeriodEnd: false },
      });

      // Update subscription record
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });
      if (subscription) {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { cancelAtPeriodEnd: false },
        });
      }

      log.info('[Checkout] Reactivated subscription for same-plan re-engagement', {
        userId: user.id,
        subscriptionId: user.stripeSubscriptionId,
        tier,
        hadPromoCode: !!promotionCode,
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.json({ url: `${baseUrl}/dashboard/billing?success=true` });
    }

    // Look up Stripe promotion code if provided
    let stripePromoCodeId: string | undefined;
    if (promotionCode) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          code: promotionCode,
          active: true,
          limit: 1,
        });
        if (promoCodes.data.length > 0) {
          stripePromoCodeId = promoCodes.data[0].id;
        }
      } catch (error) {
        log.warn('Failed to look up promotion code', { promotionCode, error });
      }
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      tier: tier as Exclude<SubscriptionTier, 'free'>,
      interval: interval as BillingInterval,
      successUrl: `${baseUrl}/dashboard/billing?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      promotionCode: stripePromoCodeId,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    log.error('Error creating checkout session', { error });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
