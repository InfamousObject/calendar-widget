import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// GET - Get form for embed (public endpoint)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;

    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        name: true,
        description: true,
        fields: true,
        settings: true,
        active: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.active) {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 });
    }

    return NextResponse.json(form);
  } catch (error) {
    log.error('Error fetching form', error);
    return NextResponse.json(
      { error: 'Failed to load form' },
      { status: 500 }
    );
  }
}
