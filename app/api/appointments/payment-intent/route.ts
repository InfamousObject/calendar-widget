import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { log } from '@/lib/logger';
import { z } from 'zod';

const paymentIntentSchema = z.object({
  widgetId: z.string(),
  appointmentTypeId: z.string(),
  visitorEmail: z.string().email(),
  visitorName: z.string().min(1),
});

// Platform fee percentage (set to 0 for no fee)
// This is the percentage Kentroi takes from each appointment payment
const PLATFORM_FEE_PERCENT = 0; // 0% platform fee - users keep 100%

/**
 * POST /api/appointments/payment-intent
 * Create a Stripe Payment Intent for an appointment booking
 * Uses Stripe Connect to send payments to the business owner's account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIp = getClientIp(request);

    // Rate limit check
    const { success } = await checkRateLimit('booking', clientIp);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const validatedData = paymentIntentSchema.parse(body);

    // Find user by widget ID, including Stripe Connect info
    const user = await prisma.user.findUnique({
      where: { widgetId: validatedData.widgetId },
      select: {
        id: true,
        email: true,
        businessName: true,
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
        stripeConnectPayoutsEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Find appointment type and check if payment is required
    const appointmentType = await prisma.appointmentType.findFirst({
      where: {
        id: validatedData.appointmentTypeId,
        userId: user.id,
        active: true,
      },
    });

    if (!appointmentType) {
      return NextResponse.json(
        { error: 'Appointment type not found or inactive' },
        { status: 404 }
      );
    }

    // Check if payment is required
    if (!appointmentType.requirePayment || !appointmentType.price) {
      return NextResponse.json(
        { error: 'This appointment type does not require payment' },
        { status: 400 }
      );
    }

    // Verify the business owner has a connected Stripe account
    if (!user.stripeConnectAccountId || !user.stripeConnectOnboarded) {
      log.warn('[PaymentIntent] Business owner has not set up payments', {
        userId: user.id,
        hasConnectAccount: !!user.stripeConnectAccountId,
        onboarded: user.stripeConnectOnboarded,
      });
      return NextResponse.json(
        {
          error: 'This business has not set up payment processing yet. Please contact them directly.',
          code: 'PAYMENTS_NOT_CONFIGURED',
        },
        { status: 400 }
      );
    }

    // Calculate the amount to charge
    let amountToCharge = appointmentType.price;

    // If deposit is configured, only charge the deposit percentage
    if (appointmentType.depositPercent) {
      amountToCharge = Math.round(appointmentType.price * (appointmentType.depositPercent / 100));
    }

    // Ensure minimum charge (Stripe requires at least 50 cents for most currencies)
    if (amountToCharge < 50) {
      amountToCharge = 50;
    }

    // Calculate platform fee (if any)
    const applicationFee = PLATFORM_FEE_PERCENT > 0
      ? Math.round(amountToCharge * (PLATFORM_FEE_PERCENT / 100))
      : undefined;

    log.info('[PaymentIntent] Creating payment intent with Connect', {
      appointmentTypeId: appointmentType.id,
      amount: amountToCharge,
      currency: appointmentType.currency,
      isDeposit: !!appointmentType.depositPercent,
      connectedAccountId: user.stripeConnectAccountId,
      applicationFee,
    });

    // Create Payment Intent with destination charge
    // The payment goes to the connected account, with optional platform fee
    const paymentIntentParams: any = {
      amount: amountToCharge,
      currency: appointmentType.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      // Transfer funds to the connected account
      transfer_data: {
        destination: user.stripeConnectAccountId,
      },
      metadata: {
        widgetId: validatedData.widgetId,
        appointmentTypeId: appointmentType.id,
        appointmentTypeName: appointmentType.name,
        userId: user.id,
        connectedAccountId: user.stripeConnectAccountId,
        visitorEmail: validatedData.visitorEmail,
        visitorName: validatedData.visitorName,
        fullPrice: appointmentType.price.toString(),
        isDeposit: appointmentType.depositPercent ? 'true' : 'false',
        depositPercent: appointmentType.depositPercent?.toString() || '',
        refundPolicy: appointmentType.refundPolicy,
        type: 'appointment_booking',
      },
      description: `${appointmentType.name} booking with ${user.businessName || 'Business'}`,
      receipt_email: validatedData.visitorEmail,
    };

    // Add application fee if configured
    if (applicationFee && applicationFee > 0) {
      paymentIntentParams.application_fee_amount = applicationFee;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    log.info('[PaymentIntent] Payment intent created', {
      paymentIntentId: paymentIntent.id,
      amount: amountToCharge,
      connectedAccount: user.stripeConnectAccountId,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountToCharge,
      currency: appointmentType.currency,
      isDeposit: !!appointmentType.depositPercent,
      depositPercent: appointmentType.depositPercent,
      fullPrice: appointmentType.price,
      businessName: user.businessName,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    log.error('[PaymentIntent] Error creating payment intent', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
