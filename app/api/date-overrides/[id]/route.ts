import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// DELETE - Delete date override
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    // Check if date override belongs to user
    const existing = await prisma.dateOverride.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: 'Date override not found' },
        { status: 404 }
      );
    }

    await prisma.dateOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error deleting date override', error);
    return NextResponse.json(
      { error: 'Failed to delete date override' },
      { status: 500 }
    );
  }
}
