import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get booking config for embed (public endpoint)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await context.params;

    const user = await prisma.user.findUnique({
      where: { widgetId },
      include: {
        appointmentTypes: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            color: true,
          },
        },
        widgetConfig: true,
        bookingFormFields: {
          where: { active: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    const config = {
      widgetId: user.widgetId,
      businessName: user.widgetConfig?.businessName || user.businessName || 'Book an Appointment',
      appointmentTypes: user.appointmentTypes,
      bookingSettings: {
        timeFormat: user.widgetConfig?.timeFormat || '12h',
        requirePhone: user.widgetConfig?.requirePhone || false,
        showNotes: user.widgetConfig?.showNotes ?? true,
      },
      customFields: user.bookingFormFields,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching booking config:', error);
    return NextResponse.json(
      { error: 'Failed to load booking configuration' },
      { status: 500 }
    );
  }
}
