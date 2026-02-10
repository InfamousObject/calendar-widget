'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export type CancellationReason =
  | 'too_expensive'
  | 'not_using'
  | 'missing_features'
  | 'switched'
  | 'other';

const REASON_OPTIONS: { value: CancellationReason; label: string }[] = [
  { value: 'too_expensive', label: 'Too expensive for my needs' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'switched', label: 'Switching to another service' },
  { value: 'other', label: 'Other' },
];

const ANNUAL_PRICING: Record<string, { monthly: number; annual: number }> = {
  booking: { monthly: 29, annual: 296 },
  chatbot: { monthly: 89, annual: 908 },
  bundle: { monthly: 119, annual: 1213 },
};

interface CancellationSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: (surveyData: {
    reason: CancellationReason;
    reasonDetails?: string;
    feedback?: string;
  }) => Promise<void>;
  currentTier: string;
  billingInterval: string;
  onAcceptRetentionOffer: (switchToAnnual: boolean) => Promise<void>;
}

export function CancellationSurveyModal({
  open,
  onOpenChange,
  onConfirmCancel,
  currentTier,
  billingInterval,
  onAcceptRetentionOffer,
}: CancellationSurveyModalProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<CancellationReason | ''>('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'survey' | 'retention-offer'>('survey');
  const [applyingOffer, setApplyingOffer] = useState(false);

  const shouldShowRetentionOffer =
    reason === 'too_expensive' &&
    currentTier !== 'free' &&
    currentTier in ANNUAL_PRICING;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    if (shouldShowRetentionOffer && step === 'survey') {
      setStep('retention-offer');
      return;
    }

    setLoading(true);
    try {
      await onConfirmCancel({
        reason,
        reasonDetails: reasonDetails.trim() || undefined,
        feedback: feedback.trim() || undefined,
      });

      // Reset form
      setReason('');
      setReasonDetails('');
      setFeedback('');
      setStep('survey');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (switchToAnnual: boolean) => {
    setApplyingOffer(true);
    try {
      await onAcceptRetentionOffer(switchToAnnual);
      toast.success('Offer applied! 20% off your next payment.');
      onOpenChange(false);
      // Reset form
      setReason('');
      setReasonDetails('');
      setFeedback('');
      setStep('survey');
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply offer');
    } finally {
      setApplyingOffer(false);
    }
  };

  const handleProceedWithCancellation = async () => {
    setLoading(true);
    try {
      await onConfirmCancel({
        reason: reason as CancellationReason,
        reasonDetails: reasonDetails.trim() || undefined,
        feedback: feedback.trim() || undefined,
      });

      // Reset form
      setReason('');
      setReasonDetails('');
      setFeedback('');
      setStep('survey');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !applyingOffer) {
      onOpenChange(false);
      // Reset form
      setReason('');
      setReasonDetails('');
      setFeedback('');
      setStep('survey');
    }
  };

  const pricing = ANNUAL_PRICING[currentTier];
  const isMonthly = billingInterval === 'month';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'survey' && (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                We're sorry to see you go
              </DialogTitle>
              <DialogDescription>
                Before you cancel, please help us improve by sharing your feedback.
                You'll retain access until the end of your billing period.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Why are you canceling? *</Label>
                <Select
                  value={reason}
                  onValueChange={(value) => setReason(value as CancellationReason)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reasonDetails">Tell us more (optional)</Label>
                <Textarea
                  id="reasonDetails"
                  placeholder="What could we have done differently?"
                  value={reasonDetails}
                  onChange={(e) => setReasonDetails(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="feedback">How could we improve? (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Any suggestions for making our product better?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg mb-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Note:</strong> Your subscription will remain active until the end of your
                current billing period. You can reactivate anytime before then.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Keep Subscription
              </Button>
              <Button type="submit" variant="destructive" disabled={loading || !reason}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'retention-offer' && pricing && (
          <div>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-600" />
                {isMonthly
                  ? "Before you go \u2014 save with 20% off"
                  : "Before you go \u2014 here's 20% off"}
              </DialogTitle>
              <DialogDescription>
                {isMonthly
                  ? "We'd hate to lose you! Here's a special offer to help with the cost."
                  : "We'd hate to lose you! Here's a discount on your next payment."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              {isMonthly ? (
                <>
                  {/* Monthly user: show annual comparison + 20% off */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Current (Monthly)</p>
                      <p className="text-2xl font-bold">${pricing.monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                      <p className="text-xs text-muted-foreground mt-1">${pricing.monthly * 12}/year</p>
                    </div>
                    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-950">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Annual + 20% Off</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        ${Math.round((pricing.annual * 0.8) / 12)}<span className="text-sm font-normal">/mo</span>
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        ${Math.round(pricing.annual * 0.8)} first year
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium text-center">
                      Save ${pricing.monthly * 12 - Math.round(pricing.annual * 0.8)} on your first year
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleAcceptOffer(true)}
                      disabled={applyingOffer || loading}
                    >
                      {applyingOffer ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        'Switch to Annual + 20% Off'
                      )}
                    </Button>

                    <Button
                      variant="link"
                      className="w-full text-muted-foreground"
                      onClick={() => handleAcceptOffer(false)}
                      disabled={applyingOffer || loading}
                    >
                      Just apply 20% off my current plan
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={handleProceedWithCancellation}
                      disabled={applyingOffer || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'No thanks, proceed with cancellation'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Annual user: show 20% off next payment */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Current Price</p>
                      <p className="text-2xl font-bold">${pricing.annual}<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
                    </div>
                    <div className="p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-950">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">With 20% Off</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        ${Math.round(pricing.annual * 0.8)}<span className="text-sm font-normal">/yr</span>
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Next payment only
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium text-center">
                      Save ${pricing.annual - Math.round(pricing.annual * 0.8)} on your next payment
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleAcceptOffer(false)}
                      disabled={applyingOffer || loading}
                    >
                      {applyingOffer ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        'Apply 20% Off'
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground"
                      onClick={handleProceedWithCancellation}
                      disabled={applyingOffer || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'No thanks, proceed with cancellation'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
