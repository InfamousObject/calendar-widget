'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowRight,
  RefreshCw,
  Unlink,
  Info,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConnectStatus {
  connected: boolean;
  accountId: string | null;
  onboarded: boolean;
  payoutsEnabled: boolean;
  chargesEnabled?: boolean;
}

interface ConnectError {
  error: string;
  code: string;
  details: string;
}

export default function PaymentsSettingsPage() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [openingDashboard, setOpeningDashboard] = useState(false);
  const [connectError, setConnectError] = useState<ConnectError | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchConnectStatus();

    // Check if returning from Stripe onboarding
    if (searchParams.get('refresh') === 'true') {
      toast.info('Checking your Stripe account status...');
    }
  }, [searchParams]);

  const fetchConnectStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching connect status:', error);
      toast.error('Failed to fetch payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/settings/payments`,
          refreshUrl: `${window.location.origin}/dashboard/settings/payments?refresh=true`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        const errorData = await response.json();
        // Set detailed error for display
        if (errorData.code) {
          setConnectError(errorData);
        } else {
          toast.error(errorData.error || 'Failed to start Stripe Connect setup');
        }
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to connect Stripe account');
    } finally {
      setConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    setOpeningDashboard(true);
    try {
      const response = await fetch('/api/stripe/connect/dashboard');
      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to open Stripe Dashboard');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
      toast.error('Failed to open Stripe Dashboard');
    } finally {
      setOpeningDashboard(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect your Stripe account? You will no longer be able to accept payments for appointments.'
    );
    if (!confirmed) return;

    setDisconnecting(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Stripe account disconnected');
        await fetchConnectStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to disconnect Stripe account');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect Stripe account');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="h-32 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const isFullySetup = status?.connected && status?.onboarded && status?.payoutsEnabled;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight">Payment Settings</h1>
            </div>
            <p className="text-lg text-foreground-secondary font-light">
              Connect your Stripe account to accept payments for appointments
            </p>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Stripe Connect</CardTitle>
                  <CardDescription className="text-base">
                    Receive payments directly to your Stripe account
                  </CardDescription>
                </div>
              </div>
              {status?.connected && (
                <Badge
                  variant={isFullySetup ? 'default' : 'secondary'}
                  className={isFullySetup ? 'bg-success text-white' : ''}
                >
                  {isFullySetup ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Setup Incomplete
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!status?.connected ? (
              // Not connected state
              <div className="space-y-6">
                {/* Error Display */}
                {connectError && (
                  <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="space-y-2">
                        <p className="font-medium text-destructive">{connectError.error}</p>
                        <p className="text-sm text-foreground-secondary">{connectError.details}</p>
                        {connectError.code === 'CONNECT_NOT_ENABLED' && (
                          <div className="mt-3 p-3 rounded-md bg-background border">
                            <p className="text-sm font-medium mb-2">To enable Stripe Connect:</p>
                            <ol className="text-sm text-foreground-secondary space-y-1 list-decimal list-inside">
                              <li>Go to your <a href="https://dashboard.stripe.com/settings/connect" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard → Settings → Connect</a></li>
                              <li>Click "Get started with Connect"</li>
                              <li>Complete the short onboarding process</li>
                              <li>Return here and try connecting again</li>
                            </ol>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => window.open('https://dashboard.stripe.com/settings/connect', '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open Stripe Connect Settings
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/10">
                      <CreditCard className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold mb-2">
                        Accept Payments for Appointments
                      </h3>
                      <p className="text-foreground-secondary max-w-md">
                        Connect your Stripe account to start accepting payments. Funds go directly
                        to your bank account with no platform fees.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg mt-4">
                      <div className="p-3 rounded-lg bg-background border">
                        <p className="font-semibold text-lg text-primary">0%</p>
                        <p className="text-xs text-foreground-secondary">Platform Fee</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background border">
                        <p className="font-semibold text-lg text-primary">Instant</p>
                        <p className="text-xs text-foreground-secondary">Setup</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background border">
                        <p className="font-semibold text-lg text-primary">Secure</p>
                        <p className="text-xs text-foreground-secondary">PCI Compliant</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                  size="lg"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect with Stripe
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            ) : !status.onboarded ? (
              // Connected but not onboarded
              <div className="space-y-6">
                <div className="p-4 rounded-lg border border-warning/50 bg-warning/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Complete Your Setup</p>
                      <p className="text-sm text-foreground-secondary mt-1">
                        Your Stripe account is connected but you need to complete the onboarding
                        process to start accepting payments.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Complete Onboarding
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={fetchConnectStatus}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Fully connected
              <div className="space-y-6">
                {/* Status indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-background">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">Onboarding Complete</p>
                      <p className="text-sm text-foreground-secondary">
                        Your account details are verified
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border bg-background">
                    <div
                      className={`p-2 rounded-lg ${status.payoutsEnabled ? 'bg-success/10' : 'bg-warning/10'}`}
                    >
                      {status.payoutsEnabled ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {status.payoutsEnabled ? 'Payouts Enabled' : 'Payouts Pending'}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {status.payoutsEnabled
                          ? 'You can receive payments'
                          : 'Additional verification may be needed'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account ID */}
                {status.accountId && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <p className="text-sm text-foreground-secondary mb-1">Connected Account</p>
                    <p className="font-mono text-sm">{status.accountId}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleOpenDashboard}
                    disabled={openingDashboard}
                    className="flex-1"
                  >
                    {openingDashboard ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Stripe Dashboard
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="hover:border-destructive hover:text-destructive"
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Unlink className="mr-2 h-4 w-4" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prerequisites Card - Only show if not connected */}
        {!status?.connected && (
          <Card className="border-border shadow-md border-l-4 border-l-info">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-info" />
                <CardTitle className="font-display text-xl">Before You Start</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-foreground-secondary">
                  To accept payments, you need a Stripe account with Connect enabled. Here's how to set it up:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">1. Create a Stripe Account</p>
                      <p className="text-sm text-foreground-secondary">
                        If you don't have one, <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sign up for Stripe</a> (it's free).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">2. Enable Stripe Connect</p>
                      <p className="text-sm text-foreground-secondary">
                        Go to <a href="https://dashboard.stripe.com/settings/connect" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard → Settings → Connect</a> and complete the short setup.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">3. Return Here to Connect</p>
                      <p className="text-sm text-foreground-secondary">
                        Once Connect is enabled, click "Connect with Stripe" above to link your account.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground-secondary">
                      <span className="font-medium text-foreground">Tip:</span> Stripe Connect setup typically takes less than 5 minutes. You'll need your business details and bank account information.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Connect Your Stripe Account</p>
                  <p className="text-sm text-foreground-secondary">
                    Set up or link your existing Stripe account securely through our platform.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Set Prices on Appointment Types</p>
                  <p className="text-sm text-foreground-secondary">
                    Go to Appointment Types and enable pricing for the services you want to charge
                    for.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Get Paid Automatically</p>
                  <p className="text-sm text-foreground-secondary">
                    When customers book paid appointments, payments are processed and deposited
                    directly to your bank account.
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* FAQ Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-xl">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">What fees will I pay?</p>
                <p className="text-sm text-foreground-secondary">
                  We charge 0% platform fee. You only pay standard Stripe processing fees (2.9% + 30¢ per transaction in the US).
                </p>
              </div>
              <div>
                <p className="font-medium">When do I receive my payments?</p>
                <p className="text-sm text-foreground-secondary">
                  Payments are deposited to your bank account on Stripe's standard payout schedule (typically 2 business days).
                </p>
              </div>
              <div>
                <p className="font-medium">Can I offer deposits instead of full payment?</p>
                <p className="text-sm text-foreground-secondary">
                  Yes! When setting up an appointment type, you can choose to collect a deposit percentage instead of the full amount.
                </p>
              </div>
              <div>
                <p className="font-medium">What happens if a customer cancels?</p>
                <p className="text-sm text-foreground-secondary">
                  You can configure refund policies per appointment type. When you cancel an appointment, we'll process the refund according to your policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
