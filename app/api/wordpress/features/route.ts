import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * WordPress Plugin Features Endpoint
 *
 * GET /api/wordpress/features?widgetId=xxx
 *
 * Returns available appointment types and forms for the WordPress plugin
 * block editor dropdowns.
 */
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

    // Find the user by their widgetId field
    const user = await prisma.user.findUnique({
      where: { widgetId: widgetId },
      select: { id: true, widgetId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid Widget ID' },
        { status: 404 }
      );
    }

    // Get appointment types for this user (use user.id, not widgetId)
    const appointmentTypes = await prisma.appointmentType.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        duration: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get forms for this user (if forms table exists)
    // For now, return empty array as forms may not be implemented yet
    let forms: { id: string; name: string }[] = [];

    try {
      // Get forms for this user
      const formsData = await prisma.form.findMany({
        where: {
          userId: user.id,
          active: true,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      forms = formsData || [];
    } catch {
      // Forms table may not exist yet, that's okay
      forms = [];
    }

    return NextResponse.json({
      widgetId: user.widgetId,
      appointmentTypes: appointmentTypes.map((type) => ({
        id: type.id,
        name: type.name,
        duration: type.duration,
        description: type.description,
      })),
      forms: forms.map((form) => ({
        id: form.id,
        name: form.name,
      })),
    });
  } catch (error) {
    console.error('WordPress features error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

// Add CORS headers for WordPress plugin requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
