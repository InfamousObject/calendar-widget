/**
 * Unit Tests for Encryption Library
 *
 * Tests AES-256-GCM encryption/decryption functionality
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  isEncryptionConfigured,
  getEncryptionInfo,
} from '../encryption';

describe('Encryption Library', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    // Set test encryption key (64 hex characters = 32 bytes)
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  afterAll(() => {
    // Restore original environment
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'Hello, World!';
      const { encrypted, iv, authTag } = encrypt(plaintext);

      // Verify encrypted data is different from plaintext
      expect(encrypted).not.toBe(plaintext);

      // Verify IV is correct length (16 bytes = 32 hex chars)
      expect(iv).toHaveLength(32);

      // Verify auth tag is correct length (16 bytes = 32 hex chars)
      expect(authTag).toHaveLength(32);

      // Decrypt and verify
      const decrypted = decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted output for same input (due to random IV)', () => {
      const plaintext = 'Same input';

      const result1 = encrypt(plaintext);
      const result2 = encrypt(plaintext);

      // Encrypted values should be different (different IVs)
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);

      // But both should decrypt to same plaintext
      expect(decrypt(result1.encrypted, result1.iv, result1.authTag)).toBe(plaintext);
      expect(decrypt(result2.encrypted, result2.iv, result2.authTag)).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const { encrypted, iv, authTag } = encrypt(plaintext);

      const decrypted = decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const plaintext = 'A'.repeat(10000); // 10KB string
      const { encrypted, iv, authTag } = encrypt(plaintext);

      const decrypted = decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(plaintext);
      expect(decrypted).toHaveLength(10000);
    });

    it('should handle special characters and unicode', () => {
      const plaintext = '你好世界 🌍 Special chars: !@#$%^&*()';
      const { encrypted, iv, authTag } = encrypt(plaintext);

      const decrypted = decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('JSON Encryption/Decryption', () => {
    it('should encrypt and decrypt JSON objects', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
      };

      const { encrypted, iv, authTag } = encryptJSON(data);

      expect(encrypted).toBeTruthy();
      expect(iv).toHaveLength(32);
      expect(authTag).toHaveLength(32);

      const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);
      expect(decrypted).toEqual(data);
    });

    it('should handle nested JSON objects', () => {
      const data = {
        user: {
          name: 'Jane',
          contact: {
            email: 'jane@example.com',
            phone: '555-1234',
          },
        },
        metadata: {
          createdAt: '2026-01-05T00:00:00Z',
          tags: ['important', 'urgent'],
        },
      };

      const { encrypted, iv, authTag } = encryptJSON(data);
      const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);

      expect(decrypted).toEqual(data);
      expect(decrypted.user.contact.email).toBe('jane@example.com');
      expect(decrypted.metadata.tags).toEqual(['important', 'urgent']);
    });

    it('should handle arrays', () => {
      const data = ['apple', 'banana', 'cherry'];

      const { encrypted, iv, authTag } = encryptJSON(data);
      const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);

      expect(decrypted).toEqual(data);
    });

    it('should handle null and undefined values in objects', () => {
      const data = {
        name: 'Test',
        nullValue: null,
        undefinedValue: undefined,
      };

      const { encrypted, iv, authTag } = encryptJSON(data);
      const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);

      expect(decrypted.name).toBe('Test');
      expect(decrypted.nullValue).toBe(null);
      // Note: undefined is lost in JSON serialization
      expect(decrypted.undefinedValue).toBeUndefined();
    });
  });

  describe('Security - Tamper Detection', () => {
    it('should throw error when encrypted data is tampered', () => {
      const plaintext = 'Secret message';
      const { encrypted, iv, authTag } = encrypt(plaintext);

      // Tamper with encrypted data (flip last character)
      const tamperedEncrypted = encrypted.slice(0, -2) + 'ff';

      expect(() => {
        decrypt(tamperedEncrypted, iv, authTag);
      }).toThrow();
    });

    it('should throw error when IV is tampered', () => {
      const plaintext = 'Secret message';
      const { encrypted, iv, authTag } = encrypt(plaintext);

      // Tamper with IV
      const tamperedIv = iv.slice(0, -2) + 'ff';

      expect(() => {
        decrypt(encrypted, tamperedIv, authTag);
      }).toThrow();
    });

    it('should throw error when auth tag is wrong', () => {
      const plaintext = 'Secret message';
      const { encrypted, iv } = encrypt(plaintext);

      // Use wrong auth tag (all zeros)
      const wrongAuthTag = '0'.repeat(32);

      expect(() => {
        decrypt(encrypted, iv, wrongAuthTag);
      }).toThrow(/tampered/i);
    });

    it('should throw error when using wrong encryption key', () => {
      const plaintext = 'Secret message';
      const { encrypted, iv, authTag } = encrypt(plaintext);

      // Change encryption key
      process.env.ENCRYPTION_KEY = 'b'.repeat(64);

      expect(() => {
        decrypt(encrypted, iv, authTag);
      }).toThrow();

      // Restore key for other tests
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    });
  });

  describe('Configuration', () => {
    it('should detect when encryption is configured', () => {
      expect(isEncryptionConfigured()).toBe(true);
    });

    it('should detect when encryption key is missing', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(isEncryptionConfigured()).toBe(false);

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error when encryption key is missing', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;

      expect(() => {
        encrypt('test');
      }).toThrow(/ENCRYPTION_KEY environment variable is not set/);

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should throw error when encryption key is wrong length', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'too_short';

      expect(() => {
        encrypt('test');
      }).toThrow(/must be 64 hex characters/);

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should return encryption info', () => {
      const info = getEncryptionInfo();

      expect(info.algorithm).toBe('aes-256-gcm');
      expect(info.keyLength).toBe(32);
      expect(info.ivLength).toBe(16);
      expect(info.authTagLength).toBe(16);
      expect(info.version).toBe('1');
      expect(info.configured).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid JSON when decrypting', () => {
      // Encrypt invalid JSON string
      const invalidJSON = 'not valid json {';
      const { encrypted, iv, authTag } = encrypt(invalidJSON);

      expect(() => {
        decryptJSON(encrypted, iv, authTag);
      }).toThrow(/parse/i);
    });

    it('should handle very long hex strings', () => {
      const plaintext = 'x'.repeat(1000);
      const { encrypted, iv, authTag } = encrypt(plaintext);

      // Verify it's still hex (all characters are 0-9a-f)
      expect(/^[0-9a-f]+$/.test(encrypted)).toBe(true);
      expect(/^[0-9a-f]+$/.test(iv)).toBe(true);
      expect(/^[0-9a-f]+$/.test(authTag)).toBe(true);

      const decrypted = decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should encrypt form submission data', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        message: 'I would like to book an appointment',
        customFields: {
          company: 'Acme Corp',
          referralSource: 'Google',
        },
      };

      const { encrypted, iv, authTag } = encryptJSON(formData);

      // Simulate storing in database
      const storedData = {
        data: encrypted,
        dataIv: iv,
        dataAuth: authTag,
      };

      // Simulate retrieving from database
      const retrievedData = decryptJSON<typeof formData>(
        storedData.data,
        storedData.dataIv,
        storedData.dataAuth
      );

      expect(retrievedData).toEqual(formData);
      expect(retrievedData.email).toBe('john@example.com');
    });

    it('should encrypt OAuth tokens', () => {
      const accessToken = 'ya29.a0AfH6SMB...'; // Example Google access token
      const refreshToken = '1//0gHdOr2...'; // Example refresh token

      const accessResult = encrypt(accessToken);
      const refreshResult = encrypt(refreshToken);

      // Verify tokens are encrypted differently
      expect(accessResult.encrypted).not.toBe(refreshResult.encrypted);

      // Verify they decrypt correctly
      const decryptedAccess = decrypt(
        accessResult.encrypted,
        accessResult.iv,
        accessResult.authTag
      );
      const decryptedRefresh = decrypt(
        refreshResult.encrypted,
        refreshResult.iv,
        refreshResult.authTag
      );

      expect(decryptedAccess).toBe(accessToken);
      expect(decryptedRefresh).toBe(refreshToken);
    });
  });
});
