import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { cancelSubscriptionAtPeriodEnd } from '@/lib/stripe';
import { log } from '@/lib/logger';

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
        { error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    // Check if already scheduled for cancellation
    if (user.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is already scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Cancel subscription at period end
    const canceledSubscription = await cancelSubscriptionAtPeriodEnd(user.stripeSubscriptionId);

    log.info('[Cancel] Subscription canceled at period end', { subscriptionId: canceledSubscription.id });

    // Update user's cancellation status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    // Update subscription record
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    log.info('[Cancel] Database updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: (canceledSubscription as any).current_period_end,
    });
  } catch (error) {
    log.error('Error canceling subscription', { error });
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
