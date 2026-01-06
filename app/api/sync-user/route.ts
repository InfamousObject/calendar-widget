import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

/**
 * One-time sync endpoint to create user in database from Clerk
 * This is needed because webhooks don't work with localhost
 */
export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    log.info('[Sync User] Syncing Clerk user', {
      userId: clerkUser.id, // Auto-redacted
      email: clerkUser.emailAddresses[0]?.emailAddress, // Auto-redacted
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: clerkUser.id },
    });

    if (existingUser) {
      log.info('[Sync User] User already exists in database');
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser
      });
    }

    // Create user in database
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const firstName = clerkUser.firstName;
    const lastName = clerkUser.lastName;
    const name = `${firstName || ''} ${lastName || ''}`.trim() || email?.split('@')[0] || 'User';

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        id: clerkUser.id,
        email,
        name,
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

    log.info('[Sync User] User created in database', { userId: user.id }); // Auto-redacted

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        widgetId: user.widgetId,
      },
    });
  } catch (error) {
    log.error('[Sync User] Error syncing user', error);
    return NextResponse.json(
      { error: 'Failed to sync user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
