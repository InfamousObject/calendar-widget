import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { deleteCalendarEvent } from '@/lib/google/calendar';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { log } from '@/lib/logger';

// POST - Cancel an appointment using cancellation token (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // Check rate limit (prevent brute-force token enumeration)
    const clientIp = getClientIp(request);
    const { success, remaining } = await checkRateLimit('cancellation', clientIp);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many cancellation attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
          },
        }
      );
    }

    const { cancellationToken } = await request.json();

    if (!cancellationToken) {
      return NextResponse.json(
        { error: 'Cancellation token is required' },
        { status: 400 }
      );
    }

    // Find appointment
    const appointment = await prisma.appointment.findUnique({
      where: { cancellationToken },
      include: {
        appointmentType: true,
        user: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }

    // Handle refund if payment was made
    let refundInfo: { refundId: string; refundAmount: number } | null = null;

    if (appointment.paymentIntentId && appointment.paymentStatus === 'paid' && appointment.amountPaid) {
      const refundPolicy = appointment.appointmentType.refundPolicy || 'full';

      // Determine refund amount based on policy
      let refundAmount = 0;
      if (refundPolicy === 'full') {
        refundAmount = appointment.amountPaid;
      } else if (refundPolicy === 'partial') {
        // 50% refund for partial policy
        refundAmount = Math.round(appointment.amountPaid * 0.5);
      }
      // 'none' policy = no refund

      if (refundAmount > 0) {
        try {
          log.info('[Cancellation] Processing refund', {
            appointmentId: appointment.id,
            paymentIntentId: appointment.paymentIntentId,
            refundAmount,
            refundPolicy,
          });

          const refund = await stripe.refunds.create({
            payment_intent: appointment.paymentIntentId,
            amount: refundAmount,
            reason: 'requested_by_customer',
            // For destination charges, reverse the transfer to pull funds back from connected account
            reverse_transfer: true,
            metadata: {
              appointmentId: appointment.id,
              refundPolicy,
            },
          });

          refundInfo = {
            refundId: refund.id,
            refundAmount: refund.amount,
          };

          log.info('[Cancellation] Refund processed successfully', {
            appointmentId: appointment.id,
            refundId: refund.id,
            refundAmount: refund.amount,
          });
        } catch (error) {
          log.error('[Cancellation] Error processing refund', {
            appointmentId: appointment.id,
            paymentIntentId: appointment.paymentIntentId,
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't fail the cancellation if refund fails - can be processed manually
        }
      } else {
        log.info('[Cancellation] No refund per policy', {
          appointmentId: appointment.id,
          refundPolicy,
        });
      }
    }

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'cancelled',
        paymentStatus: refundInfo ? 'refunded' : appointment.paymentStatus,
        refundId: refundInfo?.refundId,
        refundAmount: refundInfo?.refundAmount,
      },
    });

    // Delete Google Calendar event
    if (appointment.calendarEventId) {
      try {
        await deleteCalendarEvent(appointment.userId, appointment.calendarEventId);
      } catch (error) {
        log.error('[Cancellation] Error deleting calendar event', {
          userId: appointment.userId,
          eventId: appointment.calendarEventId,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't fail the cancellation if calendar deletion fails
      }
    }

    // Invalidate cache (frees up time slot)
    availabilityCache.invalidateUser(appointment.userId);
    log.info('[Cancellation] Cache invalidated after public cancellation', { userId: appointment.userId });

    // Send cancellation confirmation email
    try {
      const { sendCancellationConfirmation } = await import('@/lib/email');

      await sendCancellationConfirmation({
        visitorEmail: appointment.visitorEmail,
        visitorName: appointment.visitorName,
        appointmentTypeName: appointment.appointmentType.name,
        startTime: appointment.startTime,
        timezone: appointment.timezone,
        ownerName: appointment.user.name || undefined,
        ownerEmail: appointment.user.email,
        businessName: appointment.user.businessName || undefined,
      });
    } catch (error) {
      log.error('[Cancellation] Failed to send confirmation email', error);
      // Don't fail the cancellation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      refund: refundInfo ? {
        refundId: refundInfo.refundId,
        amount: refundInfo.refundAmount,
        currency: appointment.currency,
      } : null,
    });
  } catch (error) {
    log.error('[Cancellation] Error cancelling appointment', {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
