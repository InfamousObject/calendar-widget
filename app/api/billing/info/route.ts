import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    log.debug('[Billing Info] User authentication check', { hasUserId: !!userId });

    if (!userId) {
      log.info('[Billing Info] No Clerk userId - not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getCurrentUser();
    log.debug('[Billing Info] User from DB', { found: !!user });
    if (!user) {
      log.info('[Billing Info] User needs to be created in DB with Clerk ID');
    }

    if (!user) {
      log.info('[Billing Info] No user found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      interval: user.billingInterval,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      hasStripeCustomer: !!user.stripeCustomerId,
      usage: {
        bookings: user.monthlyBookings,
        chatMessages: user.monthlyChatMessages,
      },
    });
  } catch (error) {
    log.error('Error fetching billing info', { error });
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}
