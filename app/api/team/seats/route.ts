import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { canAddTeamMember, TIER_LIMITS } from '@/lib/subscription';
import { updateSubscriptionSeats } from '@/lib/stripe';
import { log } from '@/lib/logger';

// GET - Get current seat info
export async function GET() {
  try {
    const context = await requireTeamContext();

    // Only owners can view seat info
    if (!hasPermission(context.role, 'billing:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: context.accountId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const seatInfo = await canAddTeamMember(context.accountId);
    const tierLimits = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS];

    // Count active and pending members
    const activeMembers = await prisma.teamMember.count({
      where: {
        accountId: context.accountId,
        status: 'active',
      },
    });

    const pendingMembers = await prisma.teamMember.count({
      where: {
        accountId: context.accountId,
        status: 'pending',
      },
    });

    return NextResponse.json({
      tier: user.subscriptionTier,
      canAddSeats: ['booking', 'bundle'].includes(user.subscriptionTier),
      seats: {
        included: user.subscription?.includedSeats || 1,
        additional: user.subscription?.additionalSeats || 0,
        total: user.subscription?.totalSeats || 1,
        used: seatInfo.current,
        available: seatInfo.limit - seatInfo.current,
      },
      members: {
        active: activeMembers,
        pending: pendingMembers,
      },
      pricing: {
        perSeatMonthly: 5, // $5/month per additional seat
        perSeatAnnual: 50, // $50/year per additional seat
      },
    });
  } catch (error) {
    log.error('[Seats] Error fetching seat info', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch seat info' },
      { status: 500 }
    );
  }
}

// POST - Purchase additional seats
export async function POST(request: NextRequest) {
  try {
    const context = await requireTeamContext();

    // Only owners can purchase seats
    if (!hasPermission(context.role, 'billing:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { quantity } = body;

    if (!quantity || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity. Must be at least 1.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: context.accountId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can add seats (only booking and bundle tiers)
    if (!['booking', 'bundle'].includes(user.subscriptionTier)) {
      return NextResponse.json(
        { error: 'Additional seats are only available on Booking and Bundle plans' },
        { status: 400 }
      );
    }

    // Must have an active subscription
    if (!user.stripeSubscriptionId || !user.subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Calculate new seat count
    const currentAdditionalSeats = user.subscription.additionalSeats;
    const newAdditionalSeats = currentAdditionalSeats + quantity;

    // Update subscription in Stripe
    const result = await updateSubscriptionSeats(
      user.stripeSubscriptionId,
      newAdditionalSeats,
      user.subscription.billingInterval as 'month' | 'year'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update subscription' },
        { status: 500 }
      );
    }

    // Update local database
    await prisma.subscription.update({
      where: { userId: context.accountId },
      data: {
        additionalSeats: newAdditionalSeats,
        totalSeats: user.subscription.includedSeats + newAdditionalSeats,
      },
    });

    log.info('[Seats] Additional seats purchased', {
      accountId: context.accountId,
      quantity,
      newTotal: user.subscription.includedSeats + newAdditionalSeats,
    });

    return NextResponse.json({
      success: true,
      seats: {
        included: user.subscription.includedSeats,
        additional: newAdditionalSeats,
        total: user.subscription.includedSeats + newAdditionalSeats,
      },
    });
  } catch (error) {
    log.error('[Seats] Error purchasing seats', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to purchase seats' },
      { status: 500 }
    );
  }
}
