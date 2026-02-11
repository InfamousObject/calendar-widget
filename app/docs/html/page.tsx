import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export const metadata: Metadata = {
  title: 'HTML/JavaScript Installation Guide',
  description:
    'How to embed the Kentroi booking widget on any HTML website using iframe or JavaScript. Works with any platform.',
  alternates: {
    canonical: 'https://www.kentroi.com/docs/html',
  },
  openGraph: {
    title: 'HTML/JavaScript Installation Guide | Kentroi',
    description:
      'Embed Kentroi scheduling widget on any website using HTML iframe or JavaScript.',
    url: 'https://www.kentroi.com/docs/html',
  },
};

export default function HtmlDocsPage() {
  const bookingEmbed = `<!-- Kentroi Booking Widget -->
<div data-kentroi-type="booking" data-widget-id="YOUR_WIDGET_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`;

  const specificType = `<!-- Kentroi Booking Widget — specific appointment type -->
<div data-kentroi-type="booking" data-widget-id="YOUR_WIDGET_ID" data-appointment-type="APPOINTMENT_TYPE_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`;

  const formEmbed = `<!-- Kentroi Contact Form -->
<div data-kentroi-type="form" data-form-id="YOUR_FORM_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`;

  const floatingChat = `<!-- Kentroi Floating Chat Button -->
<script
  src="https://www.kentroi.com/widget.js"
  data-widget-id="YOUR_WIDGET_ID"
  data-api-base="https://www.kentroi.com"
  async
></script>`;

  const legacyIframe = `<!-- Legacy iframe embed (use if SDK doesn't work on your platform) -->
<iframe
  src="https://www.kentroi.com/embed/booking/YOUR_WIDGET_ID"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; max-width: 800px;"
></iframe>`;

  return (
    <div className="space-y-8">
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Documentation
      </Link>

      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-4">
          HTML/JavaScript Installation
        </h1>
        <p className="text-lg text-muted-foreground">
          Universal installation guide for any website that supports HTML.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <h2 className="font-semibold mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A Kentroi account with features configured</li>
          <li>Access to edit your website's HTML</li>
          <li>Your Widget ID and Form IDs from the dashboard</li>
        </ul>
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Booking Widget
        </h2>
        <p className="text-muted-foreground mb-4">
          Add a booking widget that renders natively on your page. Copy this code and
          replace YOUR_WIDGET_ID with your actual Widget ID from the dashboard.
        </p>

        <CodeBlock code={bookingEmbed} language="html" filename="index.html" />

        <Tip type="info">
          Get your Widget ID from the{' '}
          <Link href="/dashboard/embed" className="text-primary hover:underline">
            Embed Widget
          </Link>{' '}
          page in your dashboard. The widget auto-sizes to fit its content — no height configuration needed.
        </Tip>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Specific Appointment Type
        </h2>
        <p className="text-muted-foreground mb-4">
          To link directly to a specific appointment type, add the <code>data-appointment-type</code> attribute:
        </p>

        <CodeBlock code={specificType} language="html" />

        <p className="text-sm text-muted-foreground mt-2">
          Find your appointment type IDs in your dashboard under Appointment Types.
        </p>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Contact Forms
        </h2>
        <p className="text-muted-foreground mb-4">
          Embed individual contact forms using their Form ID:
        </p>

        <CodeBlock code={formEmbed} language="html" />
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          AI Chatbot (Floating Button)
        </h2>
        <p className="text-muted-foreground mb-4">
          Add a floating chat button that appears on every page. When clicked, it opens
          an AI chatbot popup. Requires a Chatbot or Bundle plan.
        </p>

        <CodeBlock code={floatingChat} language="html" />

        <Tip type="info">
          Place this script once in your site&apos;s footer or layout template. It will
          appear as a floating button in the bottom-right corner of every page.
        </Tip>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          How It Works
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Shadow DOM Isolation</h3>
            <p className="text-sm text-muted-foreground">
              The booking and form widgets use Shadow DOM to render directly on your page
              while remaining completely isolated from your site&apos;s CSS. Your styles won&apos;t
              affect the widget, and the widget won&apos;t affect your page.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Auto-Sizing</h3>
            <p className="text-sm text-muted-foreground">
              Widgets automatically size themselves to fit their content. No need to
              configure width or height — they adapt to your page layout.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Multiple Widgets</h3>
            <p className="text-sm text-muted-foreground">
              You can place multiple widgets on the same page. The <code>embed.js</code> script
              only needs to be included once — it will initialize all widgets automatically.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Widget Appearance</h3>
            <p className="text-sm text-muted-foreground">
              Customize colors, fonts, and branding in your Kentroi dashboard under
              Widget Customize. Changes apply automatically to all embeds.
            </p>
          </div>
        </div>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Legacy iframe Embed
        </h2>
        <p className="text-muted-foreground mb-4">
          If the JavaScript SDK doesn&apos;t work on your platform, you can fall back to an iframe embed:
        </p>

        <CodeBlock code={legacyIframe} language="html" />

        <p className="text-sm text-muted-foreground mt-2">
          Adjust the <code>height</code> attribute as needed. A minimum of 600px is recommended.
        </p>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Troubleshooting</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget not loading</h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Verify your Widget ID is correct</li>
              <li>Check that your Kentroi account is active</li>
              <li>Ensure the page is served over HTTPS</li>
              <li>Check browser console for errors</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget is blocked by Content Security Policy</h3>
            <p className="text-sm text-muted-foreground">
              If your site has a strict CSP, add <code>kentroi.com</code> to your <code>script-src</code> and <code>connect-src</code> directives:
            </p>
            <CodeBlock code={`script-src 'self' https://www.kentroi.com;\nconnect-src 'self' https://www.kentroi.com;`} language="text" />
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget appears unstyled</h3>
            <p className="text-sm text-muted-foreground">
              The widget uses Shadow DOM for style isolation. If it appears unstyled, check that
              JavaScript is enabled and the <code>embed.js</code> script loaded successfully.
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Can't get your embed working? We're here to help.
        </p>
        <a href="mailto:support@kentroi.com" className="text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
