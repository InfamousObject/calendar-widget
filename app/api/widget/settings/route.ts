import { NextRequest, NextResponse } from 'next/server';
import { requireTeamContext, getTeamContext } from '@/lib/team-context';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { log } from '@/lib/logger';

const widgetSettingsSchema = z.object({
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderRadius: z.enum(['sharp', 'medium', 'rounded']).optional(),
  fontFamily: z.string().optional(),
  position: z.string().optional(),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
  showOnMobile: z.boolean().optional(),
  delaySeconds: z.number().optional(),
  logoUrl: z.string().optional(),
  businessName: z.string().optional(),
  welcomeMessage: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  requirePhone: z.boolean().optional(),
  showNotes: z.boolean().optional(),
  daysToDisplay: z.number().min(7).max(90).optional(),
});

// GET - Get widget settings for the team account
export async function GET() {
  try {
    const context = await getTeamContext();

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(context.role, 'widget:view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: context.accountId },
      include: { widgetConfig: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no widget config exists, create a default one
    if (!user.widgetConfig) {
      const widgetConfig = await prisma.widgetConfig.create({
        data: {
          userId: user.id,
        },
      });
      return NextResponse.json({
        settings: widgetConfig,
        widgetId: user.widgetId
      });
    }

    return NextResponse.json({
      settings: user.widgetConfig,
      widgetId: user.widgetId
    });
  } catch (error) {
    log.error('Error fetching widget settings', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget settings' },
      { status: 500 }
    );
  }
}

// PATCH - Update widget settings
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireTeamContext();

    // Check permission
    if (!hasPermission(context.role, 'widget:edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: context.accountId },
      include: { widgetConfig: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = widgetSettingsSchema.parse(body);

    // Update or create widget config
    const widgetConfig = await prisma.widgetConfig.upsert({
      where: { userId: user.id },
      update: validatedData,
      create: {
        ...validatedData,
        userId: user.id,
      },
    });

    return NextResponse.json({ settings: widgetConfig });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    log.error('Error updating widget settings', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update widget settings' },
      { status: 500 }
    );
  }
}
