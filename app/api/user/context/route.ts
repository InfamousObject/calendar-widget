import { NextResponse } from 'next/server';
import { getTeamContext } from '@/lib/team-context';
import { log } from '@/lib/logger';

// GET - Get current user's team context
export async function GET() {
  try {
    const context = await getTeamContext();

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(context);
  } catch (error) {
    log.error('[UserContext] Error fetching team context', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}
