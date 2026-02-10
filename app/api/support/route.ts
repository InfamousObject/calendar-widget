import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { analyzeSupportTicket } from '@/lib/support-ai';
import { sendSupportTicketNotification } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

// GET - List user's support tickets
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    log.error('Error fetching support tickets', { error });
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit by user ID (hits Anthropic API)
    const { success: rateLimitOk } = await checkRateLimit('support', userId);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many support requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      subject,
      description,
      category = 'general',
      priority = 'normal',
      currentPage,
      browserInfo,
      screenshotUrl,
    } = body;

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create the ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        email: user.email,
        subject,
        description,
        category,
        priority,
        currentPage,
        browserInfo,
        subscriptionTier: user.subscriptionTier,
        screenshotUrl,
      },
    });

    log.info('[Support] Ticket created', {
      ticketId: ticket.id,
      userId,
      category,
    });

    // Analyze ticket with AI (async, don't block response)
    analyzeSupportTicket(ticket.id, {
      subject,
      description,
      category,
      currentPage,
      browserInfo,
      subscriptionTier: user.subscriptionTier,
    })
      .then(async (analysis) => {
        if (analysis) {
          await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: {
              aiDiagnosis: analysis.diagnosis,
              aiSuggestedFix: analysis.suggestedFix,
            },
          });

          log.info('[Support] AI analysis completed', { ticketId: ticket.id });

          // Send notification to admin with AI analysis
          await sendSupportTicketNotification({
            ticketId: ticket.id,
            userEmail: user.email,
            userName: user.name || 'User',
            subject,
            description,
            category,
            priority,
            currentPage,
            browserInfo,
            subscriptionTier: user.subscriptionTier,
            aiDiagnosis: analysis.diagnosis,
            aiSuggestedFix: analysis.suggestedFix,
          });
        }
      })
      .catch((err) => {
        log.error('[Support] AI analysis failed', { ticketId: ticket.id, error: err });

        // Still send notification without AI analysis
        sendSupportTicketNotification({
          ticketId: ticket.id,
          userEmail: user.email,
          userName: user.name || 'User',
          subject,
          description,
          category,
          priority,
          currentPage,
          browserInfo,
          subscriptionTier: user.subscriptionTier,
        });
      });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    log.error('Error creating support ticket', { error });
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
