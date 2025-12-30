import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get widget configuration (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // Find user by widget ID
    const user = await prisma.user.findUnique({
      where: { widgetId },
      include: {
        widgetConfig: true,
        chatbotConfig: true,
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
        forms: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            fields: true,
            settings: true,
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

    // Build widget config response
    const config = {
      widgetId: user.widgetId,
      businessName: user.widgetConfig?.businessName || user.businessName || 'Book an Appointment',
      welcomeMessage: user.widgetConfig?.welcomeMessage || 'Book an appointment with us',
      logoUrl: user.widgetConfig?.logoUrl,

      // Appearance
      appearance: {
        primaryColor: user.widgetConfig?.primaryColor || '#3b82f6',
        backgroundColor: user.widgetConfig?.backgroundColor || '#ffffff',
        textColor: user.widgetConfig?.textColor || '#1f2937',
        borderRadius: user.widgetConfig?.borderRadius || 'medium',
        fontFamily: user.widgetConfig?.fontFamily || 'system',
      },

      // Position
      position: {
        position: user.widgetConfig?.position || 'bottom-right',
        offsetX: user.widgetConfig?.offsetX || 20,
        offsetY: user.widgetConfig?.offsetY || 20,
      },

      // Behavior
      behavior: {
        showOnMobile: user.widgetConfig?.showOnMobile ?? true,
        delaySeconds: user.widgetConfig?.delaySeconds || 0,
      },

      // Booking settings
      bookingSettings: {
        timeFormat: user.widgetConfig?.timeFormat || '12h',
        requirePhone: user.widgetConfig?.requirePhone || false,
        showNotes: user.widgetConfig?.showNotes ?? true,
      },

      // Chatbot config (only if enabled)
      chatbot: user.chatbotConfig?.enabled ? {
        enabled: true,
        botName: user.chatbotConfig.botName,
        greetingMessage: user.chatbotConfig.greetingMessage,
      } : undefined,

      // Available features
      features: {
        appointmentTypes: user.appointmentTypes,
        forms: user.forms,
      },
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching widget config:', error);
    return NextResponse.json(
      { error: 'Failed to load widget configuration' },
      { status: 500 }
    );
  }
}
