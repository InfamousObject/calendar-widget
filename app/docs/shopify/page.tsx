import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export default function ShopifyDocsPage() {
  const iframeCode = `<!-- Kentroi Booking Widget -->
<iframe
  src="https://kentroi.com/embed/booking/YOUR_WIDGET_ID"
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
          Shopify Installation
        </h1>
        <p className="text-lg text-muted-foreground">
          Add Kentroi booking widgets to your Shopify store.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <h2 className="font-semibold mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A Kentroi account with at least one appointment type configured</li>
          <li>A Shopify store with theme editing access</li>
          <li>Your Widget ID from the Kentroi dashboard</li>
        </ul>
      </div>

      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">
          Adding to a Shopify Page
        </h2>

        <StepList
          steps={[
            {
              title: 'Get Your Embed Code',
              description: 'Log in to your Kentroi dashboard and go to Embed Widget. Copy the iframe code for your booking widget.',
              content: (
                <Link href="/dashboard/embed" className="text-primary hover:underline">
                  Go to Embed Widget →
                </Link>
              ),
            },
            {
              title: 'Go to Shopify Pages',
              description: 'In your Shopify admin, navigate to Online Store > Pages.',
            },
            {
              title: 'Create or Edit a Page',
              description: 'Create a new page (e.g., "Book an Appointment") or edit an existing page where you want the widget.',
            },
            {
              title: 'Switch to HTML Editor',
              description: 'In the page editor, click the "</>" button to switch to HTML editing mode.',
            },
            {
              title: 'Paste the Embed Code',
              description: 'Paste your Kentroi iframe code:',
              content: <CodeBlock code={iframeCode} language="html" />,
            },
            {
              title: 'Save and Preview',
              description: 'Click Save and preview your page to see the booking widget.',
            },
          ]}
        />

        <Tip type="info">
          You can also add the widget to your theme using the theme editor. Go to Online Store {'>'} Themes {'>'} Customize and add a "Custom HTML" or "Custom Liquid" section.
        </Tip>
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Adding to Your Theme
        </h2>

        <StepList
          steps={[
            {
              title: 'Open Theme Customizer',
              description: 'Go to Online Store > Themes > Customize.',
            },
            {
              title: 'Add a Section',
              description: 'Click "Add section" and choose "Custom HTML" or "Custom Liquid" (depending on your theme).',
            },
            {
              title: 'Paste the Code',
              description: 'Paste your Kentroi embed code into the HTML/Liquid content area.',
            },
            {
              title: 'Position and Save',
              description: 'Drag the section to your desired position and click Save.',
            },
          ]}
        />
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Troubleshooting</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget looks squished</h3>
            <p className="text-sm text-muted-foreground">
              Some Shopify themes have container max-widths. Try removing the max-width style from the iframe,
              or adjust your theme's content width settings.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Page is blank after adding code</h3>
            <p className="text-sm text-muted-foreground">
              Make sure you're in HTML editing mode when pasting the code. If the page content disappears,
              undo the change and try again.
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Having trouble with your Shopify installation?
        </p>
        <a href="mailto:support@kentroi.com" className="text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
