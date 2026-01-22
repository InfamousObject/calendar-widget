'use client';

import { useState, useEffect } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, CreditCard, AlertCircle } from 'lucide-react';

// Initialize Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  widgetId: string;
  appointmentTypeId: string;
  visitorEmail: string;
  visitorName: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

interface PaymentIntentData {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  isDeposit: boolean;
  depositPercent?: number;
  fullPrice: number;
  businessName?: string;
}

// Inner component that uses Stripe hooks
function CheckoutForm({
  paymentData,
  onSuccess,
  onBack,
}: {
  paymentData: PaymentIntentData;
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/payment-complete`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Payment was not completed. Please try again.');
      setProcessing(false);
    }
  };

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment summary */}
      <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground-secondary">
            {paymentData.isDeposit ? `Deposit (${paymentData.depositPercent}%)` : 'Total'}
          </span>
          <span className="text-xl font-bold text-foreground">
            {formatAmount(paymentData.amount, paymentData.currency)}
          </span>
        </div>
        {paymentData.isDeposit && (
          <p className="text-xs text-foreground-tertiary">
            Full price: {formatAmount(paymentData.fullPrice, paymentData.currency)} (remaining due at appointment)
          </p>
        )}
      </div>

      {/* Stripe Payment Element */}
      <div className="p-4 rounded-lg border bg-background">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-foreground-tertiary">
        <Lock className="h-3 w-3" />
        <span>Secured by Stripe. Your payment info is encrypted.</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={processing}>
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || processing}
          className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {formatAmount(paymentData.amount, paymentData.currency)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// Main payment form component
export function PaymentForm({
  widgetId,
  appointmentTypeId,
  visitorEmail,
  visitorName,
  onPaymentSuccess,
  onBack,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentIntentData | null>(null);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId,
          appointmentTypeId,
          visitorEmail,
          visitorName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);
      } else {
        const errorData = await response.json();
        if (errorData.code === 'PAYMENTS_NOT_CONFIGURED') {
          setError('This business has not set up payment processing yet. Please contact them directly.');
        } else {
          setError(errorData.error || 'Failed to initialize payment. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error creating payment intent:', err);
      setError('Failed to connect to payment service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-foreground-secondary">Preparing secure payment...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="font-display text-xl font-semibold">Payment Error</h3>
            <p className="text-foreground-secondary max-w-md">{error}</p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={onBack}>
                Go Back
              </Button>
              <Button onClick={createPaymentIntent}>Try Again</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentData) {
    return null;
  }

  const options: StripeElementsOptions = {
    clientSecret: paymentData.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Payment
        </CardTitle>
        <CardDescription className="text-base">
          Complete your payment to confirm your booking
          {paymentData.businessName && ` with ${paymentData.businessName}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            paymentData={paymentData}
            onSuccess={onPaymentSuccess}
            onBack={onBack}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}
