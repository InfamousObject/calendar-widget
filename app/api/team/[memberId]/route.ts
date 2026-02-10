import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { resendInvitation, getInvitationUrl } from '@/lib/invitation';
import { sendTeamInvitation } from '@/lib/email';
import { log } from '@/lib/logger';
import { updateSubscriptionSeats } from '@/lib/stripe';

interface RouteParams {
  params: Promise<{ memberId: string }>;
}

// GET - Get a single team member
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireTeamContext();
    const { memberId } = await params;

    if (!hasPermission(context.role, 'team:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        accountId: context.accountId,
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
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch (error) {
    log.error('[Team] Error fetching team member', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

// PATCH - Update team member (role, notifications, resend invite)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireTeamContext();
    const { memberId } = await params;
    const body = await request.json();

    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        accountId: context.accountId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Handle role change
    if (body.role !== undefined) {
      if (!hasPermission(context.role, 'team:manage-roles')) {
        return NextResponse.json(
          { error: 'You do not have permission to change roles' },
          { status: 403 }
        );
      }

      if (!['admin', 'member'].includes(body.role)) {
        return NextResponse.json(
          { error: 'Role must be admin or member' },
          { status: 400 }
        );
      }

      await prisma.teamMember.update({
        where: { id: memberId },
        data: { role: body.role },
      });

      log.info('[Team] Role updated', {
        memberId,
        newRole: body.role,
      });
    }

    // Handle notification settings
    if (body.receiveNotifications !== undefined) {
      // Owners and admins can change notification settings, members can change their own
      const canUpdate =
        hasPermission(context.role, 'team:manage-roles') ||
        (context.teamMemberId === memberId);

      if (!canUpdate) {
        return NextResponse.json(
          { error: 'You do not have permission to change notification settings' },
          { status: 403 }
        );
      }

      await prisma.teamMember.update({
        where: { id: memberId },
        data: { receiveNotifications: body.receiveNotifications },
      });

      log.info('[Team] Notification settings updated', {
        memberId,
        receiveNotifications: body.receiveNotifications,
      });
    }

    // Handle resend invitation
    if (body.resendInvitation) {
      if (!hasPermission(context.role, 'team:invite')) {
        return NextResponse.json(
          { error: 'You do not have permission to resend invitations' },
          { status: 403 }
        );
      }

      if (member.status !== 'pending') {
        return NextResponse.json(
          { error: 'Can only resend invitation for pending members' },
          { status: 400 }
        );
      }

      const updatedMember = await resendInvitation(memberId, context.accountId);
      const invitationUrl = getInvitationUrl(updatedMember.invitationToken!);

      // Get account owner info
      const owner = await prisma.user.findUnique({
        where: { id: context.accountId },
        select: { name: true, businessName: true },
      });

      try {
        await sendTeamInvitation({
          toEmail: member.email,
          toName: member.name || member.email,
          inviterName: owner?.name || 'Team Owner',
          accountName: owner?.businessName || owner?.name || 'the team',
          role: member.role as 'admin' | 'member',
          invitationUrl,
          expiresAt: updatedMember.invitationExpiry!,
        });

        log.info('[Team] Invitation resent', {
          memberId,
          email: member.email,
        });
      } catch (emailError) {
        log.error('[Team] Failed to resend invitation email', {
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    // Fetch updated member
    const updatedMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        receiveNotifications: true,
        invitedAt: true,
        joinedAt: true,
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    log.error('[Team] Error updating team member', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE - Remove team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireTeamContext();
    const { memberId } = await params;

    if (!hasPermission(context.role, 'team:remove-members')) {
      return NextResponse.json(
        { error: 'You do not have permission to remove team members' },
        { status: 403 }
      );
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        accountId: context.accountId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Mark as removed (soft delete)
    await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        status: 'removed',
        removedAt: new Date(),
        invitationToken: null,
        invitationExpiry: null,
      },
    });

    log.info('[Team] Member removed', {
      memberId,
      email: member.email,
    });

    // Sync seats with Stripe
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

      const result = await updateSubscriptionSeats(
        subscription.stripeSubscriptionId,
        additionalNeeded,
        subscription.billingInterval as 'month' | 'year'
      );

      if (result.success) {
        // Update local subscription record
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            additionalSeats: additionalNeeded,
            totalSeats: includedSeats + additionalNeeded,
          },
        });

        log.info('[Team] Stripe seats updated after member removal', {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Team] Error removing team member', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
