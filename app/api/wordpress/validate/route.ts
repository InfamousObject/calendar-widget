import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * WordPress Plugin Widget Validation Endpoint
 *
 * GET /api/wordpress/validate?widgetId=xxx
 *
 * Validates a widget ID and returns basic information for the WordPress plugin.
 * This endpoint is public and allows WordPress sites to verify their connection.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json(
        { valid: false, error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // Find the user by their widgetId field
    const user = await prisma.user.findUnique({
      where: { widgetId: widgetId },
      select: {
        id: true,
        widgetId: true,
        businessName: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid Widget ID' },
        { status: 404 }
      );
    }

    // Return validation result with business info
    return NextResponse.json({
      valid: true,
      widgetId: user.widgetId,
      businessName: user.businessName || user.name || 'Business',
      features: {
        booking: true,
        forms: true,
        chat: true,
      },
    });
  } catch (error) {
    console.error('WordPress validate error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
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
