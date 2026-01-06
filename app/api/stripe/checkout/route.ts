import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { createCheckoutSession, type SubscriptionTier, type BillingInterval } from '@/lib/stripe';
import { z } from 'zod';
import { log } from '@/lib/logger';

const checkoutSchema = z.object({
  tier: z.enum(['booking', 'chatbot', 'bundle']),
  interval: z.enum(['month', 'year']),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active subscription
    if (user.subscriptionStatus === 'active' && user.subscriptionTier !== 'free') {
      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage it from the billing page.' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { tier, interval } = checkoutSchema.parse(body);

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      tier: tier as Exclude<SubscriptionTier, 'free'>,
      interval: interval as BillingInterval,
      successUrl: `${baseUrl}/dashboard/billing?success=true`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
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
