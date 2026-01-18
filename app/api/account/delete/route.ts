import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { log } from '@/lib/logger';
import { stripe } from '@/lib/stripe';

/**
 * Revoke a Google OAuth token
 */
async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.ok) {
      log.info('[Account] Google token revoked successfully');
      return true;
    } else {
      const error = await response.text();
      log.warn('[Account] Failed to revoke Google token', { error });
      return false;
    }
  } catch (error) {
    log.error('[Account] Error revoking Google token', error);
    return false;
  }
}

/**
 * DELETE - Delete user account
 * Revokes calendar permissions and deletes all user data
 */
export async function DELETE() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        calendars: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    log.info('[Account] Starting account deletion', { userId });

    // Step 1: Cancel Stripe subscription if exists
    if (user.stripeSubscriptionId) {
      try {
        // Cancel immediately instead of at period end
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        log.info('[Account] Stripe subscription cancelled', {
          userId,
          subscriptionId: user.stripeSubscriptionId,
        });
      } catch (error: any) {
        // If subscription is already cancelled or doesn't exist, continue
        if (error?.code !== 'resource_missing') {
          log.warn('[Account] Failed to cancel Stripe subscription', {
            userId,
            subscriptionId: user.stripeSubscriptionId,
            error: error?.message,
          });
        }
      }
    }

    // Also delete Stripe customer to remove payment methods
    if (user.stripeCustomerId) {
      try {
        await stripe.customers.del(user.stripeCustomerId);
        log.info('[Account] Stripe customer deleted', {
          userId,
          customerId: user.stripeCustomerId,
        });
      } catch (error: any) {
        if (error?.code !== 'resource_missing') {
          log.warn('[Account] Failed to delete Stripe customer', {
            userId,
            customerId: user.stripeCustomerId,
            error: error?.message,
          });
        }
      }
    }

    // Step 2: Revoke Google Calendar OAuth tokens
    for (const calendar of user.calendars) {
      if (calendar.provider === 'google' && calendar.source !== 'clerk') {
        try {
          // Decrypt and revoke the access token
          const accessToken = decrypt(
            calendar.accessToken,
            calendar.accessTokenIv,
            calendar.accessTokenAuth
          );
          await revokeGoogleToken(accessToken);

          // Also try to revoke refresh token
          const refreshToken = decrypt(
            calendar.refreshToken,
            calendar.refreshTokenIv,
            calendar.refreshTokenAuth
          );
          await revokeGoogleToken(refreshToken);
        } catch (error) {
          log.warn('[Account] Failed to revoke calendar tokens', {
            calendarId: calendar.id,
            error
          });
          // Continue with deletion even if revocation fails
        }
      }
    }

    // Step 2: Delete user from database (cascade deletes all related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    log.info('[Account] User deleted from database', { userId });

    // Step 3: Delete user from Clerk
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
      log.info('[Account] User deleted from Clerk', { userId });
    } catch (error) {
      log.error('[Account] Failed to delete user from Clerk', { userId, error });
      // User is already deleted from our DB, so we continue
      // The Clerk user will be orphaned but that's acceptable
    }

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    log.error('[Account] Error deleting account', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
