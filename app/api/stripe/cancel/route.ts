import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { cancelSubscriptionAtPeriodEnd } from '@/lib/stripe';
import { log } from '@/lib/logger';
import { sendSubscriptionCancellation } from '@/lib/email';

interface CancellationSurveyData {
  reason: string;
  reasonDetails?: string;
  feedback?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse survey data from request body
    let surveyData: CancellationSurveyData | null = null;
    try {
      const body = await request.json();
      if (body && body.reason) {
        surveyData = {
          reason: body.reason,
          reasonDetails: body.reasonDetails,
          feedback: body.feedback,
        };
      }
    } catch {
      // No survey data provided, continue with cancellation
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    // Check if already scheduled for cancellation
    if (user.cancelAtPeriodEnd) {
      return NextResponse.json(
        { error: 'Subscription is already scheduled for cancellation' },
        { status: 400 }
      );
    }

    // Calculate months subscribed
    let monthsSubscribed = 0;
    if (user.subscription?.createdAt) {
      const startDate = new Date(user.subscription.createdAt);
      const now = new Date();
      monthsSubscribed = Math.max(
        1,
        Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
    }

    // Save cancellation survey if provided
    if (surveyData) {
      await prisma.cancellationSurvey.create({
        data: {
          userId: user.id,
          reason: surveyData.reason,
          reasonDetails: surveyData.reasonDetails,
          feedback: surveyData.feedback,
          subscriptionTier: user.subscriptionTier,
          monthsSubscribed,
        },
      });

      log.info('[Cancel] Cancellation survey saved', {
        userId: user.id,
        reason: surveyData.reason,
      });
    }

    // Cancel subscription at period end
    const canceledSubscription = await cancelSubscriptionAtPeriodEnd(user.stripeSubscriptionId);

    log.info('[Cancel] Subscription canceled at period end', { subscriptionId: canceledSubscription.id });

    // Update user's cancellation status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    // Update subscription record
    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    log.info('[Cancel] Database updated successfully');

    // Send cancellation confirmation email (fire-and-forget)
    const tierNames: Record<string, string> = {
      booking: 'Booking', chatbot: 'Chatbot', bundle: 'Bundle',
    };
    const accessEndDate = new Date(
      canceledSubscription.cancel_at! * 1000
    ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    sendSubscriptionCancellation({
      userEmail: user.email,
      userName: user.name || 'there',
      tierName: tierNames[user.subscriptionTier] || user.subscriptionTier,
      accessEndDate,
    }).catch((error) => {
      log.error('[Cancel] Failed to send cancellation confirmation email', { error });
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: canceledSubscription.cancel_at,
    });
  } catch (error) {
    log.error('Error canceling subscription', { error });
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
