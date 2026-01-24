import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { TeamRole } from '@/lib/team-context';

const INVITATION_EXPIRY_DAYS = 7;

/**
 * Generate a secure invitation token.
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate invitation expiry date (7 days from now).
 */
export function getInvitationExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + INVITATION_EXPIRY_DAYS);
  return expiry;
}

/**
 * Create a team invitation.
 * Returns the created TeamMember record.
 */
export async function createInvitation(params: {
  accountId: string;
  email: string;
  name?: string;
  role: 'admin' | 'member';
}) {
  const { accountId, email, name, role } = params;

  const normalizedEmail = email.toLowerCase().trim();
  const token = generateInvitationToken();
  const expiry = getInvitationExpiry();

  // Check if user already has an active membership somewhere
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: existingUser.id,
        status: 'active',
      },
    });

    if (existingMembership) {
      throw new Error('This user is already a member of another team');
    }
  }

  // Check if there's already a pending or active invitation for this email on this account
  const existingInvitation = await prisma.teamMember.findUnique({
    where: {
      accountId_email: {
        accountId,
        email: normalizedEmail,
      },
    },
  });

  if (existingInvitation) {
    if (existingInvitation.status === 'active') {
      throw new Error('This user is already a team member');
    }

    if (existingInvitation.status === 'pending') {
      // Update existing pending invitation with new token
      return await prisma.teamMember.update({
        where: { id: existingInvitation.id },
        data: {
          name: name || existingInvitation.name,
          role,
          invitationToken: token,
          invitationExpiry: expiry,
          invitedAt: new Date(),
        },
      });
    }

    // If removed, create new invitation by updating the record
    if (existingInvitation.status === 'removed') {
      return await prisma.teamMember.update({
        where: { id: existingInvitation.id },
        data: {
          name: name || existingInvitation.name,
          role,
          status: 'pending',
          invitationToken: token,
          invitationExpiry: expiry,
          invitedAt: new Date(),
          userId: null,
          joinedAt: null,
          removedAt: null,
        },
      });
    }
  }

  // Create new invitation
  return await prisma.teamMember.create({
    data: {
      accountId,
      email: normalizedEmail,
      name,
      role,
      status: 'pending',
      invitationToken: token,
      invitationExpiry: expiry,
    },
  });
}

/**
 * Validate an invitation token.
 * Returns the TeamMember if valid, null otherwise.
 */
export async function validateInvitationToken(token: string) {
  const teamMember = await prisma.teamMember.findUnique({
    where: { invitationToken: token },
    include: {
      accountOwner: {
        select: {
          id: true,
          name: true,
          email: true,
          businessName: true,
        },
      },
    },
  });

  if (!teamMember) {
    return null;
  }

  // Check if token is expired
  if (teamMember.invitationExpiry && new Date() > teamMember.invitationExpiry) {
    return null;
  }

  // Check if invitation is still pending
  if (teamMember.status !== 'pending') {
    return null;
  }

  return teamMember;
}

/**
 * Accept an invitation.
 * Updates the TeamMember with the accepting user's ID.
 */
export async function acceptInvitation(token: string, userId: string) {
  const invitation = await validateInvitationToken(token);

  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Check if user already has an active membership
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId,
      status: 'active',
    },
  });

  if (existingMembership) {
    throw new Error('You are already a member of another team');
  }

  // Accept the invitation
  return await prisma.teamMember.update({
    where: { id: invitation.id },
    data: {
      userId,
      status: 'active',
      joinedAt: new Date(),
      invitationToken: null, // Clear the token
      invitationExpiry: null,
    },
  });
}

/**
 * Resend an invitation by regenerating the token.
 */
export async function resendInvitation(memberId: string, accountId: string) {
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      id: memberId,
      accountId,
      status: 'pending',
    },
  });

  if (!teamMember) {
    throw new Error('Invitation not found or already accepted');
  }

  const token = generateInvitationToken();
  const expiry = getInvitationExpiry();

  return await prisma.teamMember.update({
    where: { id: memberId },
    data: {
      invitationToken: token,
      invitationExpiry: expiry,
      invitedAt: new Date(),
    },
  });
}

/**
 * Get invitation URL for a token.
 */
export function getInvitationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/invite/${token}`;
}
