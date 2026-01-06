import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { log } from '@/lib/logger';

// GET - List all calendar connections for the user
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const connections = await prisma.calendarConnection.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        email: true,
        emailIv: true,
        emailAuth: true,
        isPrimary: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Decrypt email addresses before returning
    const decryptedConnections = connections.map((conn) => {
      try {
        const decryptedEmail = decrypt(conn.email, conn.emailIv, conn.emailAuth);
        return {
          id: conn.id,
          provider: conn.provider,
          email: decryptedEmail, // Decrypted email
          isPrimary: conn.isPrimary,
          createdAt: conn.createdAt,
          expiresAt: conn.expiresAt,
        };
      } catch (error) {
        log.error('[Calendar] Failed to decrypt email for connection', { error, connectionId: conn.id });
        return {
          id: conn.id,
          provider: conn.provider,
          email: '***@***.***', // Masked if decryption fails
          isPrimary: conn.isPrimary,
          createdAt: conn.createdAt,
          expiresAt: conn.expiresAt,
        };
      }
    });

    return NextResponse.json(decryptedConnections);
  } catch (error) {
    log.error('[Calendar] Error fetching calendar connections', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar connections' },
      { status: 500 }
    );
  }
}
