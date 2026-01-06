# Form Encryption - Manual Testing Guide

## Overview

Form submissions are now encrypted at rest using AES-256-GCM encryption. This protects PII (names, emails, phones, custom fields) if the database is compromised.

## What Was Implemented

### 1. Database Schema Changes
- `FormSubmission.data` changed from `Json` to `String` (stores encrypted hex)
- Added `FormSubmission.dataIv` - Initialization vector (String)
- Added `FormSubmission.dataAuth` - Authentication tag (String)

### 2. API Changes
- `POST /api/forms/submit` - Encrypts data before saving
- `GET /api/forms/[id]/submissions` - Decrypts data when retrieving

### 3. Encryption Library
- Uses AES-256-GCM (authenticated encryption)
- Automatic tamper detection
- Graceful error handling for corrupted data

## Manual Testing Steps

### Step 1: Start Development Server

```bash
npm run dev
```

###Step 2: Submit a Test Form

Use the widget or make a direct API call:

```bash
curl -X POST http://localhost:3000/api/forms/submit \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "YOUR_FORM_ID",
    "data": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "555-1234",
      "message": "Test submission with sensitive PII"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Thank you for your submission!",
  "submissionId": "clxxxx..."
}
```

### Step 3: Verify Encryption in Database

Open Prisma Studio:

```bash
npx prisma studio
```

Navigate to `FormSubmission` table and check the latest entry:

**What to verify:**
- ✅ `data` field contains HEX string (not JSON)
- ✅ `dataIv` field is populated (32 hex characters)
- ✅ `dataAuth` field is populated (32 hex characters)
- ✅ Cannot read plaintext data directly

**Example encrypted data:**
```
data: "8a4f2e1c9b7d3a5e..."  (hex string, not {"name": "John"...})
dataIv: "f1e3d5c7b9a1..."
dataAuth: "2c4e6a8b0d1f..."
```

### Step 4: Verify Decryption Works

Retrieve submissions through the API (requires authentication):

```bash
curl -X GET http://localhost:3000/api/forms/YOUR_FORM_ID/submissions \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "submissions": [
    {
      "id": "clxxxx...",
      "formId": "clxxxx...",
      "data": {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "555-1234",
        "message": "Test submission with sensitive PII"
      },
      "status": "new",
      "createdAt": "2026-01-05T..."
    }
  ]
}
```

**What to verify:**
- ✅ Data is decrypted and readable
- ✅ Matches original submission
- ✅ Only authorized users can decrypt

### Step 5: Test Tamper Detection (Optional)

1. In Prisma Studio, manually edit a submission's `dataAuth` value
2. Change last few characters to something else
3. Try to retrieve submissions via API
4. Should see: `{"data": {"error": "Failed to decrypt submission data"}}`

## Security Verification Checklist

- [ ] Form data encrypted in database (hex string)
- [ ] Cannot read plaintext from database
- [ ] Decryption works for authorized API calls
- [ ] Tampered data is detected and rejected
- [ ] Encryption key is in `.env.local` (not committed to git)
- [ ] No plaintext PII in database
- [ ] Error handling graceful (no crashes on decrypt failure)

## What's Protected

### Before Encryption (Database Breach = Data Exposed)
```sql
SELECT data FROM "FormSubmission";
-- Returns: {"name": "John Doe", "email": "john@example.com", "phone": "555-1234"}
```

### After Encryption (Database Breach = Data Protected)
```sql
SELECT data FROM "FormSubmission";
-- Returns: "8a4f2e1c9b7d3a5e1f0c2..." (unreadable hex string)
```

## Troubleshooting

### Error: "Failed to decrypt submission data"

**Causes:**
1. Wrong encryption key
2. Tampered/corrupted data
3. Migration issues

**Fix:**
1. Verify `ENCRYPTION_KEY` in `.env.local`
2. Check database integrity
3. Restore from backup if needed

### Error: "ENCRYPTION_KEY environment variable is not set"

**Fix:**
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
echo "ENCRYPTION_KEY=<generated_key>" >> .env.local

# Restart dev server
```

### Submission appears corrupted

If you see `{"error": "Failed to decrypt submission data"}`:

1. Check if data was submitted before encryption was enabled
2. Verify encryption key hasn't changed
3. Check database logs for corruption

## Next Steps

- ✅ Form submissions encrypted
- 🔜 OAuth tokens encryption (Phase 3)
- 🔜 PII redaction in logs (Phase 4)

## Files Modified

- `prisma/schema.prisma` - Added encryption fields
- `app/api/forms/submit/route.ts` - Encrypt on save
- `app/api/forms/[id]/submissions/route.ts` - Decrypt on read
- `lib/encryption.ts` - Encryption library

## Compliance

This encryption helps meet:
- **GDPR** - Data protection at rest
- **CCPA** - California privacy requirements
- **SOC 2** - Security controls
- **HIPAA** - If storing health data

---

**Last Updated:** 2026-01-05
**Status:** ✅ Complete and ready for testing
