import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { canAddTeamMember, canInviteTeamMembers } from '@/lib/subscription';
import { createInvitation, getInvitationUrl } from '@/lib/invitation';
import { sendTeamInvitation } from '@/lib/email';
import { log } from '@/lib/logger';
import { updateSubscriptionSeats } from '@/lib/stripe';

// GET - List team members and seat info
export async function GET() {
  try {
    const context = await requireTeamContext();

    // Check permission
    if (!hasPermission(context.role, 'team:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get team members
    const members = await prisma.teamMember.findMany({
      where: {
        accountId: context.accountId,
        status: { in: ['active', 'pending'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        receiveNotifications: true,
        invitedAt: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Check if user's tier allows team members
    const tierCheck = await canInviteTeamMembers(context.accountId);

    // Get seat info
    const seatInfo = await canAddTeamMember(context.accountId);

    // Get account owner info
    const owner = await prisma.user.findUnique({
      where: { id: context.accountId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
      },
    });

    return NextResponse.json({
      members,
      owner,
      seats: {
        used: seatInfo.current,
        total: seatInfo.limit,
        canAddMore: seatInfo.allowed && tierCheck.allowed,
      },
      tier: {
        current: tierCheck.tier,
        canInviteMembers: tierCheck.allowed,
        upgradeMessage: tierCheck.message,
      },
    });
  } catch (error) {
    log.error('[Team] Error fetching team members', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST - Invite new member
export async function POST(request: NextRequest) {
  try {
    const context = await requireTeamContext();

    // Check permission
    if (!hasPermission(context.role, 'team:invite')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (role && !['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be admin or member' },
        { status: 400 }
      );
    }

    // Check if user's tier allows team members
    const tierCheck = await canInviteTeamMembers(context.accountId);
    if (!tierCheck.allowed) {
      return NextResponse.json(
        {
          error: tierCheck.message,
          requiresUpgrade: true,
          currentTier: tierCheck.tier,
        },
        { status: 403 }
      );
    }

    // Check seat availability
    const seatInfo = await canAddTeamMember(context.accountId);
    if (!seatInfo.allowed) {
      return NextResponse.json(
        { error: seatInfo.message || 'No available seats' },
        { status: 400 }
      );
    }

    // Check if inviting self
    const owner = await prisma.user.findUnique({
      where: { id: context.accountId },
      select: { email: true, name: true, businessName: true },
    });

    if (owner?.email.toLowerCase() === email.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await createInvitation({
      accountId: context.accountId,
      email,
      name,
      role: role || 'member',
    });

    // Send invitation email
    const invitationUrl = getInvitationUrl(invitation.invitationToken!);

    try {
      await sendTeamInvitation({
        toEmail: email,
        toName: name || email,
        inviterName: owner?.name || 'Team Owner',
        accountName: owner?.businessName || owner?.name || 'the team',
        role: invitation.role as 'admin' | 'member',
        invitationUrl,
        expiresAt: invitation.invitationExpiry!,
      });

      log.info('[Team] Invitation sent', {
        memberId: invitation.id,
        email,
        role: invitation.role,
      });
    } catch (emailError) {
      log.error('[Team] Failed to send invitation email', {
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
      // Continue - invitation was created, email just failed
    }

    // Sync seats with Stripe after invitation created
    const activeSeats = await prisma.teamMember.count({
      where: {
        accountId: context.accountId,
        status: { in: ['active', 'pending'] },
      },
    });

    const subscription = await prisma.subscription.findUnique({
      where: { userId: context.accountId },
    });

    if (subscription?.stripeSubscriptionId) {
      const includedSeats = subscription.includedSeats || 1;
      const additionalNeeded = Math.max(0, activeSeats - includedSeats);

      // Only update if additional seats changed
      if (additionalNeeded !== subscription.additionalSeats) {
        const result = await updateSubscriptionSeats(
          subscription.stripeSubscriptionId,
          additionalNeeded,
          subscription.billingInterval as 'month' | 'year'
        );

        if (result.success) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              additionalSeats: additionalNeeded,
              totalSeats: includedSeats + additionalNeeded,
            },
          });

          log.info('[Team] Stripe seats updated after invitation', {
            accountId: context.accountId,
            activeSeats,
            additionalNeeded,
          });
        } else {
          log.error('[Team] Failed to update Stripe seats', {
            error: result.error,
            accountId: context.accountId,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      member: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: invitation.status,
        invitedAt: invitation.invitedAt,
      },
    });
  } catch (error) {
    log.error('[Team] Error creating invitation', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (
        error.message.includes('already a member') ||
        error.message.includes('already a team member')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
