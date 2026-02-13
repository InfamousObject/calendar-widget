'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, ExternalLink, Loader2, Wallet, TrendingUp, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CancellationSurveyModal, CancellationReason } from '@/components/billing/cancellation-survey-modal';
import { trackConversion } from '@/lib/analytics/track';

interface BillingInfo {
  tier: string;
  status: string;
  interval?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  usage: {
    bookings: number;
    chatMessages: number;
  };
  seats: {
    used: number;
    included: number;
    additional: number;
    total: number;
  };
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState<string | null>(null);
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      trackConversion('purchase', { currency: 'USD' });
      setTimeout(() => {
        toast.success('Subscription updated successfully!');
      }, 500);
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, []);

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/billing/info');
      if (response.ok) {
        const data = await response.json();
        setBilling(data);
      }
    } catch (error) {
      console.error('Error fetching billing info:', error);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  const handleChangePlan = async (tier: 'booking' | 'chatbot' | 'bundle', interval: 'month' | 'year') => {
    const planKey = `${tier}-${interval}`;
    setChangePlanLoading(planKey);

    try {
      const response = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change plan');
      }

      toast.success('Plan changed successfully!');
      setShowPlanOptions(false);

      // Refresh billing info
      await fetchBillingInfo();
    } catch (error: any) {
      console.error('Change plan error:', error);
      toast.error(error.message || 'Failed to change plan');
    } finally {
      setChangePlanLoading(null);
    }
  };

  const handleCancel = async (surveyData: {
    reason: CancellationReason;
    reasonDetails?: string;
    feedback?: string;
  }) => {
    setCancelLoading(true);

    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      toast.success('Subscription canceled. You will retain access until the end of your billing period.');
      setShowCancelModal(false);

      // Refresh billing info
      await fetchBillingInfo();
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.message || 'Failed to cancel subscription');
      throw error; // Re-throw so the modal knows to keep loading state
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRetentionOffer = async (switchToAnnual: boolean) => {
    const response = await fetch('/api/stripe/retention-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ switchToAnnual }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to apply offer');
    await fetchBillingInfo();
  };

  const handleReactivate = async () => {
    setReactivateLoading(true);
    try {
      const response = await fetch('/api/stripe/reactivate', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription');
      }
      toast.success('Subscription reactivated successfully!');
      await fetchBillingInfo();
    } catch (error: any) {
      console.error('Reactivate error:', error);
      toast.error(error.message || 'Failed to reactivate subscription');
    } finally {
      setReactivateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="p-8">
        <p>Failed to load billing information</p>
      </div>
    );
  }

  const tierNames: Record<string, string> = {
    free: 'Free',
    booking: 'Booking',
    chatbot: 'Chatbot',
    bundle: 'Bundle',
  };

  const statusColors: Record<string, string> = {
    active: 'default',
    trialing: 'secondary',
    past_due: 'destructive',
    canceled: 'secondary',
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight">Billing & Subscription</h1>
            </div>
            <p className="text-lg text-foreground-secondary font-light">
              Manage your plan and payment methods
            </p>
          </div>
        </div>

        {/* Current Plan */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Current Plan</CardTitle>
                  <CardDescription className="text-base">Your active subscription</CardDescription>
                </div>
              </div>
              {billing.tier !== 'free' && billing.status === 'active' && !billing.cancelAtPeriodEnd && (
                <Button onClick={() => setShowPlanOptions(!showPlanOptions)} variant="outline">
                  {showPlanOptions ? 'Hide Plans' : 'Change Plan'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{tierNames[billing.tier] || 'Unknown'}</span>
              {billing.status && (
                <Badge variant={statusColors[billing.status] as any || 'secondary'}>
                  {billing.status}
                </Badge>
              )}
            </div>

            {billing.tier !== 'free' && billing.currentPeriodEnd && (
              <div className="text-sm text-muted-foreground">
                <p>
                  Billing cycle: {billing.interval === 'year' ? 'Annual' : 'Monthly'}
                </p>
                <p>
                  {billing.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on{' '}
                  {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}

            {billing.tier === 'free' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You're currently on the Free plan. Upgrade to unlock more features!
                </p>
                <Button onClick={() => (window.location.href = '/pricing')}>
                  View Plans
                </Button>
              </div>
            )}

            {billing.cancelAtPeriodEnd && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-100 mb-3">
                  Your subscription will be canceled at the end of the current period. Reactivate now to keep your plan.
                </p>
                <Button
                  onClick={handleReactivate}
                  disabled={reactivateLoading}
                  size="sm"
                >
                  {reactivateLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    'Reactivate Subscription'
                  )}
                </Button>
              </div>
            )}

            {/* Plan Change Options */}
            {showPlanOptions && billing.tier !== 'free' && billing.status === 'active' && !billing.cancelAtPeriodEnd && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Available Plans</h3>
                <div className="grid gap-3">
                  {/* Booking Plans */}
                  <PlanOption
                    name="Booking"
                    monthlyPrice={29}
                    annualPrice={296}
                    description="Unlimited bookings & appointment types"
                    features={['Unlimited bookings', 'Unlimited appointment types', 'Team seats available']}
                    currentTier={billing.tier}
                    currentInterval={billing.interval || 'month'}
                    tier="booking"
                    onSelect={handleChangePlan}
                    loading={changePlanLoading}
                  />

                  {/* Chatbot Plans */}
                  <PlanOption
                    name="Chatbot"
                    monthlyPrice={89}
                    annualPrice={908}
                    description="AI chatbot + $0.01/message"
                    features={['AI chatbot with Claude Opus', 'Unlimited knowledge base', 'Lead qualification']}
                    currentTier={billing.tier}
                    currentInterval={billing.interval || 'month'}
                    tier="chatbot"
                    onSelect={handleChangePlan}
                    loading={changePlanLoading}
                  />

                  {/* Bundle Plans */}
                  <PlanOption
                    name="Bundle"
                    monthlyPrice={119}
                    annualPrice={1213}
                    description="Everything + $0.008/message"
                    features={['Everything in Booking & Chatbot', '20% cheaper messages', 'Remove branding']}
                    currentTier={billing.tier}
                    currentInterval={billing.interval || 'month'}
                    tier="bundle"
                    onSelect={handleChangePlan}
                    loading={changePlanLoading}
                    recommended
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Usage This Month</CardTitle>
                <CardDescription className="text-base">Track your monthly activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.tier === 'free' || billing.tier === 'booking' || billing.tier === 'bundle' ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Bookings</span>
                  <span className="text-sm text-muted-foreground">
                    {billing.usage.bookings}
                    {billing.tier === 'free' && ' / 25'}
                  </span>
                </div>
                {billing.tier === 'free' && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min((billing.usage.bookings / 25) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ) : null}

            {(billing.tier === 'chatbot' || billing.tier === 'bundle') && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Chatbot Messages</span>
                  <span className="text-sm text-muted-foreground">
                    {billing.usage.chatMessages}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Charged at ${billing.tier === 'bundle' ? '0.008' : '0.01'} per message
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Seats */}
        {(billing.tier === 'booking' || billing.tier === 'bundle') && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">Team Seats</CardTitle>
                    <CardDescription className="text-base">Manage your team capacity</CardDescription>
                  </div>
                </div>
                <Link href="/dashboard/team">
                  <Button variant="outline" size="sm">
                    Manage Team
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Seats Used</p>
                  <p className="text-2xl font-bold">{billing.seats.used}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Included</p>
                  <p className="text-2xl font-bold">{billing.seats.included}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Additional</p>
                  <p className="text-2xl font-bold">{billing.seats.additional}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-bold">{billing.seats.total}</p>
                </div>
              </div>
              {billing.seats.additional > 0 && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                  <p>
                    Additional seats: <span className="font-medium text-foreground">{billing.seats.additional} × $5/month = ${billing.seats.additional * 5}/month</span>
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                1 seat included with your plan. Additional team members cost $5/month each.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Method & Cancellation */}
        {billing.hasStripeCustomer && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Settings className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Manage Subscription</CardTitle>
                  <CardDescription className="text-base">Update your payment method or cancel your subscription</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method */}
              <div>
                <p className="text-sm font-medium mb-2">Payment Method</p>
                <Button onClick={openPortal} disabled={portalLoading} variant="outline">
                  {portalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment Method
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Cancel Subscription */}
              {billing.tier !== 'free' && billing.status === 'active' && !billing.cancelAtPeriodEnd && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Cancel Subscription</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Need to cancel? You'll retain access until the end of your billing period.
                  </p>
                  <Button
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelLoading}
                    variant="destructive"
                    size="sm"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cancellation Survey Modal */}
        <CancellationSurveyModal
          open={showCancelModal}
          onOpenChange={setShowCancelModal}
          onConfirmCancel={handleCancel}
          currentTier={billing?.tier || 'free'}
          billingInterval={billing?.interval || 'month'}
          onAcceptRetentionOffer={handleRetentionOffer}
        />
      </div>
    </div>
  );
}

// Plan Option Component
function PlanOption({
  name,
  monthlyPrice,
  annualPrice,
  description,
  features,
  currentTier,
  currentInterval,
  tier,
  onSelect,
  loading,
  recommended,
}: {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  currentTier: string;
  currentInterval: string;
  tier: 'booking' | 'chatbot' | 'bundle';
  onSelect: (tier: 'booking' | 'chatbot' | 'bundle', interval: 'month' | 'year') => void;
  loading: string | null;
  recommended?: boolean;
}) {
  const isCurrentPlan = currentTier === tier;
  const annualSavings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  return (
    <div className={`p-4 border rounded-lg ${isCurrentPlan ? 'border-primary bg-primary/5' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{name}</h4>
            {recommended && (
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            )}
            {isCurrentPlan && (
              <Badge className="text-xs">
                Current Plan
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <ul className="space-y-1 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        {/* Monthly Option */}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">${monthlyPrice}/month</p>
          <Button
            onClick={() => onSelect(tier, 'month')}
            disabled={loading !== null || (isCurrentPlan && currentInterval === 'month')}
            variant={isCurrentPlan && currentInterval === 'month' ? 'secondary' : 'outline'}
            size="sm"
            className="w-full"
          >
            {loading === `${tier}-month` ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : isCurrentPlan && currentInterval === 'month' ? (
              'Current'
            ) : (
              'Select Monthly'
            )}
          </Button>
        </div>

        {/* Annual Option */}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            ${annualPrice}/year
            <span className="text-xs text-green-600 ml-1">Save {annualSavings}%</span>
          </p>
          <Button
            onClick={() => onSelect(tier, 'year')}
            disabled={loading !== null || (isCurrentPlan && currentInterval === 'year')}
            variant={isCurrentPlan && currentInterval === 'year' ? 'secondary' : 'outline'}
            size="sm"
            className="w-full"
          >
            {loading === `${tier}-year` ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : isCurrentPlan && currentInterval === 'year' ? (
              'Current'
            ) : (
              'Select Annual'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
