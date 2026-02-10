import { NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const context = await requireTeamContext();

    // Only owners can view billing info
    if (!hasPermission(context.role, 'billing:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the account owner's info (billing is always on the owner's account)
    const user = await prisma.user.findUnique({
      where: { id: context.accountId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Count active team members for seat usage
    const seatsUsed = await prisma.teamMember.count({
      where: {
        accountId: context.accountId,
        status: { in: ['active', 'pending'] },
      },
    });

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
      // Include seat info for team management
      seats: user.subscription ? {
        used: seatsUsed,
        included: user.subscription.includedSeats,
        additional: user.subscription.additionalSeats,
        total: user.subscription.totalSeats,
      } : {
        used: seatsUsed,
        included: 1,
        additional: 0,
        total: 1,
      },
    });
  } catch (error) {
    log.error('Error fetching billing info', { error });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    );
  }
}
