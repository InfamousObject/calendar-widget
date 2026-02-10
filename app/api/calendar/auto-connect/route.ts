import { NextResponse } from 'next/server';

/**
 * POST - Auto-connect has been removed.
 * All users must use the manual OAuth connect flow for reliable calendar access.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Auto-connect has been removed. Please use the manual connect flow.' },
    { status: 410 }
  );
}
