import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamContext {
  userId: string;        // Authenticated Clerk user
  accountId: string;     // Account to access (own or team owner's)
  role: TeamRole;
  isOwner: boolean;
  teamMemberId?: string; // TeamMember record ID if user is a team member
}

/**
 * Get the team context for the current authenticated user.
 * Resolves which account's data the current user should access.
 *
 * If user is the owner of their own account, returns their userId as accountId.
 * If user is a team member of another account, returns that account owner's userId as accountId.
 *
 * Note: A user can only belong to one team at a time.
 */
export async function getTeamContext(): Promise<TeamContext | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  // Check if user is a member of another team (active membership)
  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId,
      status: 'active',
    },
    include: {
      accountOwner: {
        select: {
          id: true,
        },
      },
    },
  });

  // If user has an active team membership, they're working on someone else's account
  if (teamMembership) {
    return {
      userId,
      accountId: teamMembership.accountId,
      role: teamMembership.role as TeamRole,
      isOwner: false,
      teamMemberId: teamMembership.id,
    };
  }

  // User is the owner of their own account
  // First verify the user exists in the database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  return {
    userId,
    accountId: userId,
    role: 'owner',
    isOwner: true,
  };
}

/**
 * Get the account ID to use for data queries.
 * Shorthand for when you just need the accountId.
 */
export async function getActiveAccountId(): Promise<string | null> {
  const context = await getTeamContext();
  return context?.accountId ?? null;
}

/**
 * Require team context - throws if not authenticated.
 * Use at the start of protected API routes.
 */
export async function requireTeamContext(): Promise<TeamContext> {
  const context = await getTeamContext();

  if (!context) {
    throw new Error('Unauthorized');
  }

  return context;
}

/**
 * Get all active team members for an account (including owner info).
 * Useful for features that need to know all team members.
 */
export async function getTeamMembers(accountId: string) {
  const members = await prisma.teamMember.findMany({
    where: {
      accountId,
      status: { in: ['active', 'pending'] },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // Admins first, then members
      { createdAt: 'asc' },
    ],
  });

  return members;
}

/**
 * Get all active team member user IDs for an account.
 * Useful for calendar availability checks.
 */
export async function getActiveTeamMemberUserIds(accountId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: {
      accountId,
      status: 'active',
      userId: { not: null },
    },
    select: {
      userId: true,
    },
  });

  return members.map(m => m.userId!).filter(Boolean);
}
