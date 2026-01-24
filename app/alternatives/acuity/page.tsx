import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  X,
  Clock,
  DollarSign,
  MessageSquare,
  Shield,
  Zap,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { FAQSchema, ComparisonSchema } from '@/components/seo/schemas';

export const metadata: Metadata = {
  title: 'Acuity Scheduling Alternative 2025 - Simpler & More Affordable',
  description:
    'Looking for an Acuity Scheduling alternative? Kentroi offers appointment scheduling, contact forms, and AI chatbot in one simple widget. Free tier available.',
  keywords: [
    'acuity scheduling alternative',
    'acuity alternative',
    'acuity scheduling competitor',
    'acuity replacement',
    'scheduling software like acuity',
    'better than acuity scheduling',
    'simpler than acuity',
  ],
  alternates: {
    canonical: 'https://www.kentroi.com/alternatives/acuity',
  },
  openGraph: {
    title: 'Acuity Scheduling Alternative - Kentroi',
    description:
      'Kentroi is an Acuity alternative with AI chatbot, contact forms, and simpler setup. Free tier available.',
    url: 'https://www.kentroi.com/alternatives/acuity',
  },
};

const comparisonData = [
  { feature: 'Starting Price', kentroi: '$29/mo', acuity: '$20/mo' },
  { feature: 'Free Tier', kentroi: '✓ Contact forms free', acuity: '✗ 7-day trial only' },
  { feature: 'Contact Forms', kentroi: '✓ Unlimited free', acuity: '✓ Basic intake forms' },
  { feature: 'AI Chatbot', kentroi: '✓ Built-in', acuity: '✗ Not available' },
  { feature: 'Setup Time', kentroi: '~5 minutes', acuity: '30+ minutes' },
  { feature: 'Google Calendar Sync', kentroi: '✓', acuity: '✓' },
  { feature: 'Payment Collection', kentroi: '✓ Stripe', acuity: '✓ Stripe/Square/PayPal' },
  { feature: 'Custom Branding', kentroi: '✓', acuity: '✓' },
  { feature: 'Packages & Subscriptions', kentroi: 'Coming soon', acuity: '✓' },
  { feature: 'Gift Certificates', kentroi: '✗', acuity: '✓' },
  { feature: 'Squarespace Integration', kentroi: '✓ Embeddable', acuity: '✓ Native' },
  { feature: 'Learning Curve', kentroi: 'Minimal', acuity: 'Steep' },
];

const faqItems = [
  {
    question: 'Is Kentroi a good alternative to Acuity Scheduling?',
    answer:
      'Yes, Kentroi is an excellent Acuity alternative for businesses that want simpler setup and don\'t need Acuity\'s advanced features like packages or gift certificates. Kentroi offers AI chatbot functionality and free contact forms that Acuity doesn\'t have.',
  },
  {
    question: 'How much does Kentroi cost compared to Acuity?',
    answer:
      'Kentroi\'s scheduling starts at $29/month vs Acuity\'s $20/month. However, Kentroi includes AI chatbot capabilities not available on Acuity at any price, and offers free contact forms forever. Acuity only offers a 7-day free trial with no permanent free tier.',
  },
  {
    question: 'Is Kentroi easier to set up than Acuity?',
    answer:
      'Yes, significantly. Kentroi can be set up in about 5 minutes - connect your calendar, create an appointment type, and embed the widget. Acuity has many more options which means more configuration time, often 30+ minutes for initial setup.',
  },
  {
    question: 'Can I migrate from Acuity to Kentroi?',
    answer:
      'Yes. Since both integrate with Google Calendar, your existing appointments stay intact. You\'ll need to recreate your appointment types in Kentroi (which takes minutes) and update your booking link on your website.',
  },
  {
    question: 'What does Acuity have that Kentroi doesn\'t?',
    answer:
      'Acuity offers packages/subscriptions, gift certificates, and deeper Squarespace integration (they\'re owned by Squarespace). If you need these specific features, Acuity may be better. But if you want simplicity plus AI chat, Kentroi wins.',
  },
  {
    question: 'Does Kentroi work with Squarespace?',
    answer:
      'Yes, Kentroi\'s widget can be embedded on any website including Squarespace, WordPress, Wix, Shopify, and custom sites. While Acuity has native Squarespace integration, Kentroi\'s embed code works seamlessly on Squarespace too.',
  },
];

const painPoints = [
  {
    icon: Settings,
    title: 'Complex Setup',
    description:
      'Acuity has so many options it takes 30+ minutes to configure. Great for power users, overwhelming for everyone else.',
  },
  {
    icon: DollarSign,
    title: 'No Free Tier',
    description:
      'Acuity only offers a 7-day trial. After that, you pay $20/month minimum. No free option for small needs.',
  },
  {
    icon: AlertTriangle,
    title: 'Squarespace Lock-in',
    description:
      'Owned by Squarespace since 2019. Best experience is on Squarespace, less focus on other platforms.',
  },
  {
    icon: X,
    title: 'No AI Features',
    description:
      'Acuity doesn\'t offer AI chatbot or automated lead qualification. You miss inquiries outside business hours.',
  },
];

export default function AcuityAlternativePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Schema Markup */}
      <FAQSchema items={faqItems} />
      <ComparisonSchema
        mainProduct="Kentroi"
        comparedProduct="Acuity Scheduling"
        mainProductUrl="https://www.kentroi.com/alternatives/acuity"
        description="Compare Kentroi and Acuity Scheduling for appointment booking. See pricing, features, ease of use, and why businesses choose simpler alternatives."
      />

      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/kentroi-logomark.png" alt="Kentroi" className="h-8 w-8" />
            <img src="/kentroi-wordmark.png" alt="Kentroi" className="h-6" />
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/alternatives" className="text-sm text-muted-foreground hover:text-foreground">
              All Alternatives
            </Link>
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Start Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Acuity Alternative
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Looking for an{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Acuity Alternative?
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Acuity is powerful but complex. Kentroi gives you scheduling, forms, and AI chat
              in a simpler package that takes minutes to set up.
            </p>

            {/* Answer Capsule - AI Extractable */}
            <div className="bg-muted/50 rounded-xl p-6 text-left mb-8 max-w-3xl mx-auto">
              <h2 className="font-semibold mb-2">What is a good Acuity Scheduling alternative?</h2>
              <p className="text-muted-foreground">
                <strong>Kentroi</strong> is a simpler Acuity Scheduling alternative that combines
                appointment booking, contact forms, and AI chatbot in one embeddable widget. Unlike
                Acuity, Kentroi offers a permanent free tier (not just a 7-day trial), 5-minute setup
                vs 30+ minutes, and an AI assistant that handles inquiries 24/7. Starting at $29/month,
                Kentroi is ideal for businesses that want powerful scheduling without the complexity.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                  Try Kentroi Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#comparison">
                <Button size="lg" variant="outline">
                  See Full Comparison
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                Why People Look for Acuity Alternatives
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Acuity Scheduling is feature-rich, but that comes with trade-offs:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {painPoints.map((point) => (
                  <div key={point.title} className="bg-surface border rounded-xl p-6">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                      <point.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <h3 className="font-semibold mb-2">{point.title}</h3>
                    <p className="text-sm text-muted-foreground">{point.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section id="comparison" className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
              Kentroi vs Acuity Scheduling: Feature Comparison
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              See how Kentroi compares to Acuity Scheduling feature by feature.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold bg-primary/5">
                      <div className="flex items-center justify-center gap-2">
                        <img src="/kentroi-logomark.png" alt="Kentroi" className="h-5 w-5" />
                        Kentroi
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 font-semibold">Acuity</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={row.feature} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-3 px-4 text-sm">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-sm bg-primary/5">
                        {row.kentroi.includes('✓') ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Check className="w-4 h-4" />
                            {row.kentroi.replace('✓', '').trim() || 'Yes'}
                          </span>
                        ) : row.kentroi.includes('✗') ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <X className="w-4 h-4" />
                            {row.kentroi.replace('✗', '').trim() || 'No'}
                          </span>
                        ) : (
                          <span className="font-medium">{row.kentroi}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {row.acuity.includes('✓') ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Check className="w-4 h-4" />
                            {row.acuity.replace('✓', '').trim() || 'Yes'}
                          </span>
                        ) : row.acuity.includes('✗') ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <X className="w-4 h-4" />
                            {row.acuity.replace('✗', '').trim() || 'No'}
                          </span>
                        ) : (
                          row.acuity
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                  Try Kentroi — Simpler Setup, Powerful Features
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Kentroi Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                What Kentroi Offers That Acuity Doesn&apos;t
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-semibold mb-2">Free Forever Tier</h3>
                  <p className="text-sm text-muted-foreground">
                    Contact forms free forever, no 7-day trial. Start without a credit card.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Chatbot</h3>
                  <p className="text-sm text-muted-foreground">
                    Answer questions, qualify leads, and book appointments 24/7 automatically.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">5-Minute Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    No complex configuration. Connect calendar, create appointment type, embed. Done.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index} className="border rounded-xl p-6">
                  <h3 className="font-semibold mb-3">{item.question}</h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-center text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready for Simpler Scheduling?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Skip the complex setup. Get scheduling, forms, and AI chat working in minutes.
              </p>
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Start Free — No Credit Card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" /> Free forever plan
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" /> 5-minute setup
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4" /> Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/alternatives" className="hover:text-primary">All Alternatives</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link href="/pricing" className="hover:text-primary">Pricing</Link>
          </div>
          <p>© 2025 Kentroi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
