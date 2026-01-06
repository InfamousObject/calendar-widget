# OAuth Token Encryption - Manual Testing Guide

## Overview

Google Calendar OAuth tokens (access_token and refresh_token) are now encrypted at rest using AES-256-GCM encryption. This protects calendar access if the database is compromised.

## What Was Implemented

### 1. Database Schema Changes
- `CalendarConnection.accessToken` changed to store encrypted hex string
- Added `CalendarConnection.accessTokenIv` - Initialization vector (String)
- Added `CalendarConnection.accessTokenAuth` - Authentication tag (String)
- `CalendarConnection.refreshToken` changed to store encrypted hex string
- Added `CalendarConnection.refreshTokenIv` - Initialization vector (String)
- Added `CalendarConnection.refreshTokenAuth` - Authentication tag (String)

### 2. API Changes
- `GET /api/calendar/callback` - Encrypts tokens after OAuth flow
- `lib/google/calendar.ts` - Decrypts tokens for API calls
- Token refresh automatically re-encrypts new tokens

### 3. Security Features
- AES-256-GCM authenticated encryption
- Automatic tamper detection
- Token refresh preserves encryption
- Graceful error handling

## Manual Testing Steps

### Step 1: Clear Existing Calendar Connections

Existing connections have plaintext tokens. They were deleted during migration.

Users will need to reconnect their calendars.

### Step 2: Connect Google Calendar

1. Start development server:
```bash
npm run dev
```

2. Navigate to: `http://localhost:3000/dashboard/calendar`

3. Click **"Connect Google Calendar"**

4. Complete OAuth flow:
   - Select Google account
   - Grant calendar permissions
   - Should redirect back to dashboard

**Expected Result:**
- Success message: "Calendar connected successfully"
- Calendar listed in connections

### Step 3: Verify Encryption in Database

Open Prisma Studio:
```bash
npx prisma studio
```

Navigate to `CalendarConnection` table:

**What to verify:**
- ✅ `accessToken` contains HEX string (not JWT starting with "ya29.")
- ✅ `accessTokenIv` populated (32 hex characters)
- ✅ `accessTokenAuth` populated (32 hex characters)
- ✅ `refreshToken` contains HEX string (not starting with "1//")
- ✅ `refreshTokenIv` populated (32 hex characters)
- ✅ `refreshTokenAuth` populated (32 hex characters)
- ✅ Cannot read plaintext tokens

**Example encrypted data:**
```
accessToken: "a4f2e1c9b7d3a5e8f1..."  (hex, not "ya29.abc...")
accessTokenIv: "f1e3d5c7b9a1..."
accessTokenAuth: "2c4e6a8b0d1f..."

refreshToken: "b3e5d7f9c1a3..."  (hex, not "1//0gHd...")
refreshTokenIv: "d2f4e6a8c0b2..."
refreshTokenAuth: "8a6c4e2b0d1f..."
```

### Step 4: Test Calendar Functionality

Create an appointment to verify calendar integration still works:

1. Navigate to appointment booking page
2. Book a test appointment
3. Check Google Calendar - event should appear

**What this tests:**
- ✅ Tokens are decrypted correctly
- ✅ Google Calendar API calls work
- ✅ Events can be created with encrypted tokens

### Step 5: Test Token Refresh (Advanced)

Tokens automatically refresh when expired. To test:

1. In Prisma Studio, modify `expiresAt` to past date:
   ```sql
   UPDATE "CalendarConnection"
   SET "expiresAt" = NOW() - INTERVAL '1 hour'
   WHERE id = 'your_connection_id';
   ```

2. Create another appointment

3. Check database again - verify:
   - ✅ `expiresAt` updated to future date
   - ✅ `accessToken` changed (re-encrypted)
   - ✅ New IV and auth tag generated
   - ✅ Event still created successfully

## Security Verification Checklist

- [ ] OAuth tokens encrypted in database (hex strings)
- [ ] Cannot read plaintext tokens from database
- [ ] Calendar API calls work (tokens decrypted properly)
- [ ] Token refresh re-encrypts new tokens
- [ ] Events can be created/updated/deleted
- [ ] Encryption key in `.env.local` (not committed)
- [ ] No plaintext tokens in database
- [ ] Error handling graceful (reconnect prompt if decrypt fails)

## What's Protected

### Before Encryption (Database Breach = Full Calendar Access)
```sql
SELECT "accessToken", "refreshToken" FROM "CalendarConnection";
-- Returns: "ya29.a0AfH6SM...", "1//0gHdOr2..."
-- Attacker can use these tokens to access calendars
```

### After Encryption (Database Breach = Tokens Protected)
```sql
SELECT "accessToken", "refreshToken" FROM "CalendarConnection";
-- Returns: "8a4f2e1c9b7d...", "b3e5d7f9c1a3..."
-- Unreadable hex strings, useless without encryption key
```

## Attack Scenarios Prevented

| Attack | Before | After |
|--------|--------|-------|
| **SQL Injection** | Steal tokens → Access calendars | Get hex strings → Useless |
| **Database Backup Theft** | All tokens readable → Mass compromise | Encrypted → Need key |
| **Insider Threat** | DBA sees all tokens | DBA sees encrypted data only |
| **Token Replay** | Stolen token works forever | Tampered token rejected |

## Troubleshooting

### Error: "Failed to decrypt calendar tokens - please reconnect your calendar"

**Causes:**
1. Wrong encryption key
2. Corrupted token data
3. Tampered database entry

**Fix:**
1. Verify `ENCRYPTION_KEY` in `.env.local` hasn't changed
2. User should disconnect and reconnect calendar
3. Delete and recreate connection if corrupted

### Calendar features not working

**Symptoms:**
- Can't create appointments
- Events not syncing
- "Calendar not connected" error

**Fix:**
1. Check if user has calendar connected
2. Verify tokens can be decrypted
3. Check Google Calendar API quota
4. Reconnect calendar if needed

### Token refresh fails

**Symptoms:**
- Appointments fail after initial success
- "Token expired" errors

**Fix:**
1. Check refresh token is encrypted properly
2. Verify Google OAuth app settings
3. Reconnect calendar to get new tokens

## User Impact

### What Users Need to Do

**After deploying this update:**
1. Users will see: "Please reconnect your Google Calendar for improved security"
2. Users click "Connect Google Calendar"
3. Complete OAuth flow again
4. Calendar connection restored with encrypted tokens

### Communication Template

```
Subject: Security Improvement - Reconnect Your Calendar

We've implemented enhanced security for your calendar integration.
Your calendar connection needs to be re-established.

This one-time step protects your calendar data with enterprise-grade encryption.

Click here to reconnect: [Link to /dashboard/calendar]

Thank you for keeping your account secure!
```

## Technical Details

### Encryption Workflow

**On Connect:**
```
OAuth callback receives tokens
  ↓
Encrypt access_token → (encrypted, IV, auth tag)
  ↓
Encrypt refresh_token → (encrypted, IV, auth tag)
  ↓
Store all 6 fields in database
```

**On Use:**
```
Retrieve connection from database
  ↓
Decrypt access_token using (encrypted, IV, auth tag)
  ↓
Decrypt refresh_token using (encrypted, IV, auth tag)
  ↓
Use decrypted tokens for Google Calendar API
```

**On Refresh:**
```
Decrypt refresh_token
  ↓
Call Google API to refresh
  ↓
Encrypt new access_token
  ↓
Encrypt new refresh_token (if provided)
  ↓
Update database with new encrypted values
```

### Token Lifetimes

- **Access Token:** 1 hour (Google default)
- **Refresh Token:** Long-lived (can last years)
- **Encryption:** Does not affect token validity
- **Auto-refresh:** Happens transparently before expiration

## Compliance Benefits

This encryption helps meet:
- **SOC 2** - Encryption of sensitive credentials
- **ISO 27001** - Data protection controls
- **GDPR** - Security of authentication tokens
- **OAuth 2.0 Best Practices** - Token security

## Next Steps

- ✅ Form submissions encrypted (Phase 2)
- ✅ OAuth tokens encrypted (Phase 3)
- 🔜 PII redaction in logs (Phase 4)

## Files Modified

- `prisma/schema.prisma` - Added encryption fields
- `app/api/calendar/callback/route.ts` - Encrypt on save
- `lib/google/calendar.ts` - Decrypt for use, re-encrypt on refresh
- `lib/encryption.ts` - Already created (Phase 1)

---

**Last Updated:** 2026-01-05
**Status:** ✅ Complete and ready for testing
**Migration Required:** Yes - users must reconnect calendars
