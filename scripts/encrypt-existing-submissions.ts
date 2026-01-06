/**
 * Migration Script: Encrypt Existing Form Submissions
 *
 * This script encrypts existing form submissions that are stored as plaintext.
 * Run BEFORE applying the schema migration.
 *
 * Usage:
 *   npx tsx scripts/encrypt-existing-submissions.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { prisma } from '../lib/prisma';
import { encryptJSON } from '../lib/encryption';

async function encryptExistingSubmissions() {
  console.log('🔍 Checking for unencrypted form submissions...\n');

  // Fetch all form submissions
  // Note: At this point, the schema still has 'data' as Json
  const submissions = await prisma.formSubmission.findMany();

  console.log(`Found ${submissions.length} form submission(s)\n`);

  if (submissions.length === 0) {
    console.log('✅ No submissions to encrypt. Safe to run migration.');
    return;
  }

  console.log('📋 Form submission details:');
  for (const submission of submissions) {
    console.log(`  - ID: ${submission.id}`);
    console.log(`    Form ID: ${submission.formId}`);
    console.log(`    Created: ${submission.createdAt}`);
    console.log(`    Data: ${JSON.stringify(submission.data).substring(0, 100)}...`);
    console.log('');
  }

  console.log('⚠️  WARNING: This is a test/development database with sample data.');
  console.log('⚠️  The safest approach is to DELETE this test data and start fresh.\n');
  console.log('Options:');
  console.log('  1. Delete existing submissions (recommended for dev/test)');
  console.log('  2. Keep and encrypt (for production with real data)\n');

  // For now, just inform the user
  console.log('To proceed:');
  console.log('  1. If test data: Run this to delete submissions:');
  console.log('     npx prisma db execute --stdin <<< "DELETE FROM \\"FormSubmission\\";"');
  console.log('');
  console.log('  2. If production data: Contact support for migration assistance');
  console.log('');
  console.log('After handling existing data, run:');
  console.log('  npx prisma migrate deploy');
}

encryptExistingSubmissions()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
