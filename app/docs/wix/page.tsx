import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export default function WixDocsPage() {
  const iframeCode = `<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none;"
></iframe>`;

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
              description: 'Log in to your Kentroi dashboard and go to Embed Widget. Copy the iframe code.',
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
              description: 'Click "Enter Code" on the embed element and select "Code" tab. Paste your iframe:',
              content: <CodeBlock code={iframeCode} language="html" />,
            },
            {
              title: 'Resize and Position',
              description: 'Drag the corners of the embed to resize it. Position it where you want on your page.',
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
          Using Wix's iFrame Element
        </h2>

        <StepList
          steps={[
            {
              title: 'Add iFrame Element',
              description: 'Click "+" > "Embed Code" > "iFrame". This adds a dedicated iframe element.',
            },
            {
              title: 'Enter the URL',
              description: 'In the settings, paste your Kentroi embed URL:',
              content: (
                <CodeBlock
                  code="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
                  language="text"
                />
              ),
            },
            {
              title: 'Adjust Size',
              description: 'Set the width to 100% and height to at least 600px for best results.',
            },
          ]}
        />
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
              Resize the HTML embed element to make it taller. Click and drag the corners or
              set a specific height in the element settings.
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
