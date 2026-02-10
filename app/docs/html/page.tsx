import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export default function HtmlDocsPage() {
  const basicIframe = `<!-- Kentroi Booking Widget -->
<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; max-width: 800px;"
></iframe>`;

  const responsiveWrapper = `<div style="max-width: 800px; margin: 0 auto;">
  <iframe
    src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
    width="100%"
    height="600"
    frameborder="0"
    style="border: none;"
  ></iframe>
</div>`;

  const specificType = `<!-- Link to specific appointment type -->
<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID?type=APPOINTMENT_TYPE_ID"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none;"
></iframe>`;

  const formEmbed = `<!-- Kentroi Contact Form -->
<iframe
  src="https://kentroi.com/embed/form/YOUR_FORM_ID"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; max-width: 600px;"
></iframe>`;

  const chatbotEmbed = `<!-- Kentroi AI Chatbot -->
<iframe
  src="https://kentroi.com/widget/YOUR_WIDGET_ID?view=chat"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; max-width: 500px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
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
          Basic Booking Widget
        </h2>
        <p className="text-muted-foreground mb-4">
          The simplest way to add a booking widget is with an iframe. Copy this code and
          replace YOUR_WIDGET_ID with your actual Widget ID from the dashboard.
        </p>

        <CodeBlock code={basicIframe} language="html" filename="index.html" />

        <Tip type="info">
          Get your Widget ID from the{' '}
          <Link href="/dashboard/embed" className="text-primary hover:underline">
            Embed Widget
          </Link>{' '}
          page in your dashboard.
        </Tip>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Responsive Wrapper
        </h2>
        <p className="text-muted-foreground mb-4">
          For better centering and responsive behavior, wrap the iframe in a container:
        </p>

        <CodeBlock code={responsiveWrapper} language="html" />
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Specific Appointment Type
        </h2>
        <p className="text-muted-foreground mb-4">
          To link directly to a specific appointment type, add the type parameter:
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
          AI Chatbot
        </h2>
        <p className="text-muted-foreground mb-4">
          Add the AI chatbot (requires Chatbot or Bundle plan):
        </p>

        <CodeBlock code={chatbotEmbed} language="html" />
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Customization Options
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Adjusting Size</h3>
            <p className="text-sm text-muted-foreground">
              Modify the <code>width</code> and <code>height</code> attributes. Use
              percentages for responsive width and fixed pixels for height.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Styling the Container</h3>
            <p className="text-sm text-muted-foreground">
              Add CSS to the wrapper div for borders, shadows, or rounded corners. The
              iframe itself can also accept inline styles.
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
              If your site has a strict CSP, add <code>kentroi.com</code> to your frame-src directive:
            </p>
            <CodeBlock code="frame-src 'self' https://kentroi.com;" language="text" />
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Scrolling issues</h3>
            <p className="text-sm text-muted-foreground">
              Add <code>scrolling="yes"</code> to the iframe if you see scrollbar issues,
              or adjust the height to fit all content without scrolling.
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
