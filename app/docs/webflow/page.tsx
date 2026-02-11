import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export const metadata: Metadata = {
  title: 'Webflow Installation Guide',
  description:
    'How to integrate the Kentroi booking widget with your Webflow site. Embed scheduling using custom code.',
  alternates: {
    canonical: 'https://www.kentroi.com/docs/webflow',
  },
  openGraph: {
    title: 'Webflow Installation Guide | Kentroi',
    description:
      'Step-by-step guide to integrate Kentroi booking widget with Webflow.',
    url: 'https://www.kentroi.com/docs/webflow',
  },
};

export default function WebflowDocsPage() {
  const embedCode = `<!-- Kentroi Booking Widget -->
<div data-kentroi-type="booking" data-widget-id="YOUR_WIDGET_ID"></div>
<script src="https://www.kentroi.com/embed.js" async></script>`;

  return (
    <div className="space-y-8">
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Documentation
      </Link>

      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-4">
          Webflow Installation
        </h1>
        <p className="text-lg text-muted-foreground">
          Integrate Kentroi booking widgets with your Webflow site.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <h2 className="font-semibold mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A Kentroi account with appointment types configured</li>
          <li>A Webflow site (any plan supports embeds)</li>
          <li>Your Widget ID from the Kentroi dashboard</li>
        </ul>
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Installation Steps
        </h2>

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
              title: 'Open the Designer',
              description: 'In Webflow, open your project in the Designer.',
            },
            {
              title: 'Add an Embed Element',
              description: 'From the Elements panel (or press A), drag an "Embed" element onto your page.',
            },
            {
              title: 'Paste the Code',
              description: 'Double-click the embed element and paste your embed snippet:',
              content: <CodeBlock code={embedCode} language="html" />,
            },
            {
              title: 'Style the Container',
              description: 'Select the embed element and use the Style panel to set width, margins, and alignment.',
            },
            {
              title: 'Publish',
              description: 'Click "Publish" to push your changes live.',
            },
          ]}
        />

        <Tip type="info">
          Webflow's embed element is powerful - you can also add custom CSS classes to style
          the container and ensure responsive behavior.
        </Tip>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Other Widgets
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Contact Form</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Embed a contact form using the same Embed element approach:
            </p>
            <CodeBlock
              code={`<div data-kentroi-type="form" data-form-id="YOUR_FORM_ID"></div>\n<script src="https://www.kentroi.com/embed.js" async></script>`}
              language="html"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Floating Chat Button</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Add this to your site&apos;s custom code (Project Settings {'>'} Custom Code {'>'} Footer Code)
              so it appears on every page:
            </p>
            <CodeBlock
              code={`<script src="https://www.kentroi.com/widget.js" data-widget-id="YOUR_WIDGET_ID" data-api-base="https://www.kentroi.com" async></script>`}
              language="html"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Responsive Behavior</h3>
            <p className="text-sm text-muted-foreground">
              The widget auto-sizes to fit its content and adapts to your container width.
              For better control, wrap the Embed element in a Div Block and set the
              div&apos;s max-width to your desired widget width.
            </p>
          </div>
        </div>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Troubleshooting</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Embed shows in Designer but not on published site</h3>
            <p className="text-sm text-muted-foreground">
              Make sure you've published after adding the embed. Also check that your Kentroi
              account is active and the Widget ID is correct.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget content is cut off</h3>
            <p className="text-sm text-muted-foreground">
              The widget auto-sizes, but the Webflow embed container may clip content.
              Make sure the embed element&apos;s overflow is set to &quot;visible&quot; in the Style panel.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Can't see embed in Designer preview</h3>
            <p className="text-sm text-muted-foreground">
              Webflow may not render external embeds in the Designer. Use the preview mode
              (eye icon) or publish to a staging URL to test.
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Having trouble with your Webflow installation?
        </p>
        <a href="mailto:support@kentroi.com" className="text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
