import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokensFromCode, getCalendarClient } from '@/lib/google/oauth';

// GET - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=access_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=missing_params`
      );
    }

    const userId = state;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=user_not_found`
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=no_tokens`
      );
    }

    // Get user's email from Google
    const calendar = getCalendarClient(
      tokens.access_token,
      tokens.refresh_token
    );
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((cal) => cal.primary);

    if (!primaryCalendar?.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=no_calendar`
      );
    }

    // Check if connection already exists
    const existingConnection = await prisma.calendarConnection.findFirst({
      where: {
        userId: user.id,
        provider: 'google',
        email: primaryCalendar.id,
      },
    });

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    if (existingConnection) {
      // Update existing connection
      await prisma.calendarConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    } else {
      // Create new connection
      await prisma.calendarConnection.create({
        data: {
          userId: user.id,
          provider: 'google',
          email: primaryCalendar.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          isPrimary: true,
        },
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar?success=true`
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/calendar?error=callback_failed`
    );
  }
}
