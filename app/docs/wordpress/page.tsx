import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export default function WordPressDocsPage() {
  const iframeCode = `<!-- Kentroi Booking Widget -->
<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; max-width: 800px;"
></iframe>`;

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
          If you prefer not to use a plugin, you can embed the widget directly using an iframe.
        </p>

        <StepList
          steps={[
            {
              title: 'Get Your Embed Code',
              description: 'Log in to your Kentroi dashboard and go to Embed Widget. Copy the iframe code.',
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
              description: 'Paste your iframe code into the Custom HTML block.',
              content: <CodeBlock code={iframeCode} language="html" />,
            },
            {
              title: 'Save and Preview',
              description: 'Save your changes and preview the page to see your booking widget in action.',
            },
          ]}
        />
      </section>

      {/* Customization */}
      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Customization Options</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Adjusting Size</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Modify the width and height attributes in the iframe code:
            </p>
            <CodeBlock
              code={`<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
  width="100%"
  height="800"  <!-- Increase height for more space -->
  frameborder="0"
></iframe>`}
              language="html"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Specific Appointment Type</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Link directly to a specific appointment type by adding the type parameter:
            </p>
            <CodeBlock
              code={`<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID?type=APPOINTMENT_TYPE_ID"
  width="100%"
  height="600"
  frameborder="0"
></iframe>`}
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
              Make sure your Widget ID is correct and your account is active. Check that the iframe code
              wasn't modified by WordPress. Some themes may strip iframe tags - try using the plugin instead.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget appears too small</h3>
            <p className="text-sm text-muted-foreground">
              Increase the height value in the iframe code. A minimum of 600px is recommended for the
              full booking experience.
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
