import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export const metadata: Metadata = {
  title: 'Wix Installation Guide',
  description:
    'How to add the Kentroi booking widget to your Wix website. Simple embed setup using the Wix HTML widget.',
  alternates: {
    canonical: 'https://www.kentroi.com/docs/wix',
  },
  openGraph: {
    title: 'Wix Installation Guide | Kentroi',
    description:
      'Step-by-step guide to add Kentroi booking widget to your Wix website.',
    url: 'https://www.kentroi.com/docs/wix',
  },
};

export default function WixDocsPage() {
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
          Wix Installation
        </h1>
        <p className="text-lg text-muted-foreground">
          Add Kentroi booking widgets to your Wix website.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <h2 className="font-semibold mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A Kentroi account with appointment types configured</li>
          <li>A Wix website with editing access</li>
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
              title: 'Open Wix Editor',
              description: 'Go to your Wix dashboard and click "Edit Site" to open the Wix Editor.',
            },
            {
              title: 'Add an HTML Embed',
              description: 'Click the "+" button on the left sidebar, then select "Embed Code" > "Embed HTML".',
            },
            {
              title: 'Enter the Code',
              description: 'Click "Enter Code" on the embed element and select "Code" tab. Paste your embed snippet:',
              content: <CodeBlock code={embedCode} language="html" />,
            },
            {
              title: 'Position the Element',
              description: 'Position the embed element where you want on your page. The widget auto-sizes to fit its content.',
            },
            {
              title: 'Publish',
              description: 'Click "Publish" in the top right to make your changes live.',
            },
          ]}
        />

        <Tip type="info">
          In Wix, you can also use the "iframe" element directly. Search for "iframe" in the Add menu
          and paste just the src URL.
        </Tip>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Adding Other Widgets
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Contact Form</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Use the same HTML embed method with a form snippet:
            </p>
            <CodeBlock
              code={`<div data-kentroi-type="form" data-form-id="YOUR_FORM_ID"></div>\n<script src="https://www.kentroi.com/embed.js" async></script>`}
              language="html"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Floating Chat Button</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Add this to your site&apos;s global custom code (Settings {'>'} Custom Code {'>'} Footer):
            </p>
            <CodeBlock
              code={`<script src="https://www.kentroi.com/widget.js" data-widget-id="YOUR_WIDGET_ID" data-api-base="https://www.kentroi.com" async></script>`}
              language="html"
            />
          </div>
        </div>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Troubleshooting</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Embed not showing</h3>
            <p className="text-sm text-muted-foreground">
              Make sure you've published your site after adding the embed. Preview mode may not
              always show embeds correctly.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget is cut off</h3>
            <p className="text-sm text-muted-foreground">
              Resize the HTML embed element to give it enough space. The widget auto-sizes
              its content but the Wix container may need to be taller.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Mobile display issues</h3>
            <p className="text-sm text-muted-foreground">
              Use Wix's mobile editor to adjust the embed size for mobile devices separately.
              Click the mobile icon in the editor to switch views.
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Having trouble with your Wix installation?
        </p>
        <a href="mailto:support@kentroi.com" className="text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
