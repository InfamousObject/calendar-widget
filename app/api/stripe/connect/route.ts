import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, getCurrentUser } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { log } from '@/lib/logger';

/**
 * GET /api/stripe/connect
 * Get the user's Stripe Connect status
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
        stripeConnectPayoutsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has a Connect account, check its status with Stripe
    if (user.stripeConnectAccountId) {
      try {
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

        // Update database if status has changed
        const payoutsEnabled = account.payouts_enabled ?? false;
        const detailsSubmitted = account.details_submitted ?? false;

        if (
          user.stripeConnectOnboarded !== detailsSubmitted ||
          user.stripeConnectPayoutsEnabled !== payoutsEnabled
        ) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeConnectOnboarded: detailsSubmitted,
              stripeConnectPayoutsEnabled: payoutsEnabled,
            },
          });
        }

        return NextResponse.json({
          connected: true,
          accountId: user.stripeConnectAccountId,
          onboarded: detailsSubmitted,
          payoutsEnabled: payoutsEnabled,
          chargesEnabled: account.charges_enabled ?? false,
        });
      } catch (error) {
        log.error('[Connect] Error retrieving account', error);
        // Account might have been deleted
        return NextResponse.json({
          connected: false,
          accountId: null,
          onboarded: false,
          payoutsEnabled: false,
        });
      }
    }

    return NextResponse.json({
      connected: false,
      accountId: null,
      onboarded: false,
      payoutsEnabled: false,
    });
  } catch (error) {
    log.error('[Connect] Error getting connect status', error);
    return NextResponse.json(
      { error: 'Failed to get connect status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stripe/connect
 * Create a Stripe Connect account and return the onboarding link
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const clerkUser = await getCurrentUser();

    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        businessName: true,
        stripeConnectAccountId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments`;
    const refreshUrl = body.refreshUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?refresh=true`;

    let accountId = user.stripeConnectAccountId;

    // Create Connect account if one doesn't exist
    if (!accountId) {
      log.info('[Connect] Creating new Connect account', { userId });

      const account = await stripe.accounts.create({
        type: 'express', // Express accounts are easiest to set up
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: user.businessName || undefined,
        },
        metadata: {
          userId,
        },
      });

      accountId = account.id;

      // Save the account ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectAccountId: accountId },
      });

      log.info('[Connect] Connect account created', { userId, accountId });
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    log.info('[Connect] Account link created', { userId, accountId });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    log.error('[Connect] Error creating connect account', { error: error.message || error });

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      // Check for Connect not enabled error
      if (error.message?.includes("signed up for Connect")) {
        return NextResponse.json(
          {
            error: 'Stripe Connect is not enabled on your Stripe account',
            code: 'CONNECT_NOT_ENABLED',
            details: 'You need to enable Stripe Connect in your Stripe Dashboard before you can accept payments. Visit https://dashboard.stripe.com/settings/connect to get started.',
          },
          { status: 400 }
        );
      }

      // Check for invalid API key
      if (error.message?.includes('Invalid API Key')) {
        return NextResponse.json(
          {
            error: 'Invalid Stripe API configuration',
            code: 'INVALID_API_KEY',
            details: 'Please contact support to resolve this issue.',
          },
          { status: 500 }
        );
      }
    }

    // Check for authentication errors
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        {
          error: 'Stripe authentication failed',
          code: 'AUTH_ERROR',
          details: 'There was an issue connecting to Stripe. Please try again later.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create connect account',
        code: 'UNKNOWN_ERROR',
        details: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stripe/connect
 * Disconnect/delete the Stripe Connect account link (doesn't delete the actual Stripe account)
 */
export async function DELETE() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear the Connect account from the user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeConnectAccountId: null,
        stripeConnectOnboarded: false,
        stripeConnectPayoutsEnabled: false,
      },
    });

    log.info('[Connect] Connect account disconnected', { userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Connect] Error disconnecting account', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
