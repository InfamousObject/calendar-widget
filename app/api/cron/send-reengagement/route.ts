import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReengagementOffer } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import { log } from '@/lib/logger';
import { randomBytes } from 'crypto';

const DISCOUNT_PERCENT = 25;
const DISCOUNT_DURATION_MONTHS = 3;

// Generate a unique discount code
function generateDiscountCode(): string {
  return `COMEBACK-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function GET(request: NextRequest) {
  // Verify request has valid CRON_SECRET (x-vercel-cron header is not used
  // because it can be spoofed by external callers)
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn('[Cron] Unauthorized attempt to trigger reengagement');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log.info('[Cron] Starting reengagement email job');

  try {
    // Find cancellation surveys from 24-48 hours ago that haven't received an email
    const now = new Date();
    const hoursAgo24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hoursAgo48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const surveys = await prisma.cancellationSurvey.findMany({
      where: {
        createdAt: {
          gte: hoursAgo48,
          lt: hoursAgo24,
        },
        reengagementSent: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            subscriptionStatus: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    log.info(`[Cron] Found ${surveys.length} users eligible for reengagement`);

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const survey of surveys) {
      // Skip if user has already resubscribed
      if (survey.user.subscriptionStatus === 'active' && !survey.user.cancelAtPeriodEnd) {
        log.info('[Cron] Skipping - user has resubscribed', {
          userId: survey.userId,
        });
        skippedCount++;
        continue;
      }

      try {
        // Generate discount code
        const discountCode = generateDiscountCode();

        // Create Stripe coupon
        const coupon = await stripe.coupons.create({
          percent_off: DISCOUNT_PERCENT,
          duration: 'repeating',
          duration_in_months: DISCOUNT_DURATION_MONTHS,
          metadata: { surveyId: survey.id, userId: survey.userId },
        });

        // Create promotion code users can enter at checkout
        await stripe.promotionCodes.create({
          promotion: {
            type: 'coupon',
            coupon: coupon.id,
          },
          code: discountCode,
          max_redemptions: 1,
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
          metadata: { surveyId: survey.id, userId: survey.userId },
        });

        // Send reengagement email
        await sendReengagementOffer({
          userEmail: survey.user.email,
          userName: survey.user.name || 'there',
          reason: survey.reason,
          discountCode,
          discountPercent: DISCOUNT_PERCENT,
          discountDurationMonths: DISCOUNT_DURATION_MONTHS,
        });

        // Update survey record
        await prisma.cancellationSurvey.update({
          where: { id: survey.id },
          data: {
            reengagementSent: true,
            discountCode,
          },
        });

        successCount++;

        log.info('[Cron] Reengagement email sent', {
          userId: survey.userId,
          discountCode,
        });
      } catch (error) {
        log.error('[Cron] Failed to send reengagement email', {
          surveyId: survey.id,
          userId: survey.userId,
          error,
        });
        failureCount++;
      }
    }

    log.info('[Cron] Reengagement job completed', {
      total: surveys.length,
      success: successCount,
      failures: failureCount,
      skipped: skippedCount,
    });

    return NextResponse.json({
      success: true,
      total: surveys.length,
      sent: successCount,
      failed: failureCount,
      skipped: skippedCount,
    });
  } catch (error) {
    log.error('[Cron] Reengagement job failed', error);
    return NextResponse.json(
      { error: 'Reengagement job failed' },
      { status: 500 }
    );
  }
}
