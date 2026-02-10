import { Metadata } from 'next';
import Link from 'next/link';
import { Puzzle, Globe, Layout, Code, Layers, FileCode, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Documentation - Installation Guides',
  description:
    'Learn how to install and embed Kentroi scheduling widgets on WordPress, Shopify, Squarespace, Wix, Webflow, or any HTML website.',
  alternates: {
    canonical: 'https://www.kentroi.com/docs',
  },
  openGraph: {
    title: 'Documentation | Kentroi',
    description:
      'Step-by-step guides to install Kentroi on WordPress, Shopify, Squarespace, Wix, Webflow, and more.',
    url: 'https://www.kentroi.com/docs',
  },
};

const platforms = [
  {
    name: 'WordPress',
    description: 'Install using our official plugin or embed code',
    href: '/docs/wordpress',
    icon: Puzzle,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    name: 'Shopify',
    description: 'Add to your Shopify store theme',
    href: '/docs/shopify',
    icon: Globe,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    name: 'Squarespace',
    description: 'Embed in your Squarespace site',
    href: '/docs/squarespace',
    icon: Layout,
    color: 'bg-gray-500/10 text-gray-500',
  },
  {
    name: 'Wix',
    description: 'Add to your Wix website',
    href: '/docs/wix',
    icon: Layers,
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    name: 'Webflow',
    description: 'Integrate with your Webflow site',
    href: '/docs/webflow',
    icon: FileCode,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    name: 'HTML/JavaScript',
    description: 'Generic installation for any website',
    href: '/docs/html',
    icon: Code,
    color: 'bg-orange-500/10 text-orange-500',
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-4">
          Platform Installation Guides
        </h1>
        <p className="text-lg text-muted-foreground">
          Learn how to install and configure Kentroi booking widgets on your website.
          Choose your platform below for step-by-step instructions.
        </p>
      </div>

      {/* Quick Start */}
      <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
        <h2 className="font-semibold text-lg mb-2">Quick Start</h2>
        <p className="text-muted-foreground mb-4">
          The fastest way to get started is to copy your embed code from the dashboard.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Sign in to your <Link href="/dashboard" className="text-primary hover:underline">Kentroi dashboard</Link></li>
          <li>Go to <Link href="/dashboard/embed" className="text-primary hover:underline">Embed Widget</Link></li>
          <li>Copy the iframe code for your booking widget, contact form, or AI chatbot</li>
          <li>Paste it into your website's HTML</li>
        </ol>
      </div>

      {/* Platform Cards */}
      <div>
        <h2 className="font-display text-2xl font-semibold mb-6">Choose Your Platform</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((platform) => (
            <Link key={platform.name} href={platform.href}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all duration-200 group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color}`}>
                      <platform.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="font-display text-lg group-hover:text-primary transition-colors">
                      {platform.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="flex items-center justify-between">
                    {platform.description}
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <div>
        <h2 className="font-display text-2xl font-semibold mb-6">What You Can Embed</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Booking Widget</h3>
            <p className="text-sm text-muted-foreground">
              Let visitors book appointments directly on your website. They can see available times,
              choose an appointment type, and complete their booking without leaving your site.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">Contact Forms</h3>
            <p className="text-sm text-muted-foreground">
              Embed customizable contact forms to capture leads and inquiries.
              Forms can include custom fields and send notifications to your email.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border">
            <h3 className="font-semibold mb-1">AI Chatbot</h3>
            <p className="text-sm text-muted-foreground">
              Add an AI-powered chatbot that can answer questions, qualify leads, and help visitors
              book appointments. Available on Chatbot and Bundle plans.
            </p>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="p-6 rounded-xl bg-muted">
        <h2 className="font-semibold text-lg mb-2">Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Can't find what you're looking for? We're here to help.
        </p>
        <div className="flex gap-4">
          <a
            href="mailto:support@kentroi.com"
            className="text-sm text-primary hover:underline"
          >
            Contact Support
          </a>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
