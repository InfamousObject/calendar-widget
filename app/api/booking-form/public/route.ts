import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get booking form fields for a specific widget (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get('widgetId');

    if (!widgetId) {
      return NextResponse.json(
        { error: 'widgetId is required' },
        { status: 400 }
      );
    }

    // Find user by widgetId
    const user = await prisma.user.findUnique({
      where: { widgetId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Get active booking form fields
    const fields = await prisma.bookingFormField.findMany({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        label: true,
        fieldType: true,
        placeholder: true,
        required: true,
        options: true,
        order: true,
      },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Error fetching booking form fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form fields' },
      { status: 500 }
    );
  }
}
