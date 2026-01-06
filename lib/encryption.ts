/**
 * Data Encryption Library
 *
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * Used for:
 * - Form submission data (PII)
 * - OAuth tokens (Google Calendar access/refresh tokens)
 * - Any other sensitive data requiring encryption
 *
 * Security:
 * - Algorithm: AES-256-GCM (authenticated encryption)
 * - Key size: 256 bits (32 bytes)
 * - IV size: 128 bits (16 bytes, randomly generated per encryption)
 * - Auth tag: 128 bits (16 bytes, for integrity verification)
 *
 * @see https://nodejs.org/api/crypto.html
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { log } from '@/lib/logger';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
const ENCRYPTION_VERSION = '1'; // For future key rotation

/**
 * Get encryption key from environment
 * Throws error if not set or invalid
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  if (key.length !== 64) {
    // 32 bytes = 64 hex characters
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Current length: ${key.length}`
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Object containing encrypted data, IV, and auth tag (all hex strings)
 *
 * @example
 * const { encrypted, iv, authTag } = encrypt('sensitive data');
 * // Store encrypted, iv, and authTag in separate database columns
 */
export function encrypt(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  try {
    // Generate random IV (initialization vector)
    // CRITICAL: IV must be unique for each encryption operation
    const iv = randomBytes(IV_LENGTH);

    // Get encryption key from environment
    const key = getEncryptionKey();

    // Create cipher with algorithm, key, and IV
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (for GCM mode integrity verification)
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    // Don't log the plaintext in production
    log.error('[Encryption] Error encrypting data', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encrypted - The encrypted data (hex string)
 * @param iv - The initialization vector (hex string)
 * @param authTag - The authentication tag (hex string)
 * @returns Decrypted plaintext string
 *
 * @throws Error if decryption fails (wrong key, tampered data, or corrupted)
 *
 * @example
 * const plaintext = decrypt(encrypted, iv, authTag);
 */
export function decrypt(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  try {
    // Get encryption key from environment
    const key = getEncryptionKey();

    // Create decipher with algorithm, key, and IV
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );

    // Set authentication tag for integrity verification
    // GCM mode will throw if data has been tampered with
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Common decryption errors:
    // - Unsupported state or unable to authenticate data = tampered/corrupted
    // - Invalid key length = wrong encryption key
    log.error('[Encryption] Error decrypting data', error);

    if (error instanceof Error && error.message.includes('auth')) {
      throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
    }

    throw new Error('Failed to decrypt data - invalid encryption key or corrupted data');
  }
}

/**
 * Encrypt a JSON object
 *
 * @param data - Any JSON-serializable object
 * @returns Object containing encrypted data, IV, and auth tag
 *
 * @example
 * const { encrypted, iv, authTag } = encryptJSON({ name: 'John', email: 'john@example.com' });
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
 *
 * @param encrypted - The encrypted data (hex string)
 * @param iv - The initialization vector (hex string)
 * @param authTag - The authentication tag (hex string)
 * @returns Decrypted and parsed JSON object
 *
 * @throws Error if decryption fails or JSON is invalid
 *
 * @example
 * const data = decryptJSON<{ name: string; email: string }>(encrypted, iv, authTag);
 */
export function decryptJSON<T>(
  encrypted: string,
  iv: string,
  authTag: string
): T {
  const jsonString = decrypt(encrypted, iv, authTag);

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    log.error('[Encryption] Error parsing decrypted JSON', error);
    throw new Error('Failed to parse decrypted data as JSON');
  }
}

/**
 * Check if encryption is properly configured
 *
 * @returns true if encryption key is set and valid, false otherwise
 *
 * @example
 * if (!isEncryptionConfigured()) {
 *   console.warn('Encryption not configured - sensitive data will not be protected');
 * }
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get encryption metadata for debugging/monitoring
 * WARNING: Does not return the actual key
 *
 * @returns Object with encryption configuration info
 */
export function getEncryptionInfo() {
  return {
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH,
    ivLength: IV_LENGTH,
    authTagLength: AUTH_TAG_LENGTH,
    version: ENCRYPTION_VERSION,
    configured: isEncryptionConfigured(),
  };
}
