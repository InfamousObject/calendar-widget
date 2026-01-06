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

  // Check if already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId }
  });

  if (existing?.processed) {
    log.info('[Clerk Webhook] Event already processed', { eventId });
    return NextResponse.json({ success: true });
  }

  // Create idempotency record
  await prisma.webhookEvent.create({
    data: {
      provider: 'clerk',
      eventId,
      eventType,
      processed: false
    }
  });

  try {
    // Process webhook in transaction
    await prisma.$transaction(async (tx) => {
      if (eventType === 'user.created') {
        const { id, email_addresses, first_name, last_name } = evt.data;

        const email = email_addresses[0]?.email_address;

        if (!email) {
          throw new Error('No email found');
        }

        // Create user in database with Clerk ID
        const user = await tx.user.create({
          data: {
            id, // Use Clerk user ID as our user ID
            email,
            name: `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0],
            emailVerified: new Date(), // Clerk handles email verification
            widgetConfig: {
              create: {
                // Default widget configuration
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
      }

      if (eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name } = evt.data;

        const email = email_addresses[0]?.email_address;

        await tx.user.update({
          where: { id },
          data: {
            email: email || undefined,
            name: `${first_name || ''} ${last_name || ''}`.trim() || undefined,
          },
        });

        log.info('[Clerk Webhook] User updated', { userId: id });
      }

      if (eventType === 'user.deleted') {
        const { id } = evt.data;

        await tx.user.delete({
          where: { id },
        });

        log.info('[Clerk Webhook] User deleted', { userId: id });
      }

      // Mark as processed within transaction
      await tx.webhookEvent.update({
        where: { eventId },
        data: { processed: true }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('[Clerk Webhook] Error processing webhook', error);
    // Don't mark as processed if error occurred
    return new Response('Error: Webhook processing failed', { status: 500 });
  }
}
