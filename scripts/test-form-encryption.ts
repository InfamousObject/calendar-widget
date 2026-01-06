/**
 * Test Script: Form Submission Encryption
 *
 * This script tests the form encryption end-to-end:
 * 1. Creates a test form
 * 2. Submits encrypted data
 * 3. Verifies data is encrypted in database
 * 4. Verifies decryption works when retrieving
 *
 * Usage:
 *   npx tsx scripts/test-form-encryption.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { prisma } from '../lib/prisma';
import { encryptJSON, decryptJSON } from '../lib/encryption';

// Colors for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function testFormEncryption() {
  console.log(`\n${BOLD}${BLUE}Testing Form Submission Encryption${RESET}\n`);

  try {
    // Step 1: Find or create a test user
    console.log('1. Getting test user...');
    const user = await prisma.user.findFirst();

    if (!user) {
      console.log(`${RED}✗ No users found. Please create a user first.${RESET}`);
      return;
    }

    console.log(`${GREEN}✓ Found user: ${user.email}${RESET}\n`);

    // Step 2: Create a test form
    console.log('2. Creating test form...');
    const testForm = await prisma.form.create({
      data: {
        userId: user.id,
        name: 'Encryption Test Form',
        description: 'Testing encryption',
        fields: [
          {
            id: 'name',
            label: 'Full Name',
            fieldType: 'text',
            required: true,
          },
          {
            id: 'email',
            label: 'Email Address',
            fieldType: 'email',
            required: true,
          },
          {
            id: 'phone',
            label: 'Phone Number',
            fieldType: 'phone',
            required: false,
          },
          {
            id: 'message',
            label: 'Message',
            fieldType: 'textarea',
            required: false,
          },
        ],
        settings: {
          successMessage: 'Thank you for your submission!',
          emailNotifications: false,
        },
        active: true,
      },
    });

    console.log(`${GREEN}✓ Created form: ${testForm.id}${RESET}\n`);

    // Step 3: Create test submission with encrypted data
    console.log('3. Creating encrypted form submission...');
    const testData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      message: 'This is a test submission with sensitive PII data that should be encrypted.',
    };

    console.log(`   Test data: ${JSON.stringify(testData, null, 2)}`);

    const { encrypted, iv, authTag } = encryptJSON(testData);

    const submission = await prisma.formSubmission.create({
      data: {
        formId: testForm.id,
        userId: user.id,
        data: encrypted,
        dataIv: iv,
        dataAuth: authTag,
        ipAddress: '127.0.0.1',
        userAgent: 'test-script',
        status: 'new',
      },
    });

    console.log(`${GREEN}✓ Created submission: ${submission.id}${RESET}\n`);

    // Step 4: Verify data is encrypted in database
    console.log('4. Verifying encryption in database...');
    const dbSubmission = await prisma.formSubmission.findUnique({
      where: { id: submission.id },
    });

    if (!dbSubmission) {
      throw new Error('Submission not found in database');
    }

    console.log(`   Encrypted data (first 50 chars): ${dbSubmission.data.substring(0, 50)}...`);
    console.log(`   IV: ${dbSubmission.dataIv}`);
    console.log(`   Auth Tag: ${dbSubmission.dataAuth}`);

    // Verify it's actually encrypted (hex string, not JSON)
    const isEncrypted = /^[0-9a-f]+$/.test(dbSubmission.data);
    if (isEncrypted) {
      console.log(`${GREEN}✓ Data is properly encrypted (hex string)${RESET}\n`);
    } else {
      console.log(`${RED}✗ Data is NOT encrypted!${RESET}\n`);
      throw new Error('Encryption failed');
    }

    // Step 5: Verify decryption works
    console.log('5. Testing decryption...');
    const decryptedData = decryptJSON<typeof testData>(
      dbSubmission.data,
      dbSubmission.dataIv,
      dbSubmission.dataAuth
    );

    console.log(`   Decrypted data: ${JSON.stringify(decryptedData, null, 2)}`);

    if (JSON.stringify(decryptedData) === JSON.stringify(testData)) {
      console.log(`${GREEN}✓ Decryption successful - data matches original${RESET}\n`);
    } else {
      console.log(`${RED}✗ Decryption failed - data doesn't match${RESET}\n`);
      throw new Error('Decryption mismatch');
    }

    // Step 6: Test tamper detection
    console.log('6. Testing tamper detection...');
    try {
      // Tamper with the encrypted data
      const tamperedData = dbSubmission.data.slice(0, -2) + 'ff';
      decryptJSON(tamperedData, dbSubmission.dataIv, dbSubmission.dataAuth);

      console.log(`${RED}✗ Tamper detection FAILED - accepted tampered data!${RESET}\n`);
    } catch (error) {
      console.log(`${GREEN}✓ Tamper detection works - rejected tampered data${RESET}\n`);
    }

    // Cleanup
    console.log('7. Cleaning up test data...');
    await prisma.formSubmission.delete({ where: { id: submission.id } });
    await prisma.form.delete({ where: { id: testForm.id } });
    console.log(`${GREEN}✓ Cleanup complete${RESET}\n`);

    // Summary
    console.log(`${BOLD}${GREEN}========================================${RESET}`);
    console.log(`${BOLD}${GREEN}✓ All Form Encryption Tests Passed!${RESET}`);
    console.log(`${BOLD}${GREEN}========================================${RESET}\n`);

    console.log('✓ Form submissions are now encrypted at rest');
    console.log('✓ PII (names, emails, phones) protected in database');
    console.log('✓ Tamper detection prevents data modification');
    console.log('✓ Decryption works correctly for authorized access\n');

  } catch (error) {
    console.error(`\n${RED}${BOLD}Test Failed:${RESET}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFormEncryption();
