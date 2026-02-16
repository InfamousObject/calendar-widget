import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

// GET - Get public widget information
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await context.params;

    // Find user by widget ID
    const user = await prisma.user.findUnique({
      where: { widgetId },
      select: {
        id: true,
        businessName: true,
        name: true,
        timezone: true,
        widgetConfig: {
          select: {
            daysToDisplay: true,
            primaryColor: true,
            backgroundColor: true,
            textColor: true,
            borderRadius: true,
            fontFamily: true,
            welcomeMessage: true,
            logoUrl: true,
            timeFormat: true,
            requirePhone: true,
            showNotes: true,
            widgetDaysToDisplay: true,
            businessName: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Get active appointment types
    const appointmentTypes = await prisma.appointmentType.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        color: true,
        price: true,
        currency: true,
        requirePayment: true,
        depositPercent: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      businessName: user.widgetConfig?.businessName || user.businessName || user.name || 'Business',
      timezone: user.timezone,
      daysToDisplay: user.widgetConfig?.daysToDisplay || 7,
      appointmentTypes,
      // Appearance settings
      primaryColor: user.widgetConfig?.primaryColor || '#3b82f6',
      backgroundColor: user.widgetConfig?.backgroundColor || '#ffffff',
      textColor: user.widgetConfig?.textColor || '#1f2937',
      borderRadius: user.widgetConfig?.borderRadius || 'medium',
      fontFamily: user.widgetConfig?.fontFamily || 'system',
      // Display settings
      welcomeMessage: user.widgetConfig?.welcomeMessage || 'Book an appointment with us',
      logoUrl: user.widgetConfig?.logoUrl || null,
      timeFormat: user.widgetConfig?.timeFormat || '12h',
      requirePhone: user.widgetConfig?.requirePhone || false,
      showNotes: user.widgetConfig?.showNotes ?? true,
      widgetDaysToDisplay: user.widgetConfig?.widgetDaysToDisplay || 4,
    });
  } catch (error) {
    log.error('Error fetching widget info', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget information' },
      { status: 500 }
    );
  }
}
