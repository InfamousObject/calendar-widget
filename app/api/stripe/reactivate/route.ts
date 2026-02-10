import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { reactivateSubscription } from '@/lib/stripe';
import { log } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription to reactivate' },
        { status: 400 }
      );
    }

    if (!user.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Reactivate the subscription (remove cancel_at_period_end)
    await reactivateSubscription(user.stripeSubscriptionId);

    // Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: { cancelAtPeriodEnd: false },
    });

    // Update subscription record
    if (user.subscription) {
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { cancelAtPeriodEnd: false },
      });
    }

    log.info('[Reactivate] Subscription reactivated', {
      userId: user.id,
      subscriptionId: user.stripeSubscriptionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
    });
  } catch (error) {
    log.error('[Reactivate] Error reactivating subscription', { error });
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}
