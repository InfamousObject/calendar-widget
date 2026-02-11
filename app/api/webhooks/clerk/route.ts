import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing Svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    log.error('Error verifying webhook', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const eventId = (evt as any).id || `${eventType}-${Date.now()}`;

  log.info('[Clerk Webhook] Received event', { eventType, eventId });

  // Check if already processed (idempotency)
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId }
  });

  if (existing?.processed) {
    log.info('[Clerk Webhook] Event already processed', { eventId });
    return NextResponse.json({ success: true });
  }

  // Create or update idempotency record (upsert handles retries)
  await prisma.webhookEvent.upsert({
    where: { eventId },
    update: {}, // No update needed, just ensure it exists
    create: {
      provider: 'clerk',
      eventId,
      eventType,
      processed: false
    }
  });

  try {
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses[0]?.email_address;

      if (!email) {
        throw new Error('No email found');
      }

      // Check if user already exists (by ID or email)
      const existingById = await prisma.user.findUnique({ where: { id } });
      const existingByEmail = await prisma.user.findUnique({ where: { email } });

      if (existingById) {
        // User already exists with this Clerk ID, just update
        log.info('[Clerk Webhook] User already exists, updating', { userId: id });
        await prisma.user.update({
          where: { id },
          data: {
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0],
          },
        });
      } else if (existingByEmail) {
        // Email exists with different ID - update the ID to match Clerk
        log.info('[Clerk Webhook] Email exists, updating user ID to match Clerk', {
          oldId: existingByEmail.id,
          newId: id,
          email
        });
        // Delete old user and create new one with correct ID
        // Use deleteMany to handle cascade more reliably
        const deleteResult = await prisma.user.deleteMany({ where: { email } });
        log.info('[Clerk Webhook] Deleted old user', { deletedCount: deleteResult.count });
        await prisma.user.create({
          data: {
            id,
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0],
            emailVerified: new Date(),
            widgetConfig: {
              create: {
                primaryColor: '#3b82f6',
                backgroundColor: '#ffffff',
                textColor: '#1f2937',
                borderRadius: 'medium',
                fontFamily: 'system',
                position: 'bottom-right',
                offsetX: 20,
                offsetY: 20,
                showOnMobile: true,
                delaySeconds: 0,
              },
            },
          },
        });
      } else {
        // Create new user
        const user = await prisma.user.create({
          data: {
            id,
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0],
            emailVerified: new Date(),
            widgetConfig: {
              create: {
                primaryColor: '#3b82f6',
                backgroundColor: '#ffffff',
                textColor: '#1f2937',
                borderRadius: 'medium',
                fontFamily: 'system',
                position: 'bottom-right',
                offsetX: 20,
                offsetY: 20,
                showOnMobile: true,
                delaySeconds: 0,
              },
            },
          },
        });
        log.info('[Clerk Webhook] User created', { userId: user.id });
        // TODO: Implement server-side conversion API for GA4 Measurement Protocol
        // trackConversion('sign_up', { method: 'clerk' })
      }
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses[0]?.email_address;

      // Check if user exists before updating
      const existing = await prisma.user.findUnique({ where: { id } });
      if (existing) {
        await prisma.user.update({
          where: { id },
          data: {
            email: email || undefined,
            name: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
          },
        });
        log.info('[Clerk Webhook] User updated', { userId: id });
      } else {
        log.warn('[Clerk Webhook] User not found for update, skipping', { userId: id });
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      // Use deleteMany to avoid error if user doesn't exist
      const result = await prisma.user.deleteMany({
        where: { id },
      });

      if (result.count > 0) {
        log.info('[Clerk Webhook] User deleted', { userId: id });
      } else {
        log.warn('[Clerk Webhook] User not found for deletion, skipping', { userId: id });
      }
    }

    // Mark as processed after successful handling
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processed: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Clerk Webhook] Error processing webhook', error);
    // Don't mark as processed if error occurred
    return new Response('Error: Webhook processing failed', { status: 500 });
  }
}
