import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Kentroi terms of service. Read the terms and conditions that govern your use of Kentroi scheduling widgets and related services.',
  alternates: {
    canonical: 'https://www.kentroi.com/terms',
  },
  openGraph: {
    title: 'Terms of Service | Kentroi',
    description:
      'Terms and conditions governing your use of Kentroi scheduling widgets and services.',
    url: 'https://www.kentroi.com/terms',
  },
};

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/kentroi-logomark.png" alt="Kentroi" className="h-8 w-8" />
            <img src="/kentroi-wordmark.png" alt="Kentroi" className="h-6" />
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
          <p className="mb-8 text-muted-foreground">Last updated: January 9, 2025</p>

          <div className="prose prose-gray max-w-none dark:prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing or using Kentroi (&quot;Service&quot;), operated by Kentroi (&quot;we,&quot; &quot;us,&quot;
                or &quot;our&quot;) at kentroi.com, you agree to be bound by these Terms of Service (&quot;Terms&quot;).
              </p>
              <p className="text-muted-foreground">
                If you do not agree to these Terms, you may not access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground mb-4">
                Kentroi provides an embeddable website widget that includes:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Appointment scheduling and booking management</li>
                <li>Customizable contact forms</li>
                <li>AI-powered chatbot for customer engagement</li>
                <li>Calendar integrations (Google Calendar, Outlook)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground mb-4">
                To use the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <p className="text-muted-foreground">
                You must be at least 18 years old or the age of majority in your jurisdiction to
                create an account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>

              <h3 className="text-xl font-medium mb-3">4.1 Free Tier</h3>
              <p className="text-muted-foreground mb-4">
                We offer a free tier with limited features. Free accounts may be subject to usage
                limits as described on our pricing page.
              </p>

              <h3 className="text-xl font-medium mb-3">4.2 Paid Subscriptions</h3>
              <p className="text-muted-foreground mb-4">
                Paid subscriptions are billed monthly or annually in advance. By subscribing, you
                authorize us to charge your payment method on a recurring basis.
              </p>

              <h3 className="text-xl font-medium mb-3">4.3 Metered Usage</h3>
              <p className="text-muted-foreground mb-4">
                Certain features (such as AI chatbot messages) are billed based on usage. Metered
                charges are billed at the end of each billing period.
              </p>

              <h3 className="text-xl font-medium mb-3">4.4 Refunds</h3>
              <p className="text-muted-foreground mb-4">
                Subscription fees are non-refundable except as required by law. If you cancel,
                you will retain access until the end of your current billing period.
              </p>

              <h3 className="text-xl font-medium mb-3">4.5 Price Changes</h3>
              <p className="text-muted-foreground mb-4">
                We may change our prices with 30 days&apos; notice. Price changes will take effect at
                your next billing period after the notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
              <p className="text-muted-foreground mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Send spam, phishing, or malicious content</li>
                <li>Collect personal data without proper consent</li>
                <li>Impersonate others or provide false information</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt to gain unauthorized access to systems</li>
                <li>Use the Service for illegal, harmful, or fraudulent activities</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Content and Data</h2>

              <h3 className="text-xl font-medium mb-3">6.1 Ownership</h3>
              <p className="text-muted-foreground mb-4">
                You retain ownership of all content you create or upload to the Service, including
                widget configurations, form data, and appointment information.
              </p>

              <h3 className="text-xl font-medium mb-3">6.2 License to Us</h3>
              <p className="text-muted-foreground mb-4">
                You grant us a limited license to use, store, and process your content solely to
                provide and improve the Service.
              </p>

              <h3 className="text-xl font-medium mb-3">6.3 Your Responsibilities</h3>
              <p className="text-muted-foreground mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Obtaining necessary consents from your website visitors</li>
                <li>Complying with privacy laws applicable to your business</li>
                <li>Ensuring your use complies with these Terms</li>
                <li>The accuracy of your knowledge base content for the AI chatbot</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. AI Chatbot Terms</h2>
              <p className="text-muted-foreground mb-4">
                The AI chatbot is powered by third-party AI services (Anthropic Claude). You
                acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>AI responses are generated automatically and may not always be accurate</li>
                <li>You should review and customize the knowledge base for your business</li>
                <li>The AI should not be used for medical, legal, or financial advice</li>
                <li>We are not liable for AI-generated responses or their consequences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground mb-4">
                The Service, including its design, features, and technology, is owned by Kentroi
                and protected by intellectual property laws. You may not:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Copy, modify, or create derivative works of the Service</li>
                <li>Reverse engineer or decompile the Service</li>
                <li>Remove any proprietary notices from the Service</li>
                <li>Use our trademarks without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                The Service integrates with third-party services including Google Calendar, Stripe,
                and Anthropic. Your use of these integrations is subject to the respective
                third-party terms of service.
              </p>
              <p className="text-muted-foreground">
                We are not responsible for the availability, accuracy, or practices of third-party
                services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Merchantability or fitness for a particular purpose</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Accuracy or reliability of any information</li>
                <li>Security of data transmission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMARTWIDGET SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Any indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages arising from third-party services or integrations</li>
                <li>AI chatbot responses or their consequences</li>
              </ul>
              <p className="text-muted-foreground">
                Our total liability shall not exceed the amount you paid us in the 12 months
                preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Kentroi and its officers, directors,
                employees, and agents from any claims, damages, or expenses arising from your use
                of the Service, violation of these Terms, or infringement of any rights of others.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
              <p className="text-muted-foreground mb-4">
                You may cancel your account at any time through your dashboard or by contacting us.
              </p>
              <p className="text-muted-foreground mb-4">
                We may suspend or terminate your account if you violate these Terms or for any
                other reason with reasonable notice, except in cases of serious violations where
                immediate termination may be necessary.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service ceases immediately. You may export
                your data before termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p className="text-muted-foreground mb-4">
                We may modify these Terms at any time. We will notify you of material changes by
                email or through the Service. Your continued use after changes constitutes
                acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">15. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms are governed by the laws of the State of Delaware, United States,
                without regard to conflict of law principles. Any disputes shall be resolved in
                the courts of Delaware.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">16. Miscellaneous</h2>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>
                  <strong>Entire Agreement:</strong> These Terms constitute the entire agreement
                  between you and Kentroi.
                </li>
                <li>
                  <strong>Severability:</strong> If any provision is found unenforceable, the
                  remaining provisions remain in effect.
                </li>
                <li>
                  <strong>Waiver:</strong> Our failure to enforce any right does not waive that
                  right.
                </li>
                <li>
                  <strong>Assignment:</strong> You may not assign these Terms without our consent.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">17. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms, please contact us at:
              </p>
              <ul className="list-none pl-0 text-muted-foreground mt-4 space-y-1">
                <li>Email: legal@kentroi.com</li>
                <li>Website: kentroi.com</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
          <p>&copy; 2026 Kentroi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
