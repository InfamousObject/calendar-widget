import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export const metadata: Metadata = {
  title: 'WordPress Installation Guide',
  description:
    'How to install the Kentroi scheduling widget on your WordPress site. Use our official plugin or embed code for easy setup.',
  alternates: {
    canonical: 'https://www.kentroi.com/docs/wordpress',
  },
  openGraph: {
    title: 'WordPress Installation Guide | Kentroi',
    description:
      'Step-by-step guide to install Kentroi scheduling widget on WordPress.',
    url: 'https://www.kentroi.com/docs/wordpress',
  },
};

export default function WordPressDocsPage() {
  const embedCode = `<!-- Kentroi Booking Widget -->
<div data-kentroi-type="booking" data-widget-id="YOUR_WIDGET_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`;

  const shortcodeExample = `[kentroi_booking]

<!-- Or for a specific appointment type -->
[kentroi_booking type="appointment_type_id"]`;

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Documentation
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-4">
          WordPress Installation
        </h1>
        <p className="text-lg text-muted-foreground">
          Install Kentroi on your WordPress site using our official plugin or embed code.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <h2 className="font-semibold mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A Kentroi account with at least one appointment type configured</li>
          <li>WordPress 5.0 or higher</li>
          <li>Administrator access to your WordPress site</li>
        </ul>
      </div>

      {/* Method 1: Plugin */}
      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Method 1: Official WordPress Plugin (Recommended)
        </h2>
        <p className="text-muted-foreground mb-6">
          Our WordPress plugin makes installation easy with a simple shortcode.
        </p>

        <StepList
          steps={[
            {
              title: 'Download the Plugin',
              description: 'Download our official WordPress plugin from your Kentroi dashboard.',
              content: (
                <Link
                  href="/dashboard/embed"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Get Plugin from Dashboard
                </Link>
              ),
            },
            {
              title: 'Upload to WordPress',
              description: 'In your WordPress admin, go to Plugins > Add New > Upload Plugin. Select the downloaded ZIP file and click "Install Now".',
            },
            {
              title: 'Activate the Plugin',
              description: 'After installation, click "Activate Plugin" to enable it.',
            },
            {
              title: 'Configure Settings',
              description: 'Go to Settings > Kentroi Booking and enter your Widget ID. You can find this in your Kentroi dashboard under Embed Widget.',
            },
            {
              title: 'Add the Shortcode',
              description: 'Use the shortcode in any page or post where you want the booking widget to appear.',
              content: <CodeBlock code={shortcodeExample} language="html" />,
            },
          ]}
        />

        <Tip type="info">
          The plugin also supports contact forms and AI chatbot. See the plugin settings for all available shortcodes.
        </Tip>
      </section>

      {/* Method 2: Embed Code */}
      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Method 2: Direct Embed Code
        </h2>
        <p className="text-muted-foreground mb-6">
          If you prefer not to use a plugin, you can embed the widget directly using our JavaScript SDK.
          The widget renders natively on your page — no iframe needed.
        </p>

        <StepList
          steps={[
            {
              title: 'Get Your Embed Code',
              description: 'Log in to your Kentroi dashboard and go to Embed Widget. Copy the embed snippet.',
              content: (
                <Link href="/dashboard/embed" className="text-primary hover:underline">
                  Go to Embed Widget →
                </Link>
              ),
            },
            {
              title: 'Add a Custom HTML Block',
              description: 'Edit the page where you want the widget. Add a "Custom HTML" block in the WordPress editor.',
            },
            {
              title: 'Paste the Embed Code',
              description: 'Paste your embed snippet into the Custom HTML block.',
              content: <CodeBlock code={embedCode} language="html" />,
            },
            {
              title: 'Save and Preview',
              description: 'Save your changes and preview the page. The widget auto-sizes to fit its content.',
            },
          ]}
        />
      </section>

      {/* Customization */}
      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Customization Options</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Specific Appointment Type</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Link directly to a specific appointment type by adding the <code>data-appointment-type</code> attribute:
            </p>
            <CodeBlock
              code={`<div data-kentroi-type="booking" data-widget-id="YOUR_WIDGET_ID" data-appointment-type="APPOINTMENT_TYPE_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`}
              language="html"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Contact Forms</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Embed a contact form by using <code>data-kentroi-type=&quot;form&quot;</code> with your Form ID:
            </p>
            <CodeBlock
              code={`<div data-kentroi-type="form" data-form-id="YOUR_FORM_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`}
              language="html"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Floating Chat Button</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Add the floating chat button to your site&apos;s footer template so it appears on every page:
            </p>
            <CodeBlock
              code={`<script src="https://www.kentroi.com/widget.js" data-widget-id="YOUR_WIDGET_ID" data-api-base="https://www.kentroi.com" async></script>`}
              language="html"
            />
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Troubleshooting</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget not appearing</h3>
            <p className="text-sm text-muted-foreground">
              Make sure your Widget ID is correct and your account is active. Check the browser console
              for errors. Some security plugins may block external scripts — add <code>kentroi.com</code> to
              your allowed domains if needed.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Script stripped by WordPress</h3>
            <p className="text-sm text-muted-foreground">
              WordPress may strip script tags in some editors. Make sure you&apos;re using a &quot;Custom HTML&quot;
              block, not a paragraph or text block. Alternatively, use the official plugin method above.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Calendar shows wrong timezone</h3>
            <p className="text-sm text-muted-foreground">
              The widget automatically detects the visitor's timezone. Make sure your availability
              settings in Kentroi are configured with the correct timezone for your business.
            </p>
          </div>
        </div>
      </section>

      {/* Need Help */}
      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Having trouble with your WordPress installation? We're here to help.
        </p>
        <a href="mailto:support@kentroi.com" className="text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
