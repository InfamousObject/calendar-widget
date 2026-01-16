import { clerkClient } from '@clerk/nextjs/server';
import { log } from '@/lib/logger';

// Required scopes for Google Calendar access
const REQUIRED_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export interface ClerkOAuthToken {
  token: string;
  scopes: string[];
  expiresAt?: Date;
}

/**
 * Get Google OAuth token from Clerk for a user
 * Returns null if user doesn't have a Google connection or token is unavailable
 */
export async function getClerkGoogleToken(userId: string): Promise<ClerkOAuthToken | null> {
  try {
    const client = await clerkClient();

    // Get OAuth access token from Clerk
    // This returns the most recent token for the specified provider
    const tokenResponse = await client.users.getUserOauthAccessToken(
      userId,
      'oauth_google'
    );

    // Check if we got a valid response with data
    if (!tokenResponse.data || tokenResponse.data.length === 0) {
      log.info('[ClerkOAuth] No Google OAuth token found for user', { userId });
      return null;
    }

    // Get the first (most recent) token
    const tokenData = tokenResponse.data[0];

    if (!tokenData.token) {
      log.warn('[ClerkOAuth] Token data exists but token is empty', { userId });
      return null;
    }

    // Parse scopes - Clerk returns them as an array
    const scopes = tokenData.scopes || [];

    log.info('[ClerkOAuth] Retrieved Google token from Clerk', {
      userId,
      hasToken: !!tokenData.token,
      scopeCount: scopes.length,
    });

    return {
      token: tokenData.token,
      scopes,
      // Clerk doesn't always provide expiry, but tokens are typically valid for 1 hour
      expiresAt: undefined,
    };
  } catch (error: any) {
    // Handle specific error cases
    if (error?.status === 404 || error?.errors?.[0]?.code === 'resource_not_found') {
      log.info('[ClerkOAuth] User has no Google OAuth connection', { userId });
      return null;
    }

    log.error('[ClerkOAuth] Failed to get Google token from Clerk', {
      userId,
      error: error?.message || error,
    });
    return null;
  }
}

/**
 * Check if the user's Clerk Google OAuth token has the required calendar scopes
 */
export function hasCalendarScopes(scopes: string[] | undefined): boolean {
  if (!scopes || scopes.length === 0) {
    return false;
  }

  // Check if all required scopes are present
  return REQUIRED_CALENDAR_SCOPES.every(requiredScope =>
    scopes.some(scope => scope.includes(requiredScope) || requiredScope.includes(scope))
  );
}

/**
 * Check if a user signed up with Google (has Google OAuth connection in Clerk)
 */
export async function userHasGoogleConnection(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Check if user has a Google external account
    const hasGoogle = user.externalAccounts?.some(
      account => account.provider === 'oauth_google' || account.provider === 'google'
    );

    return hasGoogle || false;
  } catch (error) {
    log.error('[ClerkOAuth] Failed to check user Google connection', { userId, error });
    return false;
  }
}

/**
 * Get user's Google email from their Clerk profile
 */
export async function getClerkGoogleEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Find the Google external account
    const googleAccount = user.externalAccounts?.find(
      account => account.provider === 'oauth_google' || account.provider === 'google'
    );

    return googleAccount?.emailAddress || null;
  } catch (error) {
    log.error('[ClerkOAuth] Failed to get Google email from Clerk', { userId, error });
    return null;
  }
}
