# Calendar Provider Integration Template

## Overview

This template provides a standardized approach for adding new calendar provider integrations (Outlook, iOS/iCloud Calendar, etc.) with consistent encryption and security practices.

---

## Pre-Integration Checklist

Before starting, gather the following information about the new provider:

- [ ] OAuth 2.0 authorization endpoint
- [ ] OAuth 2.0 token endpoint
- [ ] Required OAuth scopes
- [ ] API documentation URL
- [ ] Token expiration policy (how long access tokens last)
- [ ] Refresh token policy (does the provider issue refresh tokens?)
- [ ] SDK availability (official JavaScript/TypeScript SDK?)
- [ ] Rate limits and quota restrictions

---

## Step 1: Register OAuth Application

### Provider-Specific Steps:

**For Microsoft Outlook:**
1. Go to Azure Portal → App Registrations
2. Create new registration
3. Set redirect URI: `https://yourdomain.com/api/calendar/callback`
4. Required scopes: `Calendars.ReadWrite`, `offline_access`
5. Note: Client ID and Client Secret

**For Apple iCloud Calendar:**
1. Go to Apple Developer Portal
2. Create new App ID
3. Enable iCloud (CloudKit) capability
4. Note: Team ID, Key ID, Private Key

**For Generic CalDAV Provider:**
1. CalDAV URL endpoint
2. Authentication method (Basic Auth, OAuth, etc.)
3. Username/password or app-specific password

### Environment Variables

Add to `.env.local`:

```bash
# [PROVIDER_NAME] Calendar Integration
[PROVIDER]_CLIENT_ID="your_client_id"
[PROVIDER]_CLIENT_SECRET="your_client_secret"
[PROVIDER]_REDIRECT_URI="${NEXTAUTH_URL}/api/calendar/callback"
[PROVIDER]_SCOPES="scope1 scope2 scope3"

# Example for Outlook:
# OUTLOOK_CLIENT_ID="abc123..."
# OUTLOOK_CLIENT_SECRET="xyz789..."
# OUTLOOK_REDIRECT_URI="${NEXTAUTH_URL}/api/calendar/callback"
# OUTLOOK_SCOPES="Calendars.ReadWrite offline_access"
```

---

## Step 2: Create OAuth Helper Library

**File:** `lib/[provider]/oauth.ts`

**Example for Outlook:** `lib/outlook/oauth.ts`

```typescript
import { google } from 'googleapis';

// Initialize OAuth client
export function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.[PROVIDER]_CLIENT_ID,
    process.env.[PROVIDER]_CLIENT_SECRET,
    process.env.[PROVIDER]_REDIRECT_URI
  );

  return oauth2Client;
}

// Generate authorization URL
export function getAuthorizationUrl(userId: string): string {
  const oauth2Client = getOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: process.env.[PROVIDER]_SCOPES?.split(' ') || [],
    state: userId, // Pass userId for callback verification
    prompt: 'consent', // Force consent screen for refresh token
  });

  return authUrl;
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

// Get calendar API client with credentials
export function getCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
```

---

## Step 3: Database Schema (Already Done)

The `CalendarConnection` model in `prisma/schema.prisma` is provider-agnostic and supports all providers:

```prisma
model CalendarConnection {
  id           String   @id @default(cuid())
  userId       String
  provider     String   // "google", "outlook", "icloud", etc.

  // Encrypted email (PII protection)
  email        String   @db.Text // Encrypted email (hex string)
  emailIv      String   @default("") // IV for email
  emailAuth    String   @default("") // Auth tag for email

  // Encrypted OAuth tokens (protect calendar access)
  accessToken      String   @db.Text
  accessTokenIv    String   @default("")
  accessTokenAuth  String   @default("")

  refreshToken     String   @db.Text
  refreshTokenIv   String   @default("")
  refreshTokenAuth String   @default("")

  expiresAt    DateTime
  isPrimary    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**✅ No schema changes needed for new providers!**

---

## Step 4: Create Connect API Route

**File:** `app/api/calendar/connect/route.ts` (Already exists)

**Update to support multiple providers:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { getAuthorizationUrl as getGoogleAuthUrl } from '@/lib/google/oauth';
import { getAuthorizationUrl as getOutlookAuthUrl } from '@/lib/outlook/oauth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get provider from query params (default: google)
    const provider = request.nextUrl.searchParams.get('provider') || 'google';

    let authUrl: string;
    switch (provider) {
      case 'google':
        authUrl = getGoogleAuthUrl(user.id);
        break;
      case 'outlook':
        authUrl = getOutlookAuthUrl(user.id);
        break;
      // Add more providers here
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Create/Update Callback API Route

**File:** `app/api/calendar/callback/route.ts`

**Add provider-specific handling:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { getTokensFromCode as getGoogleTokens, getCalendarClient as getGoogleClient } from '@/lib/google/oauth';
import { getTokensFromCode as getOutlookTokens, getCalendarClient as getOutlookClient } from '@/lib/outlook/oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const provider = searchParams.get('provider') || 'google'; // Add provider param
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=access_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=missing_params`
      );
    }

    const userId = state;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=user_not_found`
      );
    }

    // Exchange code for tokens (provider-specific)
    let tokens: any;
    let primaryEmail: string;

    switch (provider) {
      case 'google': {
        tokens = await getGoogleTokens(code);
        const calendar = getGoogleClient(tokens.access_token!, tokens.refresh_token!);
        const calendarList = await calendar.calendarList.list();
        const primaryCalendar = calendarList.data.items?.find((cal) => cal.primary);
        primaryEmail = primaryCalendar?.id || '';
        break;
      }

      case 'outlook': {
        tokens = await getOutlookTokens(code);
        const calendar = getOutlookClient(tokens.access_token!, tokens.refresh_token!);
        // Fetch user profile to get email
        const response = await calendar.get('/me');
        primaryEmail = response.data.mail || response.data.userPrincipalName;
        break;
      }

      default:
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=unsupported_provider`
        );
    }

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=no_tokens`
      );
    }

    // Calculate token expiration
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    // ✅ CRITICAL: Encrypt all sensitive data before saving
    const {
      encrypted: encryptedEmail,
      iv: emailIv,
      authTag: emailAuth,
    } = encrypt(primaryEmail);

    const {
      encrypted: encryptedAccessToken,
      iv: accessTokenIv,
      authTag: accessTokenAuth,
    } = encrypt(tokens.access_token);

    const {
      encrypted: encryptedRefreshToken,
      iv: refreshTokenIv,
      authTag: refreshTokenAuth,
    } = encrypt(tokens.refresh_token);

    // Check if connection already exists
    const existingConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId: user.id,
        provider: provider,
        isPrimary: true,
      },
    });

    if (existingConnection) {
      // Update existing connection with encrypted data
      await prisma.calendarConnection.update({
        where: { id: existingConnection.id },
        data: {
          email: encryptedEmail,
          emailIv,
          emailAuth,
          accessToken: encryptedAccessToken,
          accessTokenIv,
          accessTokenAuth,
          refreshToken: encryptedRefreshToken,
          refreshTokenIv,
          refreshTokenAuth,
          expiresAt,
        },
      });
    } else {
      // Create new connection with encrypted data
      await prisma.calendarConnection.create({
        data: {
          userId: user.id,
          provider: provider,
          email: encryptedEmail,
          emailIv,
          emailAuth,
          accessToken: encryptedAccessToken,
          accessTokenIv,
          accessTokenAuth,
          refreshToken: encryptedRefreshToken,
          refreshTokenIv,
          refreshTokenAuth,
          expiresAt,
          isPrimary: true,
        },
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar?success=true&provider=${provider}`
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=callback_failed`
    );
  }
}
```

---

## Step 6: Create Calendar Operations Library

**File:** `lib/[provider]/calendar.ts`

**Example for Outlook:** `lib/outlook/calendar.ts`

**Pattern (based on `lib/google/calendar.ts`):**

```typescript
import { prisma } from '@/lib/prisma';
import { getCalendarClient, refreshAccessToken } from './oauth';
import { decrypt, encrypt } from '@/lib/encryption';

/**
 * Get user's primary calendar connection with valid tokens
 * ✅ CRITICAL: Always decrypt tokens before use
 */
async function getValidConnection(userId: string) {
  const connection = await prisma.calendarConnection.findFirst({
    where: {
      userId,
      provider: '[provider_name]', // e.g., 'outlook'
      isPrimary: true,
    },
  });

  if (!connection) {
    throw new Error('No [Provider] Calendar connection found');
  }

  // ✅ Decrypt tokens for use
  let decryptedAccessToken: string;
  let decryptedRefreshToken: string;

  try {
    decryptedAccessToken = decrypt(
      connection.accessToken,
      connection.accessTokenIv,
      connection.accessTokenAuth
    );
    decryptedRefreshToken = decrypt(
      connection.refreshToken,
      connection.refreshTokenIv,
      connection.refreshTokenAuth
    );
  } catch (error) {
    console.error('[Calendar] Failed to decrypt tokens:', error);
    throw new Error('Failed to decrypt calendar tokens - please reconnect your calendar');
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.expiresAt);

  if (now >= expiresAt) {
    // Refresh the token
    try {
      const newTokens = await refreshAccessToken(decryptedRefreshToken);

      if (!newTokens.access_token) {
        throw new Error('Failed to refresh access token');
      }

      const newExpiresAt = newTokens.expiry_date
        ? new Date(newTokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      // ✅ CRITICAL: Re-encrypt new tokens before saving
      const {
        encrypted: newEncryptedAccessToken,
        iv: newAccessTokenIv,
        authTag: newAccessTokenAuth,
      } = encrypt(newTokens.access_token);

      const {
        encrypted: newEncryptedRefreshToken,
        iv: newRefreshTokenIv,
        authTag: newRefreshTokenAuth,
      } = encrypt(newTokens.refresh_token || decryptedRefreshToken);

      // Update connection with new encrypted tokens
      const updatedConnection = await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newEncryptedAccessToken,
          accessTokenIv: newAccessTokenIv,
          accessTokenAuth: newAccessTokenAuth,
          refreshToken: newEncryptedRefreshToken,
          refreshTokenIv: newRefreshTokenIv,
          refreshTokenAuth: newRefreshTokenAuth,
          expiresAt: newExpiresAt,
        },
      });

      // Return connection with decrypted tokens for immediate use
      return {
        ...updatedConnection,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || decryptedRefreshToken,
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Return connection with decrypted tokens
  return {
    ...connection,
    accessToken: decryptedAccessToken,
    refreshToken: decryptedRefreshToken,
  };
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(params: {
  userId: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
  attendeeName?: string;
}) {
  const connection = await getValidConnection(params.userId);

  const calendar = getCalendarClient(
    connection.accessToken,
    connection.refreshToken
  );

  // Provider-specific event creation
  const event = {
    subject: params.summary,
    body: {
      contentType: 'HTML',
      content: params.description || '',
    },
    start: {
      dateTime: params.startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: params.endTime.toISOString(),
      timeZone: 'UTC',
    },
    attendees: params.attendeeEmail
      ? [
          {
            emailAddress: {
              address: params.attendeeEmail,
              name: params.attendeeName,
            },
            type: 'required',
          },
        ]
      : [],
  };

  const response = await calendar.events.create(event);
  return response.id;
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(params: {
  userId: string;
  eventId: string;
  summary?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
}) {
  const connection = await getValidConnection(params.userId);

  const calendar = getCalendarClient(
    connection.accessToken,
    connection.refreshToken
  );

  // Provider-specific event update
  const event: any = {};
  if (params.summary) event.subject = params.summary;
  if (params.description) event.body = { contentType: 'HTML', content: params.description };
  if (params.startTime) event.start = { dateTime: params.startTime.toISOString(), timeZone: 'UTC' };
  if (params.endTime) event.end = { dateTime: params.endTime.toISOString(), timeZone: 'UTC' };

  await calendar.events.update(params.eventId, event);
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  const connection = await getValidConnection(userId);

  const calendar = getCalendarClient(
    connection.accessToken,
    connection.refreshToken
  );

  await calendar.events.delete(eventId);
}

/**
 * Check for conflicts in user's calendar
 */
export async function checkForConflicts(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const connection = await getValidConnection(userId);

    const calendar = getCalendarClient(
      connection.accessToken,
      connection.refreshToken
    );

    const events = await calendar.events.list({
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
    });

    const activeEvents = events.filter(
      (event: any) => event.isCancelled === false
    );

    return activeEvents.length > 0;
  } catch (error) {
    console.error('Error checking for conflicts:', error);
    // If calendar is not connected or error occurs, don't block bookings
    return false;
  }
}
```

---

## Step 7: Update Frontend Calendar Page

**File:** `app/dashboard/calendar/page.tsx`

Add provider selection:

```typescript
<div className="space-y-4">
  <h2>Connect Calendar</h2>

  <Button
    onClick={() => window.location.href = '/api/calendar/connect?provider=google'}
  >
    Connect Google Calendar
  </Button>

  <Button
    onClick={() => window.location.href = '/api/calendar/connect?provider=outlook'}
  >
    Connect Outlook Calendar
  </Button>

  {/* Add more providers */}
</div>
```

---

## Step 8: Update Appointment Booking Logic

**File:** `app/api/appointments/book/route.ts` (or similar)

**Ensure provider-agnostic event creation:**

```typescript
import { createCalendarEvent as createGoogleEvent } from '@/lib/google/calendar';
import { createCalendarEvent as createOutlookEvent } from '@/lib/outlook/calendar';

// Get user's calendar connection
const connection = await prisma.calendarConnection.findFirst({
  where: { userId: user.id, isPrimary: true },
});

if (connection) {
  let calendarEventId: string | undefined;

  // Create event based on provider
  switch (connection.provider) {
    case 'google':
      calendarEventId = await createGoogleEvent({
        userId: user.id,
        summary: `Appointment with ${visitorName}`,
        description: notes || undefined,
        startTime,
        endTime,
        attendeeEmail: visitorEmail,
        attendeeName: visitorName,
      });
      break;

    case 'outlook':
      calendarEventId = await createOutlookEvent({
        userId: user.id,
        summary: `Appointment with ${visitorName}`,
        description: notes || undefined,
        startTime,
        endTime,
        attendeeEmail: visitorEmail,
        attendeeName: visitorName,
      });
      break;

    // Add more providers here
  }

  // Store calendar event ID with appointment
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { calendarEventId },
  });
}
```

---

## Encryption Checklist (CRITICAL)

**Every new provider MUST follow these encryption rules:**

### ✅ On OAuth Callback (Save to Database):

```typescript
// ✅ DO: Encrypt before saving
const { encrypted, iv, authTag } = encrypt(plaintext);
await prisma.calendarConnection.create({
  data: {
    email: encrypted,
    emailIv: iv,
    emailAuth: authTag,
    // ... same for accessToken and refreshToken
  },
});

// ❌ DON'T: Save plaintext
await prisma.calendarConnection.create({
  data: {
    email: primaryEmail, // ❌ WRONG - PII exposure
    accessToken: tokens.access_token, // ❌ WRONG - token exposure
  },
});
```

### ✅ On Token Use (Read from Database):

```typescript
// ✅ DO: Decrypt before use
const decryptedToken = decrypt(
  connection.accessToken,
  connection.accessTokenIv,
  connection.accessTokenAuth
);
const calendar = getCalendarClient(decryptedToken, ...);

// ❌ DON'T: Use encrypted value directly
const calendar = getCalendarClient(connection.accessToken, ...); // ❌ WRONG
```

### ✅ On Token Refresh:

```typescript
// ✅ DO: Re-encrypt new tokens
const newTokens = await refreshAccessToken(decryptedRefreshToken);
const { encrypted, iv, authTag } = encrypt(newTokens.access_token);
await prisma.calendarConnection.update({
  data: {
    accessToken: encrypted,
    accessTokenIv: iv,
    accessTokenAuth: authTag,
  },
});

// ❌ DON'T: Save new tokens in plaintext
await prisma.calendarConnection.update({
  data: {
    accessToken: newTokens.access_token, // ❌ WRONG
  },
});
```

### ✅ On Display (Return to Frontend):

```typescript
// ✅ DO: Decrypt before sending to user
const decryptedEmail = decrypt(conn.email, conn.emailIv, conn.emailAuth);
return { email: decryptedEmail };

// ❌ DON'T: Return encrypted data to frontend
return { email: conn.email }; // ❌ WRONG - shows hex string in UI
```

---

## Testing Checklist

### Phase 1: OAuth Flow
- [ ] Connect button initiates OAuth flow
- [ ] Redirect to provider's consent screen
- [ ] Callback receives authorization code
- [ ] Tokens exchanged successfully
- [ ] Connection saved to database with encrypted fields

### Phase 2: Database Verification
Open Prisma Studio: `npx prisma studio`

Navigate to `CalendarConnection` table:

- [ ] `email` is hex string (not plaintext email)
- [ ] `emailIv` populated (32 hex characters)
- [ ] `emailAuth` populated (32 hex characters)
- [ ] `accessToken` is hex string (not plaintext token)
- [ ] `accessTokenIv` populated
- [ ] `accessTokenAuth` populated
- [ ] `refreshToken` is hex string
- [ ] `refreshTokenIv` populated
- [ ] `refreshTokenAuth` populated
- [ ] `provider` field shows correct provider name

### Phase 3: Event Creation
- [ ] Book a test appointment
- [ ] Event appears in provider's calendar (Google Calendar, Outlook, etc.)
- [ ] Event details are correct (time, title, attendees)
- [ ] Attendees receive email notifications
- [ ] Event ID stored in `Appointment.calendarEventId`

### Phase 4: Event Updates
- [ ] Reschedule appointment
- [ ] Calendar event updates in provider's calendar
- [ ] Attendees receive update notifications

### Phase 5: Event Deletion
- [ ] Cancel appointment
- [ ] Calendar event removed from provider's calendar
- [ ] Attendees receive cancellation notifications

### Phase 6: Token Refresh
- [ ] Manually expire token (set `expiresAt` to past date in Prisma Studio)
- [ ] Create new appointment
- [ ] Verify token refreshes automatically
- [ ] New tokens are re-encrypted
- [ ] Event still created successfully

### Phase 7: UI Display
- [ ] Calendar connections list shows provider name
- [ ] Email displays correctly (decrypted, not hex string)
- [ ] Connection status shows correctly
- [ ] Disconnect button works

### Phase 8: Error Handling
- [ ] Disconnect calendar → Try to book → Shows "Connect calendar" message
- [ ] Corrupt encrypted data → Graceful error message
- [ ] Network error during OAuth → User-friendly error
- [ ] Rate limit exceeded → Appropriate error handling

---

## Provider-Specific Gotchas

### Google Calendar
- ✅ Requires `access_type: 'offline'` for refresh token
- ✅ Must use `prompt: 'consent'` to force refresh token on every auth
- ⚠️ Refresh tokens can be revoked by user in Google Account settings
- ⚠️ Tokens expire after 1 hour

### Microsoft Outlook
- ✅ Use Microsoft Graph API (`https://graph.microsoft.com/v1.0`)
- ✅ Requires `offline_access` scope for refresh token
- ⚠️ Tokens expire after 1 hour
- ⚠️ Different event format (uses `subject` instead of `summary`)

### Apple iCloud Calendar
- ⚠️ No OAuth - uses CalDAV with app-specific passwords
- ⚠️ Requires different authentication approach (Basic Auth)
- ⚠️ No automatic token refresh (passwords are long-lived)
- ⚠️ Event format follows CalDAV standard (iCalendar format)

### Generic CalDAV
- ⚠️ No standardized OAuth flow
- ⚠️ Typically uses Basic Authentication
- ⚠️ Store encrypted username/password instead of OAuth tokens
- ⚠️ Event creation uses iCalendar format (`.ics`)

---

## Security Best Practices

1. **Always Encrypt PII:**
   - Email addresses
   - OAuth tokens (access + refresh)
   - Any calendar event data containing PII

2. **Never Log Sensitive Data:**
   ```typescript
   // ❌ DON'T
   console.log('Access token:', accessToken);

   // ✅ DO
   console.log('Access token received:', accessToken ? 'yes' : 'no');
   ```

3. **Use HTTPS Only:**
   - Redirect URIs must use HTTPS in production
   - Never send tokens over HTTP

4. **Validate State Parameter:**
   ```typescript
   // ✅ DO: Verify state matches userId
   if (state !== expectedUserId) {
     throw new Error('Invalid state parameter - possible CSRF attack');
   }
   ```

5. **Set Proper Scopes:**
   - Only request minimum required scopes
   - Don't ask for `Calendars.ReadWrite.All` if `Calendars.ReadWrite` is enough

6. **Handle Token Expiration:**
   - Always check `expiresAt` before using token
   - Implement automatic refresh
   - Re-encrypt refreshed tokens

7. **Graceful Degradation:**
   - If calendar is disconnected, allow bookings without calendar sync
   - Show clear error messages to users
   - Provide easy reconnect option

---

## File Structure Summary

```
lib/
  [provider]/          # e.g., lib/outlook/
    oauth.ts           # OAuth flow helpers
    calendar.ts        # Calendar CRUD operations

app/api/
  calendar/
    connect/
      route.ts         # Initiate OAuth (multi-provider)
    callback/
      route.ts         # Handle OAuth callback (multi-provider)
    connections/
      route.ts         # List connections (already multi-provider)
    disconnect/
      route.ts         # Remove connection (already multi-provider)

docs/
  CALENDAR_PROVIDER_TEMPLATE.md  # This file
  OAUTH_ENCRYPTION_MANUAL_TEST.md # Encryption testing guide
```

---

## Quick Start for New Provider

1. **Register OAuth app** with provider
2. **Add environment variables** to `.env.local`
3. **Create `lib/[provider]/oauth.ts`** (copy from Google template)
4. **Create `lib/[provider]/calendar.ts`** (copy from Google template)
5. **Update `app/api/calendar/connect/route.ts`** to handle new provider
6. **Update `app/api/calendar/callback/route.ts`** to handle new provider
7. **Update frontend** to show new provider button
8. **Update appointment booking logic** to support new provider
9. **Test encryption** using checklist above
10. **Test full flow** from connect → book → update → cancel

---

## Example: Adding Outlook in 30 Minutes

1. Register app in Azure Portal (5 min)
2. Add env vars to `.env.local` (1 min)
3. Copy `lib/google/oauth.ts` → `lib/outlook/oauth.ts`, update endpoints (5 min)
4. Copy `lib/google/calendar.ts` → `lib/outlook/calendar.ts`, update API calls (10 min)
5. Update `connect` and `callback` routes with Outlook case (5 min)
6. Add "Connect Outlook" button to frontend (2 min)
7. Test and verify encryption (2 min)

**Total: ~30 minutes** ✅

---

## Support and Documentation

- **Google Calendar API:** https://developers.google.com/calendar
- **Microsoft Graph API:** https://learn.microsoft.com/en-us/graph/api/resources/calendar
- **Apple CalDAV:** https://developer.apple.com/documentation/
- **OAuth 2.0 Best Practices:** https://datatracker.ietf.org/doc/html/rfc6749

---

**Last Updated:** 2026-01-05
**Status:** ✅ Production Ready
**Encryption:** AES-256-GCM for all OAuth tokens and PII
