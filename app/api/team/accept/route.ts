import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { validateInvitationToken, acceptInvitation } from '@/lib/invitation';
import { log } from '@/lib/logger';

// GET - Validate invitation token (public, but returns limited info)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await validateInvitationToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Return limited info for display purposes
    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        invitedAt: invitation.invitedAt,
        expiresAt: invitation.invitationExpiry,
        account: {
          ownerName: invitation.accountOwner.name,
          businessName: invitation.accountOwner.businessName,
        },
      },
    });
  } catch (error) {
    log.error('[Team] Error validating invitation', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}

// POST - Accept invitation (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Accept the invitation
    const membership = await acceptInvitation(token, userId);

    log.info('[Team] Invitation accepted', {
      memberId: membership.id,
      userId,
      accountId: membership.accountId,
      role: membership.role,
    });

    return NextResponse.json({
      success: true,
      membership: {
        id: membership.id,
        accountId: membership.accountId,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
      },
    });
  } catch (error) {
    log.error('[Team] Error accepting invitation', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error) {
      if (error.message === 'Invalid or expired invitation') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('already a member')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
