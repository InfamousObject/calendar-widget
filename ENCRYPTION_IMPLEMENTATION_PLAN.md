# Data Encryption Implementation Plan

**Project:** SmartWidget - Calendar & Booking System
**Date:** 2026-01-02
**Priority:** HIGH (Next security focus after Clerk migration)
**Total Estimated Time:** 7-10 hours

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Core Encryption Library](#phase-1-core-encryption-library-1-hour)
3. [Phase 2: Form Submission Encryption](#phase-2-form-submission-encryption-4-6-hours)
4. [Phase 3: OAuth Token Encryption](#phase-3-oauth-token-encryption-3-4-hours)
5. [Phase 4: PII Redaction in Logs](#phase-4-pii-redaction-in-logs-2-3-hours)
6. [Testing Checklist](#testing-checklist)
7. [Rollback Plan](#rollback-plan)

---

## Overview

### Why Data Encryption?

After completing the Clerk migration, authentication and access control are now enterprise-grade. The main remaining security risk is **data at rest** - if an attacker gains direct database access (SQL injection, compromised credentials, insider threat), sensitive data would be exposed in plaintext.

### What We're Encrypting:

1. **Form Submissions** - Contains PII (names, emails, phones, custom fields)
2. **OAuth Tokens** - Google Calendar access/refresh tokens
3. **Logs** - Automatic PII redaction to prevent leaks

### Encryption Standard:

**AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode)
- Industry standard for data at rest
- Authenticated encryption (prevents tampering)
- Recommended by NIST for sensitive data
- Used by: AWS, Google Cloud, Azure

### Key Architecture:

- **Encryption Key:** 32-byte (256-bit) random key stored in environment variables
- **Initialization Vector (IV):** 16-byte random value, unique per encryption
- **Authentication Tag:** 16-byte tag for integrity verification
- **Storage:** Encrypted data + IV + auth tag all stored separately in database

---

## Phase 1: Core Encryption Library (1 hour)

### Step 1.1: Generate Encryption Key

**DO THIS FIRST** - Generate a secure encryption key:

```bash
# Generate 32-byte (256-bit) encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output and add to `.env.local`:**

```bash
# .env.local
ENCRYPTION_KEY=your_64_character_hex_string_here
```

⚠️ **CRITICAL:**
- Never commit this key to git
- Store in environment variables only
- Backup securely (if lost, encrypted data cannot be decrypted)
- Rotate annually or after suspected compromise

---

### Step 1.2: Create Encryption Utility Library

**File:** `lib/encryption.ts` (NEW FILE)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Throws error if not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 64) { // 32 bytes = 64 hex characters
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt data using AES-256-GCM
 * Returns encrypted data, IV, and authentication tag
 */
export function encrypt(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  try {
    // Generate random IV
    const iv = randomBytes(IV_LENGTH);

    // Get encryption key
    const key = getEncryptionKey();

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 * Requires encrypted data, IV, and authentication tag
 */
export function decrypt(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  try {
    // Get encryption key
    const key = getEncryptionKey();

    // Create decipher
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    // Set authentication tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
  }
}

/**
 * Encrypt JSON object
 */
export function encryptJSON<T>(data: T): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const jsonString = JSON.stringify(data);
  return encrypt(jsonString);
}

/**
 * Decrypt to JSON object
 */
export function decryptJSON<T>(
  encrypted: string,
  iv: string,
  authTag: string
): T {
  const jsonString = decrypt(encrypted, iv, authTag);
  return JSON.parse(jsonString);
}
```

---

### Step 1.3: Test Encryption Library

**File:** `lib/__tests__/encryption.test.ts` (NEW FILE)

```typescript
import { encrypt, decrypt, encryptJSON, decryptJSON } from '../encryption';

describe('Encryption Library', () => {
  beforeAll(() => {
    // Set test encryption key
    process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes in hex
  });

  test('should encrypt and decrypt string', () => {
    const plaintext = 'Hello, World!';
    const { encrypted, iv, authTag } = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(iv).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(authTag).toHaveLength(32); // 16 bytes = 32 hex chars

    const decrypted = decrypt(encrypted, iv, authTag);
    expect(decrypted).toBe(plaintext);
  });

  test('should encrypt and decrypt JSON', () => {
    const data = { name: 'John Doe', email: 'john@example.com' };
    const { encrypted, iv, authTag } = encryptJSON(data);

    const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);
    expect(decrypted).toEqual(data);
  });

  test('should throw error for tampered data', () => {
    const { encrypted, iv, authTag } = encrypt('test');

    // Tamper with encrypted data
    const tampered = encrypted.slice(0, -2) + 'ff';

    expect(() => decrypt(tampered, iv, authTag)).toThrow();
  });

  test('should throw error for wrong auth tag', () => {
    const { encrypted, iv } = encrypt('test');
    const wrongAuthTag = 'a'.repeat(32);

    expect(() => decrypt(encrypted, iv, wrongAuthTag)).toThrow();
  });
});
```

**Run tests:**

```bash
npm test lib/__tests__/encryption.test.ts
```

✅ **Checkpoint:** All encryption tests should pass before proceeding.

---

## Phase 2: Form Submission Encryption (4-6 hours)

### Current State Analysis

**File:** `app/api/forms/[id]/submit/route.ts` (line 85-95)

```typescript
const submission = await prisma.formSubmission.create({
  data: {
    formId,
    data: validatedData.data, // ⚠️ Stored as plain JSON
    status: 'new',
    ipAddress: request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  },
});
```

**Risk:** Form data contains PII and is stored unencrypted.

---

### Step 2.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

**Find the FormSubmission model** and update it:

```prisma
model FormSubmission {
  id        String   @id @default(cuid())
  formId    String
  form      ContactForm @relation(fields: [formId], references: [id], onDelete: Cascade)

  // Encrypted data fields
  data      String   // Encrypted JSON string (was: Json)
  dataIv    String   // Initialization vector for decryption
  dataAuth  String   // Authentication tag for integrity verification

  status    FormSubmissionStatus @default(new)
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([formId])
  @@index([status])
  @@index([createdAt])
}
```

**Changes:**
- `data Json` → `data String` (stores encrypted hex string)
- Added `dataIv String` (initialization vector)
- Added `dataAuth String` (authentication tag)

---

### Step 2.2: Create Prisma Migration

```bash
# Generate migration
npx prisma migrate dev --name add_form_submission_encryption

# This will:
# 1. Change data column from JSONB to TEXT
# 2. Add dataIv column (TEXT)
# 3. Add dataAuth column (TEXT)
```

⚠️ **WARNING:** This migration will **clear existing form submissions** because we're changing the column type. If you have production data:

**Option A - Safe Migration (Recommended):**

```sql
-- Manual migration to preserve existing data
-- 1. Create new columns
ALTER TABLE "FormSubmission"
  ADD COLUMN "dataIv" TEXT,
  ADD COLUMN "dataAuth" TEXT;

-- 2. Keep old data column temporarily
ALTER TABLE "FormSubmission"
  RENAME COLUMN "data" TO "data_old";

-- 3. Add new encrypted data column
ALTER TABLE "FormSubmission"
  ADD COLUMN "data" TEXT;

-- 4. Mark old submissions for re-encryption (manual process)
-- Or delete if acceptable: DELETE FROM "FormSubmission";

-- 5. After migration complete, drop old column:
-- ALTER TABLE "FormSubmission" DROP COLUMN "data_old";
```

**Option B - Fresh Start (If acceptable):**

```bash
# Delete all form submissions
npx prisma db execute --stdin <<< "DELETE FROM \"FormSubmission\";"

# Run migration
npx prisma migrate dev --name add_form_submission_encryption
```

---

### Step 2.3: Update Form Submission API (Encrypt on Save)

**File:** `app/api/forms/[id]/submit/route.ts`

**Find the submission creation code** (around line 85) and update:

```typescript
import { encryptJSON } from '@/lib/encryption';

// ... existing validation code ...

// Encrypt form data before saving
const { encrypted, iv, authTag } = encryptJSON(validatedData.data);

const submission = await prisma.formSubmission.create({
  data: {
    formId,
    data: encrypted,     // Encrypted hex string
    dataIv: iv,          // IV for decryption
    dataAuth: authTag,   // Auth tag for verification
    status: 'new',
    ipAddress: request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  },
});

// ⚠️ Don't return decrypted data in response
return NextResponse.json({
  success: true,
  submissionId: submission.id
});
```

**Key changes:**
1. Import `encryptJSON` from encryption library
2. Encrypt `validatedData.data` before saving
3. Store encrypted data, IV, and auth tag separately
4. Don't return decrypted data in public response

---

### Step 2.4: Update Form Submissions Retrieval (Decrypt on Read)

**File:** `app/api/forms/[id]/submissions/route.ts`

**Find the submissions fetch code** (around line 50) and update:

```typescript
import { decryptJSON } from '@/lib/encryption';

// ... existing auth and validation ...

const submissions = await prisma.formSubmission.findMany({
  where: { formId: params.id },
  orderBy: { createdAt: 'desc' },
});

// Decrypt submissions before returning
const decryptedSubmissions = submissions.map((submission) => {
  try {
    const decryptedData = decryptJSON<Record<string, any>>(
      submission.data,
      submission.dataIv,
      submission.dataAuth
    );

    return {
      id: submission.id,
      formId: submission.formId,
      data: decryptedData, // Decrypted form data
      status: submission.status,
      ipAddress: submission.ipAddress,
      userAgent: submission.userAgent,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  } catch (error) {
    console.error(`Failed to decrypt submission ${submission.id}:`, error);
    // Return placeholder for corrupted data
    return {
      id: submission.id,
      formId: submission.formId,
      data: { error: 'Failed to decrypt submission' },
      status: submission.status,
      ipAddress: submission.ipAddress,
      userAgent: submission.userAgent,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }
});

return NextResponse.json({ submissions: decryptedSubmissions });
```

**Key changes:**
1. Import `decryptJSON` from encryption library
2. Decrypt each submission using stored IV and auth tag
3. Handle decryption errors gracefully (log error, return placeholder)
4. Return decrypted data only to authenticated users

---

### Step 2.5: Update Individual Submission Retrieval

**File:** `app/api/forms/[formId]/submissions/[id]/route.ts`

If this file exists, update it similarly:

```typescript
import { decryptJSON } from '@/lib/encryption';

// ... auth check ...

const submission = await prisma.formSubmission.findUnique({
  where: { id: params.id },
});

if (!submission) {
  return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
}

// Verify ownership
if (submission.formId !== params.formId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Decrypt submission data
try {
  const decryptedData = decryptJSON<Record<string, any>>(
    submission.data,
    submission.dataIv,
    submission.dataAuth
  );

  return NextResponse.json({
    ...submission,
    data: decryptedData,
  });
} catch (error) {
  console.error('Decryption error:', error);
  return NextResponse.json(
    { error: 'Failed to decrypt submission' },
    { status: 500 }
  );
}
```

---

### Step 2.6: Test Form Submission Encryption

**Manual Testing:**

1. **Submit a new form:**
   ```bash
   curl -X POST http://localhost:3000/api/forms/{formId}/submit \
     -H "Content-Type: application/json" \
     -d '{
       "data": {
         "name": "Test User",
         "email": "test@example.com",
         "phone": "555-1234",
         "message": "This is a test submission"
       }
     }'
   ```

2. **Check database directly:**
   ```bash
   npx prisma studio
   # Navigate to FormSubmission table
   # Verify:
   # - data field contains hex string (not JSON)
   # - dataIv and dataAuth fields are populated
   # - Cannot read plaintext data
   ```

3. **Retrieve submissions (should be decrypted):**
   ```bash
   curl -X GET http://localhost:3000/api/forms/{formId}/submissions \
     -H "Authorization: Bearer {your_token}"

   # Should return decrypted data in JSON format
   ```

4. **Test decryption failure:**
   ```sql
   -- In Prisma Studio, manually change dataAuth value
   UPDATE "FormSubmission"
   SET "dataAuth" = 'ffffffffffffffffffffffffffffffff'
   WHERE id = 'some_id';
   ```

   Then try retrieving - should see error handling

✅ **Checkpoint:**
- ✅ New submissions are encrypted in database
- ✅ Encrypted data cannot be read directly
- ✅ Authenticated users can decrypt and view submissions
- ✅ Tampered data throws decryption error

---

## Phase 3: OAuth Token Encryption (3-4 hours)

### Current State Analysis

**File:** `lib/google-calendar.ts` and `app/api/calendar/connect/route.ts`

```typescript
// Tokens stored in plaintext
await prisma.calendarIntegration.create({
  data: {
    userId,
    provider: 'google',
    email: tokenInfo.email,
    accessToken: tokens.access_token,  // ⚠️ Plaintext
    refreshToken: tokens.refresh_token, // ⚠️ Plaintext
    expiresAt: new Date(tokens.expiry_date),
  },
});
```

**Risk:** If database is compromised, attacker gains full access to user calendars.

---

### Step 3.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

**Find the CalendarIntegration model** and update:

```prisma
model CalendarIntegration {
  id               String    @id @default(cuid())
  userId           String    @unique
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  provider         String    // 'google', 'outlook', etc.
  email            String?   // Calendar account email

  // Encrypted access token
  accessToken      String    // Encrypted token
  accessTokenIv    String    // IV for access token
  accessTokenAuth  String    // Auth tag for access token

  // Encrypted refresh token
  refreshToken     String?   // Encrypted token (nullable)
  refreshTokenIv   String?   // IV for refresh token (nullable)
  refreshTokenAuth String?   // Auth tag for refresh token (nullable)

  expiresAt        DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  @@index([userId])
  @@index([provider])
}
```

**Changes:**
- Added `accessTokenIv` and `accessTokenAuth`
- Added `refreshTokenIv` and `refreshTokenAuth` (nullable since refresh token is optional)

---

### Step 3.2: Create Migration

```bash
npx prisma migrate dev --name add_oauth_token_encryption
```

⚠️ **WARNING:** This will require users to re-authenticate their calendars.

**Migration strategy:**

```sql
-- Add new columns
ALTER TABLE "CalendarIntegration"
  ADD COLUMN "accessTokenIv" TEXT,
  ADD COLUMN "accessTokenAuth" TEXT,
  ADD COLUMN "refreshTokenIv" TEXT,
  ADD COLUMN "refreshTokenAuth" TEXT;

-- Delete existing integrations (users will need to reconnect)
DELETE FROM "CalendarIntegration";

-- Make new columns required (after deletion)
ALTER TABLE "CalendarIntegration"
  ALTER COLUMN "accessTokenIv" SET NOT NULL,
  ALTER COLUMN "accessTokenAuth" SET NOT NULL;
```

Or if you want to notify users first:

```typescript
// Set a flag on user accounts
UPDATE "User" SET "calendarReconnectRequired" = true;
// Display banner: "Please reconnect your calendar for improved security"
```

---

### Step 3.3: Update Calendar Connection (Encrypt Tokens)

**File:** `app/api/calendar/connect/route.ts`

**Find the token storage code** and update:

```typescript
import { encrypt } from '@/lib/encryption';

// ... OAuth flow ...

// Encrypt access token
const {
  encrypted: encryptedAccessToken,
  iv: accessTokenIv,
  authTag: accessTokenAuth,
} = encrypt(tokens.access_token);

// Encrypt refresh token (if present)
let encryptedRefreshToken: string | null = null;
let refreshTokenIv: string | null = null;
let refreshTokenAuth: string | null = null;

if (tokens.refresh_token) {
  const refreshEncryption = encrypt(tokens.refresh_token);
  encryptedRefreshToken = refreshEncryption.encrypted;
  refreshTokenIv = refreshEncryption.iv;
  refreshTokenAuth = refreshEncryption.authTag;
}

// Store encrypted tokens
await prisma.calendarIntegration.upsert({
  where: { userId },
  update: {
    provider: 'google',
    email: tokenInfo.email,
    accessToken: encryptedAccessToken,
    accessTokenIv,
    accessTokenAuth,
    refreshToken: encryptedRefreshToken,
    refreshTokenIv,
    refreshTokenAuth,
    expiresAt: new Date(tokens.expiry_date),
    updatedAt: new Date(),
  },
  create: {
    userId,
    provider: 'google',
    email: tokenInfo.email,
    accessToken: encryptedAccessToken,
    accessTokenIv,
    accessTokenAuth,
    refreshToken: encryptedRefreshToken,
    refreshTokenIv,
    refreshTokenAuth,
    expiresAt: new Date(tokens.expiry_date),
  },
});
```

---

### Step 3.4: Update Token Retrieval (Decrypt for API Calls)

**File:** `lib/google-calendar.ts`

**Create a helper function to get decrypted OAuth client:**

```typescript
import { decrypt } from './encryption';
import { google } from 'googleapis';
import { prisma } from './prisma';

/**
 * Get authenticated Google Calendar client for user
 */
export async function getGoogleCalendarClient(userId: string) {
  // Fetch encrypted integration
  const integration = await prisma.calendarIntegration.findUnique({
    where: { userId },
  });

  if (!integration || integration.provider !== 'google') {
    throw new Error('Google Calendar not connected');
  }

  // Decrypt access token
  const accessToken = decrypt(
    integration.accessToken,
    integration.accessTokenIv,
    integration.accessTokenAuth
  );

  // Decrypt refresh token (if present)
  let refreshToken: string | undefined;
  if (
    integration.refreshToken &&
    integration.refreshTokenIv &&
    integration.refreshTokenAuth
  ) {
    refreshToken = decrypt(
      integration.refreshToken,
      integration.refreshTokenIv,
      integration.refreshTokenAuth
    );
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: integration.expiresAt?.getTime(),
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    // Encrypt new access token
    const {
      encrypted: newEncryptedAccessToken,
      iv: newAccessTokenIv,
      authTag: newAccessTokenAuth,
    } = encrypt(tokens.access_token!);

    // Encrypt new refresh token if present
    let newEncryptedRefreshToken: string | null = null;
    let newRefreshTokenIv: string | null = null;
    let newRefreshTokenAuth: string | null = null;

    if (tokens.refresh_token) {
      const refreshEncryption = encrypt(tokens.refresh_token);
      newEncryptedRefreshToken = refreshEncryption.encrypted;
      newRefreshTokenIv = refreshEncryption.iv;
      newRefreshTokenAuth = refreshEncryption.authTag;
    }

    // Update encrypted tokens in database
    await prisma.calendarIntegration.update({
      where: { userId },
      data: {
        accessToken: newEncryptedAccessToken,
        accessTokenIv: newAccessTokenIv,
        accessTokenAuth: newAccessTokenAuth,
        ...(newEncryptedRefreshToken && {
          refreshToken: newEncryptedRefreshToken,
          refreshTokenIv: newRefreshTokenIv,
          refreshTokenAuth: newRefreshTokenAuth,
        }),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}
```

---

### Step 3.5: Update All Calendar API Calls

**Find all files that use Google Calendar API** and update them to use the new helper:

**Before:**
```typescript
// Old approach - direct token access
const integration = await prisma.calendarIntegration.findUnique({...});
const oauth2Client = new google.auth.OAuth2(...);
oauth2Client.setCredentials({
  access_token: integration.accessToken, // Plaintext
  refresh_token: integration.refreshToken, // Plaintext
});
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
```

**After:**
```typescript
// New approach - encrypted tokens
import { getGoogleCalendarClient } from '@/lib/google-calendar';

const calendar = await getGoogleCalendarClient(userId);
// Tokens are automatically decrypted
```

**Files to update:**
- `lib/google-calendar.ts` - All calendar functions
- `app/api/appointments/book/route.ts` - Calendar event creation
- `app/api/appointments/[id]/route.ts` - Event updates/deletion
- `app/api/calendar/events/route.ts` - Event listing
- Any other files that access calendar API

---

### Step 3.6: Test OAuth Token Encryption

1. **Connect Google Calendar:**
   - Navigate to `/dashboard/calendar`
   - Click "Connect Google Calendar"
   - Complete OAuth flow

2. **Verify encryption in database:**
   ```bash
   npx prisma studio
   # Navigate to CalendarIntegration table
   # Verify:
   # - accessToken is hex string (not JWT)
   # - accessTokenIv and accessTokenAuth are populated
   # - Cannot read plaintext token
   ```

3. **Test calendar functionality:**
   - Create a new appointment booking
   - Verify event appears in Google Calendar
   - Update an appointment
   - Delete an appointment
   - All should work seamlessly with encrypted tokens

4. **Test token refresh:**
   ```typescript
   // Set token expiry to past
   await prisma.calendarIntegration.update({
     where: { userId: 'test_user' },
     data: { expiresAt: new Date(Date.now() - 1000) }
   });

   // Make calendar API call
   // Should automatically refresh and re-encrypt token
   ```

✅ **Checkpoint:**
- ✅ New calendar connections store encrypted tokens
- ✅ Calendar API calls work with encrypted tokens
- ✅ Token refresh re-encrypts new tokens
- ✅ Tokens cannot be read from database

---

## Phase 4: PII Redaction in Logs (2-3 hours)

### Current State Analysis

**Current logging:**
```typescript
console.log('[Book] Received body:', body); // ⚠️ May contain email, phone
console.error('Error creating appointment:', error); // ⚠️ May contain PII in error details
```

**Risk:** PII leaks into application logs, error tracking systems, or cloud logging platforms.

---

### Step 4.1: Install Pino Logger

```bash
npm install pino pino-pretty
```

---

### Step 4.2: Create Logger Utility

**File:** `lib/logger.ts` (NEW FILE)

```typescript
import pino from 'pino';

// Define PII fields to redact
const PII_PATHS = [
  // Top-level fields
  'email',
  'phone',
  'name',
  'password',
  'token',
  'apiKey',
  'accessToken',
  'refreshToken',
  'cancellationToken',

  // Nested request fields
  'req.body.email',
  'req.body.phone',
  'req.body.name',
  'req.body.password',
  'req.headers.authorization',
  'req.headers.cookie',

  // Custom form fields (wildcard)
  'customFields.*',
  'data.*',

  // Database fields
  'user.email',
  'user.password',
  'submission.data',
];

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Redact sensitive fields
  redact: {
    paths: PII_PATHS,
    censor: '[REDACTED]', // Replace with this string
    remove: false, // Keep field with censored value (true = remove field entirely)
  },

  // Format output
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },

  // Pretty print in development
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export default logger;

// Type-safe logging helpers
export const log = {
  info: (data: any, message: string) => logger.info(data, message),
  error: (data: any, message: string) => logger.error(data, message),
  warn: (data: any, message: string) => logger.warn(data, message),
  debug: (data: any, message: string) => logger.debug(data, message),
};
```

---

### Step 4.3: Replace Console Logs in API Routes

**Example transformation:**

**Before:**
```typescript
// app/api/appointments/book/route.ts
console.log('[Book] Received booking request:', body);

try {
  // ... booking logic ...
} catch (error) {
  console.error('Error creating appointment:', error);
  return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
}
```

**After:**
```typescript
import logger from '@/lib/logger';

// Log without exposing PII
logger.info(
  {
    widgetId,
    appointmentTypeId,
    startTime,
    // email, phone, name will be automatically redacted
  },
  'Booking request received'
);

try {
  // ... booking logic ...
} catch (error) {
  logger.error(
    {
      err: error, // Pino serializes errors properly
      widgetId,
      appointmentTypeId,
    },
    'Failed to create appointment'
  );
  return NextResponse.json({ error: 'Booking failed' }, { status: 500 });
}
```

---

### Step 4.4: Update All API Routes

**Files to update** (replace all `console.*` calls):

1. **Appointment Routes:**
   - `app/api/appointments/book/route.ts`
   - `app/api/appointments/[id]/route.ts`
   - `app/api/appointments/cancel/route.ts`
   - `app/api/available-slots/route.ts`

2. **Form Routes:**
   - `app/api/forms/[id]/submit/route.ts`
   - `app/api/forms/[id]/submissions/route.ts`
   - `app/api/forms/route.ts`

3. **Auth Routes:**
   - `app/api/auth/*/route.ts` (if any Clerk webhook handlers)

4. **Calendar Routes:**
   - `app/api/calendar/connect/route.ts`
   - `app/api/calendar/callback/route.ts`
   - `app/api/calendar/disconnect/route.ts`

5. **Chatbot Routes:**
   - `app/api/chatbot/chat/route.ts`
   - `app/api/chatbot/config/route.ts`

6. **Stripe Webhook:**
   - `app/api/stripe/webhook/route.ts`

**Pattern for updates:**

```typescript
// Before
console.log('Message', data);
console.error('Error:', error);

// After
import logger from '@/lib/logger';

logger.info({ ...data }, 'Message');
logger.error({ err: error, ...context }, 'Error description');
```

---

### Step 4.5: Update Library Files

**Files to update:**
- `lib/google-calendar.ts`
- `lib/claude.ts`
- `lib/subscription.ts`
- Any other files with `console.*` calls

---

### Step 4.6: Add Request ID for Tracing (Optional but Recommended)

**File:** `middleware.ts` (or create if doesn't exist)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export function middleware(request: NextRequest) {
  // Generate unique request ID
  const requestId = randomBytes(8).toString('hex');

  // Add to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add to response headers
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

**Use in logging:**

```typescript
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id');

  logger.info({ requestId }, 'Processing booking request');

  // All logs for this request will have the same requestId
  // Makes it easy to trace a request through the system
}
```

---

### Step 4.7: Test PII Redaction

1. **Test with real PII:**
   ```typescript
   import logger from '@/lib/logger';

   logger.info({
     email: 'test@example.com',
     phone: '555-1234',
     name: 'John Doe',
     appointmentId: 'abc123'
   }, 'Test log');

   // Output should show:
   // {
   //   "email": "[REDACTED]",
   //   "phone": "[REDACTED]",
   //   "name": "[REDACTED]",
   //   "appointmentId": "abc123"
   // }
   ```

2. **Test nested objects:**
   ```typescript
   logger.info({
     user: {
       email: 'test@example.com',
       id: 'user123'
     }
   }, 'User action');

   // Output:
   // {
   //   "user": {
   //     "email": "[REDACTED]",
   //     "id": "user123"
   //   }
   // }
   ```

3. **Check production logs:**
   - Deploy to staging/production
   - Trigger some API calls
   - Check logs in your hosting platform (Vercel, AWS, etc.)
   - Verify no PII is visible

✅ **Checkpoint:**
- ✅ All console.* calls replaced with logger
- ✅ PII fields automatically redacted
- ✅ Logs include context (requestId, userId, etc.)
- ✅ Production logs don't contain sensitive data

---

## Testing Checklist

### Encryption Library
- [ ] Encrypt/decrypt string works
- [ ] Encrypt/decrypt JSON works
- [ ] Tampered data throws error
- [ ] Wrong auth tag throws error
- [ ] Missing encryption key throws error

### Form Submissions
- [ ] New submissions are encrypted in database
- [ ] Encrypted data is unreadable in Prisma Studio
- [ ] Authenticated users can view decrypted submissions
- [ ] Tampered submissions show error message
- [ ] Old submissions handled gracefully (if migration preserved them)

### OAuth Tokens
- [ ] New calendar connections encrypt tokens
- [ ] Calendar API calls work with encrypted tokens
- [ ] Token refresh re-encrypts new tokens
- [ ] Encrypted tokens unreadable in database
- [ ] Users can create/update/delete calendar events

### Logging
- [ ] Email fields are redacted in logs
- [ ] Phone numbers are redacted
- [ ] Names are redacted
- [ ] Tokens/passwords are redacted
- [ ] Non-PII data is still logged (IDs, timestamps, etc.)
- [ ] Request IDs help trace requests (if implemented)

---

## Rollback Plan

If encryption causes issues in production:

### Immediate Rollback (Emergency)

1. **Revert encryption library:**
   ```bash
   git revert {encryption-commit-hash}
   ```

2. **Restore previous schema:**
   ```bash
   # Revert migration
   npx prisma migrate resolve --rolled-back {migration-name}

   # Apply previous migration
   npx prisma migrate deploy
   ```

3. **Redeploy previous version:**
   ```bash
   git push origin main --force
   ```

### Data Recovery

If encrypted data is corrupted:

1. **Check database backup:**
   - Supabase has automatic daily backups
   - Restore from backup if within recovery window

2. **Manual decryption script:**
   ```typescript
   // scripts/decrypt-all.ts
   import { prisma } from '../lib/prisma';
   import { decryptJSON } from '../lib/encryption';

   async function decryptAll() {
     const submissions = await prisma.formSubmission.findMany();

     for (const submission of submissions) {
       try {
         const decrypted = decryptJSON(
           submission.data,
           submission.dataIv,
           submission.dataAuth
         );
         console.log(`Submission ${submission.id}:`, decrypted);
       } catch (error) {
         console.error(`Failed to decrypt ${submission.id}:`, error);
       }
     }
   }

   decryptAll();
   ```

3. **Contact users:**
   - If form submissions are lost, apologize and request re-submission
   - If calendar integration broken, ask users to reconnect

---

## Post-Implementation

### Documentation Updates

1. **Update README.md:**
   ```markdown
   ## Security Features

   - AES-256-GCM encryption for form submissions
   - Encrypted OAuth tokens for calendar integrations
   - Automatic PII redaction in application logs
   ```

2. **Update SECURITY_AUDIT.md:**
   - Mark data encryption items as COMPLETED
   - Update "Recommended Next" to point to security headers

3. **Update .env.example:**
   ```bash
   # Encryption key for data at rest (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ENCRYPTION_KEY=your_64_character_hex_key_here
   ```

### Monitoring

Set up alerts for:
- Decryption failures (indicates data corruption or key issues)
- Missing encryption key errors
- High volume of encryption errors

### Key Management

- [ ] Backup encryption key in secure location (password manager, vault)
- [ ] Document key rotation procedure
- [ ] Set calendar reminder for annual key rotation
- [ ] Test key rotation in staging environment

### Compliance

- [ ] Update privacy policy to mention encryption at rest
- [ ] Document encryption in SOC 2 audit materials (if applicable)
- [ ] Add to GDPR compliance documentation

---

## Success Criteria

✅ **Data Encryption Implementation is Complete When:**

1. All form submissions are encrypted in database
2. All OAuth tokens are encrypted in database
3. PII is automatically redacted from all logs
4. All tests pass
5. No production errors related to encryption
6. Documentation is updated
7. Team is trained on encryption key management

**Estimated Total Time:** 7-10 hours
**Risk Level:** MEDIUM (requires schema migration, user re-authentication)
**Impact:** HIGH (protects against database breach scenarios)

---

## Questions or Issues?

If you encounter problems during implementation:

1. **Check encryption key:**
   - Is `ENCRYPTION_KEY` set in environment?
   - Is it 64 hex characters (32 bytes)?

2. **Migration issues:**
   - Review Prisma migration logs
   - Check if existing data needs manual migration
   - Consider using safe migration approach

3. **Decryption failures:**
   - Verify IV and auth tag are being saved correctly
   - Check that encryption key hasn't changed
   - Look for data corruption in database

4. **Performance concerns:**
   - Encryption/decryption is very fast (<1ms per operation)
   - If slow, check database query performance instead
   - Consider caching decrypted data in memory (with caution)

---

**Ready to start? Begin with Phase 1: Core Encryption Library**
