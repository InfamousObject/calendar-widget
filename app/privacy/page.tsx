import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Kentroi privacy policy. Learn how we collect, use, and protect your personal information when you use our scheduling widget and services.',
  alternates: {
    canonical: 'https://www.kentroi.com/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Kentroi',
    description:
      'Learn how Kentroi collects, uses, and protects your personal information.',
    url: 'https://www.kentroi.com/privacy',
  },
};

export default function PrivacyPolicy() {
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
          <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
          <p className="mb-8 text-muted-foreground">Last updated: January 21, 2025</p>

          <div className="prose prose-gray max-w-none dark:prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground mb-4">
                Kentroi (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the kentroi.com website and Kentroi
                service. This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our service.
              </p>
              <p className="text-muted-foreground">
                By using Kentroi, you agree to the collection and use of information in accordance
                with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium mb-3">2.1 Account Information</h3>
              <p className="text-muted-foreground mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Name and email address</li>
                <li>Authentication credentials (managed securely by Clerk)</li>
                <li>Profile information you choose to provide</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 Calendar Data</h3>
              <p className="text-muted-foreground mb-4">
                If you connect your Google Calendar, we access:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Calendar events (to check availability and prevent double-booking)</li>
                <li>Calendar metadata (calendar names and IDs)</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                We only read calendar data to determine availability. We create events only when
                appointments are booked through your widget.
              </p>

              <h3 className="text-xl font-medium mb-3">2.3 Booking and Form Data</h3>
              <p className="text-muted-foreground mb-4">
                When visitors use your widget, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Visitor name and email address</li>
                <li>Appointment details (date, time, type)</li>
                <li>Form submissions and responses</li>
                <li>Chat messages with the AI chatbot</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.4 Usage Data</h3>
              <p className="text-muted-foreground mb-4">
                We automatically collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information</li>
                <li>Performance and error data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Provide and maintain our service</li>
                <li>Process appointments and form submissions</li>
                <li>Send appointment confirmations and reminders</li>
                <li>Power the AI chatbot to answer visitor questions</li>
                <li>Process payments and manage subscriptions</li>
                <li>Improve and optimize our service</li>
                <li>Communicate with you about updates and support</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
              <p className="text-muted-foreground mb-4">
                We use the following third-party services that may collect and process your data:
              </p>

              <h3 className="text-xl font-medium mb-3">4.1 Clerk (Authentication)</h3>
              <p className="text-muted-foreground mb-4">
                We use Clerk for user authentication. Their privacy policy: {' '}
                <a href="https://clerk.com/legal/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  clerk.com/legal/privacy
                </a>
              </p>

              <h3 className="text-xl font-medium mb-3">4.2 Stripe (Payments)</h3>
              <p className="text-muted-foreground mb-4">
                We use Stripe to process payments. We do not store your payment card details.
                Stripe&apos;s privacy policy: {' '}
                <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  stripe.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-medium mb-3">4.3 Google (Calendar Integration)</h3>
              <p className="text-muted-foreground mb-4">
                We use Google Calendar API to sync appointments. Google&apos;s privacy policy: {' '}
                <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>
              </p>

              <h4 className="text-lg font-medium mb-3 mt-6">Google User Data: Sharing, Transfer, and Disclosure</h4>
              <p className="text-muted-foreground mb-4">
                <strong>We do not share, transfer, or disclose your Google user data to any third parties</strong> except as necessary to provide the calendar synchronization functionality you have authorized.
              </p>
              <p className="text-muted-foreground mb-4">
                Specifically, regarding your Google Calendar data:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>We <strong>do not sell</strong> your Google user data to anyone</li>
                <li>We <strong>do not share</strong> your Google user data with advertisers or marketing companies</li>
                <li>We <strong>do not transfer</strong> your Google user data to third parties for purposes unrelated to the calendar functionality</li>
                <li>We <strong>do not use</strong> your Google user data for any purpose other than checking availability and creating/managing appointments</li>
                <li>We only access the minimum data necessary: calendar event times (to check availability) and the ability to create events (when appointments are booked)</li>
              </ul>
              <p className="text-muted-foreground mb-4">
                Your Google Calendar connection can be disconnected at any time from your Kentroi dashboard settings. Upon disconnection, we immediately invalidate the stored access tokens. You can also revoke access directly from your {' '}
                <a href="https://myaccount.google.com/permissions" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  Google Account permissions
                </a>.
              </p>

              <h3 className="text-xl font-medium mb-3">4.4 Anthropic (AI Chatbot)</h3>
              <p className="text-muted-foreground mb-4">
                Our AI chatbot is powered by Claude (Anthropic). Chat messages are processed by
                Anthropic&apos;s API. Anthropic&apos;s privacy policy: {' '}
                <a href="https://www.anthropic.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  anthropic.com/privacy
                </a>
              </p>

              <h3 className="text-xl font-medium mb-3">4.5 Vercel (Hosting)</h3>
              <p className="text-muted-foreground mb-4">
                Our service is hosted on Vercel. Vercel&apos;s privacy policy: {' '}
                <a href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate security measures including:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure token storage for calendar connections</li>
                <li>Regular security assessments</li>
              </ul>
              <p className="text-muted-foreground">
                However, no method of transmission over the Internet is 100% secure. We cannot
                guarantee absolute security of your data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground mb-4">
                We retain your data for as long as your account is active or as needed to provide
                services. You can request deletion of your account and associated data at any time.
              </p>
              <p className="text-muted-foreground">
                Appointment and form submission data is retained according to your subscription plan
                and can be exported or deleted upon request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Request export of your data</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Withdraw consent:</strong> Withdraw consent for calendar access at any time</li>
              </ul>
              <p className="text-muted-foreground">
                To exercise these rights, contact us at privacy@kentroi.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
              <p className="text-muted-foreground mb-4">
                We use essential cookies for authentication and session management. We do not use
                tracking cookies or sell your data to advertisers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Kentroi is not intended for use by children under 13. We do not knowingly
                collect data from children under 13. If you believe we have collected such data,
                please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-none pl-0 text-muted-foreground mt-4 space-y-1">
                <li>Email: privacy@kentroi.com</li>
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
