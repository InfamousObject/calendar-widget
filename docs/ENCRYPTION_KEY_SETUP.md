# Encryption Key Setup Guide

## Overview

SmartWidget uses AES-256-GCM encryption to protect sensitive data at rest, including:
- **Form submissions** - Contains PII (names, emails, phones, custom fields)
- **OAuth tokens** - Google Calendar access and refresh tokens
- **Other sensitive data** - Any data requiring encryption

## Quick Setup

### 1. Generate Encryption Key

Run this command to generate a secure 32-byte (256-bit) encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
06ec76f4252a0386d6cb587032eeaf6f8f3f7ae69b5c09b7995bbb5991b5ca26
```

### 2. Add to Environment Variables

**Local Development** (`.env.local`):
```bash
ENCRYPTION_KEY="your_generated_64_character_hex_key_here"
```

**Production** (Vercel/hosting platform):
1. Go to your hosting platform's environment variables settings
2. Add `ENCRYPTION_KEY` with your generated key
3. Redeploy to apply changes

### 3. Verify Setup

Check that encryption is configured:

```bash
npm run test lib/__tests__/encryption.test.ts
```

All tests should pass ✅

## Security Best Practices

### ⚠️ CRITICAL: Back Up Your Key

**If you lose your encryption key, encrypted data CANNOT be recovered!**

**Backup locations:**
- Password manager (1Password, LastPass, Bitwarden)
- Secure vault (HashiCorp Vault, AWS Secrets Manager)
- Encrypted backup file (offline storage)

**DO NOT:**
- ❌ Commit to git repository
- ❌ Share via email or Slack
- ❌ Store in plaintext files
- ❌ Include in screenshots

### Key Rotation

To rotate your encryption key:

1. **Generate new key**
2. **Decrypt all existing data** with old key
3. **Re-encrypt with new key**
4. **Update environment variable**
5. **Redeploy**

**Note:** Key rotation requires downtime and a migration script. Plan accordingly.

### Key Management in Teams

**Single Developer:**
- Store in password manager
- Add to `.env.local` on each machine

**Team Environment:**
- Use secrets management platform (Doppler, Infisical)
- Each environment has its own key (dev, staging, prod)
- Restrict access to production keys

**Production:**
- Use environment variables in hosting platform
- Enable secrets encryption (if available)
- Audit access logs regularly

## Encryption Details

### Algorithm
- **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode)
- Industry standard for data at rest
- NIST approved for sensitive data
- Used by: AWS, Google Cloud, Azure

### Technical Specs
- **Key size:** 256 bits (32 bytes = 64 hex characters)
- **IV size:** 128 bits (16 bytes, randomly generated per encryption)
- **Auth tag:** 128 bits (16 bytes, for integrity verification)
- **Version:** 1 (for future key rotation support)

### Database Storage

Each encrypted field requires 3 columns:

```sql
-- Example: FormSubmission table
data      TEXT  -- Encrypted data (hex string)
dataIv    TEXT  -- Initialization vector (hex string)
dataAuth  TEXT  -- Authentication tag (hex string)
```

## Troubleshooting

### Error: "ENCRYPTION_KEY environment variable is not set"

**Cause:** Environment variable not configured

**Fix:**
1. Generate key (see step 1 above)
2. Add to `.env.local`
3. Restart development server

### Error: "ENCRYPTION_KEY must be 64 hex characters"

**Cause:** Key is wrong length or format

**Fix:**
- Verify key is exactly 64 characters
- Contains only hex characters (0-9, a-f)
- No spaces or special characters
- Regenerate if needed

### Error: "Failed to decrypt data - data may be corrupted or tampered with"

**Possible causes:**
1. **Wrong encryption key** - Using different key than was used to encrypt
2. **Tampered data** - Data modified in database
3. **Corrupted data** - Database corruption or migration error

**Fix:**
1. Verify `ENCRYPTION_KEY` matches the key used for encryption
2. Check database integrity
3. Restore from backup if data is corrupted

### Tests Failing

**Run tests with verbose output:**
```bash
npm run test -- lib/__tests__/encryption.test.ts --verbose
```

**Common issues:**
- Missing `ENCRYPTION_KEY` in test environment
- Key length mismatch
- Node.js crypto module not available

## Migration Guide

### Adding Encryption to Existing Data

If you have existing unencrypted data:

1. **Backup database** - Critical!
2. **Create migration script:**

```typescript
// scripts/encrypt-existing-data.ts
import { prisma } from '../lib/prisma';
import { encryptJSON } from '../lib/encryption';

async function encryptExistingSubmissions() {
  const submissions = await prisma.formSubmission.findMany({
    where: {
      // Find unencrypted submissions (dataIv is null)
      dataIv: null,
    },
  });

  console.log(`Found ${submissions.length} unencrypted submissions`);

  for (const submission of submissions) {
    // Encrypt the data
    const { encrypted, iv, authTag } = encryptJSON(submission.data);

    // Update with encrypted version
    await prisma.formSubmission.update({
      where: { id: submission.id },
      data: {
        data: encrypted,
        dataIv: iv,
        dataAuth: authTag,
      },
    });

    console.log(`Encrypted submission ${submission.id}`);
  }

  console.log('Migration complete!');
}

encryptExistingSubmissions();
```

3. **Run migration:**
```bash
npx tsx scripts/encrypt-existing-data.ts
```

4. **Verify** - Check database to ensure all data is encrypted

## Compliance

Encryption at rest helps meet compliance requirements for:

- **GDPR** (EU General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **HIPAA** (if storing health information)
- **PCI DSS** (if storing payment data)
- **SOC 2** (security compliance certification)

## Support

If you have questions or issues:

1. Check this documentation
2. Review test cases in `lib/__tests__/encryption.test.ts`
3. Check security audit: `SECURITY_AUDIT.md`
4. Create issue in GitHub repository

---

**Last Updated:** 2026-01-05
**Version:** 1.0
