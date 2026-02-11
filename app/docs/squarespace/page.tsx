import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CodeBlock } from '@/components/docs/code-block';
import { StepList, Tip } from '@/components/docs/step-list';

export const metadata: Metadata = {
  title: 'Squarespace Installation Guide',
  description:
    'How to embed the Kentroi booking widget on your Squarespace website. Quick setup with code injection.',
  alternates: {
    canonical: 'https://www.kentroi.com/docs/squarespace',
  },
  openGraph: {
    title: 'Squarespace Installation Guide | Kentroi',
    description:
      'Step-by-step guide to embed Kentroi booking widget on Squarespace.',
    url: 'https://www.kentroi.com/docs/squarespace',
  },
};

export default function SquarespaceDocsPage() {
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
          Squarespace Installation
        </h1>
        <p className="text-lg text-muted-foreground">
          Embed Kentroi booking widgets on your Squarespace website.
        </p>
      </div>

      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <h2 className="font-semibold mb-2">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A Kentroi account with appointment types configured</li>
          <li>A Squarespace Business plan or higher (for code blocks)</li>
          <li>Your Widget ID from the Kentroi dashboard</li>
        </ul>
      </div>

      <Tip type="warning">
        Squarespace requires a Business plan or higher to add custom code/embed blocks.
        Personal plans cannot use iframe embeds.
      </Tip>

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
              title: 'Edit Your Page',
              description: 'In Squarespace, navigate to the page where you want to add the booking widget and click Edit.',
            },
            {
              title: 'Add a Code Block',
              description: 'Click the "+" button where you want the widget and select "Code" from the block options.',
            },
            {
              title: 'Paste the Embed Code',
              description: 'Paste your Kentroi embed snippet into the code block. Make sure "Display Source" is unchecked.',
              content: <CodeBlock code={embedCode} language="html" />,
            },
            {
              title: 'Apply and Save',
              description: 'Click Apply, then Save your page. The widget renders natively and auto-sizes to fit.',
            },
          ]}
        />
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">
          Using Embed Blocks (Alternative)
        </h2>
        <p className="text-muted-foreground mb-4">
          You can also use Squarespace's Embed block feature:
        </p>

        <StepList
          steps={[
            {
              title: 'Add an Embed Block',
              description: 'In page edit mode, click "+" and select "Embed" instead of "Code".',
            },
            {
              title: 'Choose Code Snippet',
              description: 'Click the embed block and select "Code Snippet" in the editor.',
            },
            {
              title: 'Paste and Apply',
              description: 'Paste your iframe code and click "Set". Save your changes.',
            },
          ]}
        />
      </section>

      <section className="pt-8 border-t border-border">
        <h2 className="font-display text-2xl font-semibold mb-4">Troubleshooting</h2>

        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Code block option not available</h3>
            <p className="text-sm text-muted-foreground">
              You need a Squarespace Business plan or higher to use code blocks.
              Upgrade your plan to add custom embeds.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget shows as code instead of rendering</h3>
            <p className="text-sm text-muted-foreground">
              Make sure "Display Source" is unchecked in the code block settings.
              Also ensure you're using a Code block, not a Text block.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Widget spacing looks off</h3>
            <p className="text-sm text-muted-foreground">
              Squarespace may add extra padding around code blocks. Adjust the block&apos;s
              spacing settings in the editor to control the surrounding whitespace.
            </p>
          </div>
        </div>
      </section>

      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Having trouble with your Squarespace installation?
        </p>
        <a href="mailto:support@kentroi.com" className="text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}
