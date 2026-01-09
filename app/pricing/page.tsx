'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type BillingInterval = 'month' | 'year';

export default function PricingPage() {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'booking' | 'chatbot' | 'bundle') => {
    // Check if user is authenticated by attempting the API call
    // If not authenticated, the API will return 401 and we'll redirect to login

    setLoading(tier);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval }),
      });

      const data = await response.json();

      if (response.status === 401) {
        // User not authenticated, redirect to login
        router.push('/auth/login?callbackUrl=/pricing');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  const prices = {
    booking: { month: 29, year: 296 },
    chatbot: { month: 89, year: 908 },
    bundle: { month: 119, year: 1213 },
  };

  const savings = {
    booking: Math.round(((29 * 12 - 296) / (29 * 12)) * 100),
    chatbot: Math.round(((89 * 12 - 908) / (89 * 12)) * 100),
    bundle: Math.round(((119 * 12 - 1213) / (119 * 12)) * 100),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background-subtle to-muted py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-foreground-secondary font-light max-w-3xl mx-auto mb-8">
            Start with a free plan, upgrade anytime. All plans include unlimited contact forms.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 bg-muted rounded-xl border border-border">
            <button
              onClick={() => setInterval('month')}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                interval === 'month'
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-foreground-secondary hover:bg-background/50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                interval === 'year'
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-foreground-secondary hover:bg-background/50'
              }`}
            >
              Annual
              <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                Save 15%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Free Tier */}
          <Card className="relative group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Free</CardTitle>
              <CardDescription className="text-base mt-2">Perfect for testing</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-display font-bold">$0</span>
                <span className="text-foreground-secondary ml-2">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">1 appointment type</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">25 bookings/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited contact forms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Basic customization</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">No AI chatbot</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full group-hover:scale-105 transition-all duration-300" variant="outline" onClick={() => router.push('/auth/register')}>
                Get Started
              </Button>
            </CardFooter>
          </Card>

          {/* Booking Tier */}
          <Card className="relative group hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 border-primary/20 flex flex-col">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Booking</CardTitle>
              <CardDescription className="text-base mt-2">For scheduling pros</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ${prices.booking[interval]}
                </span>
                <span className="text-foreground-secondary ml-2">/{interval === 'month' ? 'mo' : 'yr'}</span>
                {interval === 'year' && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                    <span>Save {savings.booking}%</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">Unlimited appointment types</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">Unlimited bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited contact forms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Full customization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Team seats ($5/month each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">No AI chatbot</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg hover:shadow-primary/30 group-hover:scale-105 transition-all duration-300"
                onClick={() => handleSubscribe('booking')}
                disabled={loading !== null}
              >
                {loading === 'booking' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Chatbot Tier */}
          <Card className="relative group hover:shadow-xl hover:shadow-accent/10 hover:-translate-y-2 transition-all duration-300 border-accent/20 flex flex-col">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Chatbot</CardTitle>
              <CardDescription className="text-base mt-2">AI-powered engagement</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-display font-bold bg-gradient-to-r from-accent to-warning bg-clip-text text-transparent">
                  ${prices.chatbot[interval]}
                </span>
                <span className="text-foreground-secondary ml-2">/{interval === 'month' ? 'mo' : 'yr'}</span>
                {interval === 'year' && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                    <span>Save {savings.chatbot}%</span>
                  </div>
                )}
                <div className="text-sm text-foreground-tertiary mt-3">+ $0.01/message</div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">AI Chatbot with Claude</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited contact forms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited knowledge base</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Lead qualification</span>
                </li>
                <li className="flex items-start gap-2">
                  <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">No booking features</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                className="w-full bg-gradient-to-r from-accent to-accent/90 hover:shadow-lg hover:shadow-accent/30 group-hover:scale-105 transition-all duration-300"
                onClick={() => handleSubscribe('chatbot')}
                disabled={loading !== null}
              >
                {loading === 'chatbot' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardFooter>

            <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-accent/20 to-warning/20 opacity-0 blur-xl group-hover:opacity-100 transition-opacity duration-300" />
          </Card>

          {/* Bundle Tier */}
          <Card className="relative group hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 border-2 border-primary overflow-hidden flex flex-col pt-4">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

            <Badge className="absolute top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white shadow-lg z-10 px-4 py-1">
              Best Value
            </Badge>

            <CardHeader className="relative z-10 pt-6">
              <CardTitle className="font-display text-2xl">Bundle</CardTitle>
              <CardDescription className="text-base mt-2">Everything you need</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  ${prices.bundle[interval]}
                </span>
                <span className="text-foreground-secondary ml-2">/{interval === 'month' ? 'mo' : 'yr'}</span>
                {interval === 'year' && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                    <span>Save {savings.bundle}%</span>
                  </div>
                )}
                <div className="text-sm text-foreground-tertiary mt-3">+ $0.008/message</div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">Everything in Booking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">Everything in Chatbot</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">20% cheaper messages</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Team seats ($5/month each)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm">Remove SmartWidget branding</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="relative z-10 mt-auto">
              <Button
                className="w-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:shadow-xl hover:shadow-primary/30 group-hover:scale-105 transition-all duration-500"
                onClick={() => handleSubscribe('bundle')}
                disabled={loading !== null}
              >
                {loading === 'bundle' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 text-center">
          <h2 className="font-display text-4xl font-semibold tracking-tight mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Are contact forms really free forever?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Contact forms are completely free on all tiers, including the Free plan. No limits, no hidden fees.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does metered pricing work?</h3>
              <p className="text-sm text-muted-foreground">
                On Chatbot and Bundle tiers, you pay a base fee plus usage. Only user messages are counted - bot responses are free. You'll see monthly usage and can set limits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can change plans anytime from your billing dashboard. Upgrades are prorated, and downgrades take effect at the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards via Stripe, plus Stripe Link for one-click checkout if you've used it before.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
          <p>&copy; 2025 SmartWidget. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
