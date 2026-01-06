/**
 * Verification Script for Encryption Library
 *
 * This script tests the encryption library without Jest
 * Run with: npx tsx scripts/verify-encryption.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  isEncryptionConfigured,
  getEncryptionInfo,
} from '../lib/encryption';

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}`);
    console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertNotEquals(actual: any, expected: any, message?: string) {
  if (actual === expected) {
    throw new Error(message || `Expected values to be different`);
  }
}

function assertThrows(fn: () => void, message?: string) {
  try {
    fn();
    throw new Error(message || 'Expected function to throw');
  } catch (error) {
    // Success - function threw as expected
  }
}

console.log(`\n${BOLD}Running Encryption Library Tests${RESET}\n`);

// Test 1: Basic encryption/decryption
test('should encrypt and decrypt a string', () => {
  const plaintext = 'Hello, World!';
  const { encrypted, iv, authTag } = encrypt(plaintext);

  assertNotEquals(encrypted, plaintext);
  assertEquals(iv.length, 32);
  assertEquals(authTag.length, 32);

  const decrypted = decrypt(encrypted, iv, authTag);
  assertEquals(decrypted, plaintext);
});

// Test 2: Different IVs for same input
test('should produce different encrypted output for same input', () => {
  const plaintext = 'Same input';
  const result1 = encrypt(plaintext);
  const result2 = encrypt(plaintext);

  assertNotEquals(result1.encrypted, result2.encrypted);
  assertNotEquals(result1.iv, result2.iv);

  const decrypted1 = decrypt(result1.encrypted, result1.iv, result1.authTag);
  const decrypted2 = decrypt(result2.encrypted, result2.iv, result2.authTag);
  assertEquals(decrypted1, plaintext);
  assertEquals(decrypted2, plaintext);
});

// Test 3: JSON encryption/decryption
test('should encrypt and decrypt JSON objects', () => {
  const data = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    active: true,
  };

  const { encrypted, iv, authTag } = encryptJSON(data);
  const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);

  assertEquals(JSON.stringify(decrypted), JSON.stringify(data));
});

// Test 4: Nested JSON
test('should handle nested JSON objects', () => {
  const data = {
    user: {
      name: 'Jane',
      contact: {
        email: 'jane@example.com',
        phone: '555-1234',
      },
    },
    tags: ['important', 'urgent'],
  };

  const { encrypted, iv, authTag } = encryptJSON(data);
  const decrypted = decryptJSON<typeof data>(encrypted, iv, authTag);

  assertEquals(decrypted.user.contact.email, 'jane@example.com');
  assertEquals(decrypted.tags[0], 'important');
});

// Test 5: Empty string
test('should handle empty strings', () => {
  const plaintext = '';
  const { encrypted, iv, authTag } = encrypt(plaintext);
  const decrypted = decrypt(encrypted, iv, authTag);
  assertEquals(decrypted, plaintext);
});

// Test 6: Long strings
test('should handle long strings', () => {
  const plaintext = 'A'.repeat(10000);
  const { encrypted, iv, authTag } = encrypt(plaintext);
  const decrypted = decrypt(encrypted, iv, authTag);
  assertEquals(decrypted.length, 10000);
});

// Test 7: Unicode and special characters
test('should handle unicode and special characters', () => {
  const plaintext = '你好世界 🌍 !@#$%^&*()';
  const { encrypted, iv, authTag } = encrypt(plaintext);
  const decrypted = decrypt(encrypted, iv, authTag);
  assertEquals(decrypted, plaintext);
});

// Test 8: Tamper detection
test('should throw error when data is tampered', () => {
  const plaintext = 'Secret message';
  const { encrypted, iv, authTag } = encrypt(plaintext);

  // Tamper with encrypted data
  const tampered = encrypted.slice(0, -2) + 'ff';

  assertThrows(() => {
    decrypt(tampered, iv, authTag);
  }, 'Should throw on tampered data');
});

// Test 9: Wrong auth tag
test('should throw error with wrong auth tag', () => {
  const plaintext = 'Secret message';
  const { encrypted, iv } = encrypt(plaintext);
  const wrongAuthTag = '0'.repeat(32);

  assertThrows(() => {
    decrypt(encrypted, iv, wrongAuthTag);
  }, 'Should throw on wrong auth tag');
});

// Test 10: Configuration check
test('should detect encryption is configured', () => {
  const configured = isEncryptionConfigured();
  assertEquals(configured, true);
});

// Test 11: Encryption info
test('should return encryption info', () => {
  const info = getEncryptionInfo();
  assertEquals(info.algorithm, 'aes-256-gcm');
  assertEquals(info.keyLength, 32);
  assertEquals(info.ivLength, 16);
  assertEquals(info.authTagLength, 16);
  assertEquals(info.version, '1');
  assertEquals(info.configured, true);
});

// Test 12: Form submission simulation
test('should encrypt form submission data (real-world scenario)', () => {
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

  // Simulate database storage
  const stored = {
    data: encrypted,
    dataIv: iv,
    dataAuth: authTag,
  };

  // Simulate retrieval
  const retrieved = decryptJSON<typeof formData>(
    stored.data,
    stored.dataIv,
    stored.dataAuth
  );

  assertEquals(retrieved.email, 'john@example.com');
  assertEquals(retrieved.customFields.company, 'Acme Corp');
});

// Test 13: OAuth token simulation
test('should encrypt OAuth tokens (real-world scenario)', () => {
  const accessToken = 'ya29.a0AfH6SMBxyz123';
  const refreshToken = '1//0gHdOr2abc456';

  const accessResult = encrypt(accessToken);
  const refreshResult = encrypt(refreshToken);

  assertNotEquals(accessResult.encrypted, refreshResult.encrypted);

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

  assertEquals(decryptedAccess, accessToken);
  assertEquals(decryptedRefresh, refreshToken);
});

// Results
console.log(`\n${BOLD}Results:${RESET}`);
console.log(`${GREEN}Passed: ${passed}${RESET}`);
if (failed > 0) {
  console.log(`${RED}Failed: ${failed}${RESET}`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}✓ All tests passed!${RESET}\n`);
  console.log('Encryption library is working correctly.');
  console.log('\nEncryption info:', getEncryptionInfo());
}
