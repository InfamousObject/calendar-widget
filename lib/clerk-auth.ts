import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Get the current authenticated user's ID from Clerk
 * Use this in API routes instead of getServerSession
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get the current authenticated user from database
 * Returns the full user object from our database
 */
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
}

/**
 * Require authentication - throws if not authenticated
 * Use at the start of protected API routes
 */
export async function requireAuth() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return userId;
}
