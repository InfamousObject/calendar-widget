import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { log } from '@/lib/logger';

/**
 * GET /api/stripe/connect/dashboard
 * Create a login link for the user's Stripe Express Dashboard
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
      },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.json(
        { error: 'No connected Stripe account found' },
        { status: 404 }
      );
    }

    if (!user.stripeConnectOnboarded) {
      return NextResponse.json(
        { error: 'Please complete Stripe onboarding first' },
        { status: 400 }
      );
    }

    // Create a login link for the Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectAccountId);

    log.info('[Connect] Dashboard login link created', { userId });

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    log.error('[Connect] Error creating dashboard link', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    );
  }
}
