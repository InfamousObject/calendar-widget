import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all calendar connections for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
        isPrimary: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Error fetching calendar connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar connections' },
      { status: 500 }
    );
  }
}
