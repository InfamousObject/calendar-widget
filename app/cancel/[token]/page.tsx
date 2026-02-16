'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Check, Loader2, XCircle } from 'lucide-react';

export default function CancelAppointmentPage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : params.token?.[0] || '';

  const [status, setStatus] = useState<'confirm' | 'cancelling' | 'success' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');
  const [refundInfo, setRefundInfo] = useState<{ amount: number; currency: string } | null>(null);

  const handleCancel = async () => {
    setStatus('cancelling');
    try {
      const response = await fetch('/api/appointments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationToken: token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to cancel appointment');
        setStatus('error');
        return;
      }

      if (data.refund) {
        setRefundInfo({
          amount: data.refund.amount,
          currency: data.refund.currency || 'usd',
        });
      }

      setStatus('success');
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  const formatAmount = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {status === 'confirm' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Cancel Appointment</CardTitle>
              <CardDescription className="text-base mt-2">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.close()}
                >
                  Keep Appointment
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Cancel Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === 'cancelling' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-foreground-secondary">Cancelling your appointment...</p>
            </CardContent>
          </Card>
        )}

        {status === 'success' && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl">Appointment Cancelled</CardTitle>
              <CardDescription className="text-base mt-2">
                Your appointment has been successfully cancelled. A confirmation email has been sent to you.
              </CardDescription>
            </CardHeader>
            {refundInfo && (
              <CardContent>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    A refund of <strong>{formatAmount(refundInfo.amount, refundInfo.currency)}</strong> has been initiated and will appear in your account within 5-10 business days.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {status === 'error' && (
          <Card className="border-destructive/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Unable to Cancel</CardTitle>
              <CardDescription className="text-base mt-2">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStatus('confirm')}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
