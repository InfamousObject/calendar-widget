'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, ExternalLink, Check, Calendar, FileText, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Form {
  id: string;
  name: string;
}

interface AppointmentType {
  id: string;
  name: string;
}

export default function EmbedPage() {
  const [widgetId, setWidgetId] = useState<string>('');
  const [forms, setForms] = useState<Form[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const [hasChatbotAccess, setHasChatbotAccess] = useState(false);
  const [showLegacyBooking, setShowLegacyBooking] = useState(false);
  const [showLegacyForms, setShowLegacyForms] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user subscription info
      const userResponse = await fetch('/api/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const tier = userData.subscriptionTier || 'free';
        // Chatbot is available on 'chatbot' and 'bundle' tiers
        setHasChatbotAccess(tier === 'chatbot' || tier === 'bundle');
      }

      // Fetch widget ID and settings
      const settingsResponse = await fetch('/api/widget/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setWidgetId(settingsData.widgetId);
      }

      // Fetch forms
      const formsResponse = await fetch('/api/forms');
      if (formsResponse.ok) {
        const formsData = await formsResponse.json();
        setForms(formsData.forms.filter((f: any) => f.active));
      }

      // Fetch appointment types
      const typesResponse = await fetch('/api/appointment-types');
      if (typesResponse.ok) {
        const typesData = await typesResponse.json();
        // Handle both old and new API response format
        const types = typesData.appointmentTypes || typesData;
        setAppointmentTypes(Array.isArray(types) ? types.filter((t: any) => t.active) : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- SDK embed codes (new default) ---

  const getBookingEmbedCode = (appointmentTypeId?: string) => {
    const typeAttr = appointmentTypeId ? ` data-appointment-type="${appointmentTypeId}"` : '';
    return `<!-- Kentroi Booking Widget -->
<div data-kentroi-type="booking" data-widget-id="${widgetId}"${typeAttr}></div>
<script src="${origin}/embed.js" async></script>`;
  };

  const getFormEmbedCode = (formId: string) => {
    return `<!-- Kentroi Contact Form -->
<div data-kentroi-type="form" data-form-id="${formId}"></div>
<script src="${origin}/embed.js" async></script>`;
  };

  // --- Legacy iframe codes (kept as fallback) ---

  const getBookingIframeCode = (appointmentTypeId?: string) => {
    const url = appointmentTypeId
      ? `${origin}/embed/booking/${widgetId}?type=${appointmentTypeId}`
      : `${origin}/embed/booking/${widgetId}`;

    return `<!-- Kentroi Booking Embed (iframe) -->
<iframe
  src="${url}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; max-width: 800px;"
></iframe>`;
  };

  const getFormIframeCode = (formId: string) => {
    return `<!-- Kentroi Form Embed (iframe) -->
<iframe
  src="${origin}/embed/form/${formId}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; max-width: 600px;"
></iframe>`;
  };

  const getFloatingWidgetCode = () => {
    return `<!-- Kentroi Floating Chat Button -->
<script
  src="${origin}/widget.js"
  data-widget-id="${widgetId}"
  data-api-base="${origin}"
  async
></script>`;
  };

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openTestPage = (url: string) => {
    window.open(url, '_blank');
  };

  /** Reusable code block with copy button */
  const CodeBlock = ({ code, id, size = 'sm' }: { code: string; id: string; size?: 'sm' | 'xs' }) => (
    <div className="relative">
      <pre className={`bg-muted p-4 rounded-lg overflow-x-auto text-${size}`}>
        <code>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </>
        )}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-tight">Embed Your Widget</h1>
              </div>
              <p className="text-lg text-foreground-secondary font-light">
                Choose how you want to embed booking, forms, and AI chatbot on your website
              </p>
            </div>
            <Button
              onClick={() => openTestPage(`${origin}/demo/${widgetId}`)}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Demo
            </Button>
          </div>
        </div>

        {/* Widget ID */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Your Widget ID</CardTitle>
                <CardDescription className="text-base">
                  This unique ID identifies your widget configuration
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={widgetId} readOnly className="font-mono" />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(widgetId);
                  toast.success('Widget ID copied!');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Embed Options */}
        <Tabs defaultValue="booking" className="w-full">
          <TabsList className={`grid w-full ${hasChatbotAccess ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="booking">
              <Calendar className="h-4 w-4 mr-2" />
              Booking
            </TabsTrigger>
            <TabsTrigger value="forms">
              <FileText className="h-4 w-4 mr-2" />
              Contact Forms
            </TabsTrigger>
            {hasChatbotAccess && (
              <TabsTrigger value="chatbot">
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Chatbot
              </TabsTrigger>
            )}
          </TabsList>

          {/* Booking Embed */}
          <TabsContent value="booking" className="space-y-4">
            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">Booking Widget</CardTitle>
                    <CardDescription className="text-base">
                      Embed an inline booking widget on your website. Renders natively on the page with no iframe — auto-sizes to fit content.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointmentTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active appointment types found.</p>
                    <p className="text-sm mt-2">
                      Create an appointment type first in the{' '}
                      <a href="/dashboard/appointments" className="text-primary hover:underline">
                        Appointment Types
                      </a>{' '}
                      page.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* All Types */}
                    <div className="space-y-3">
                      <h4 className="font-medium">All Appointment Types</h4>
                      <CodeBlock code={getBookingEmbedCode()} id="booking-all" />
                      <Button
                        onClick={() => openTestPage(`${origin}/embed/booking/${widgetId}`)}
                        variant="outline"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>

                    {/* Individual Types */}
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium">Specific Appointment Type</h4>
                      <p className="text-sm text-muted-foreground">
                        Link directly to a specific appointment type
                      </p>
                      {appointmentTypes.map((type) => (
                        <Card key={type.id} className="border-border hover:border-primary/30 transition-all duration-200">
                          <CardHeader>
                            <CardTitle className="text-base font-display">{type.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <CodeBlock code={getBookingEmbedCode(type.id)} id={`booking-${type.id}`} size="xs" />
                            <Button
                              onClick={() => openTestPage(`${origin}/embed/booking/${widgetId}?type=${type.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Legacy iframe toggle */}
                    <div className="pt-4 border-t">
                      <button
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowLegacyBooking(!showLegacyBooking)}
                      >
                        {showLegacyBooking ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Legacy iframe embed
                      </button>
                      {showLegacyBooking && (
                        <div className="mt-3 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Use iframe embeds if the inline SDK doesn&apos;t work on your platform.
                          </p>
                          <CodeBlock code={getBookingIframeCode()} id="booking-iframe" size="xs" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Forms Embed */}
          <TabsContent value="forms" className="space-y-4">
            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">Contact Forms</CardTitle>
                    <CardDescription className="text-base">
                      Embed contact forms inline on your website. Renders natively with no iframe — auto-sizes to fit content.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {forms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active forms found.</p>
                    <p className="text-sm mt-2">
                      Create a contact form first in the{' '}
                      <a href="/dashboard/forms" className="text-primary hover:underline">
                        Contact Forms
                      </a>{' '}
                      page.
                    </p>
                  </div>
                ) : (
                  <>
                    {forms.map((form) => (
                      <Card key={form.id} className="border-border hover:border-primary/30 transition-all duration-200">
                        <CardHeader>
                          <CardTitle className="text-base font-display">{form.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <CodeBlock code={getFormEmbedCode(form.id)} id={`form-${form.id}`} />
                          <Button
                            onClick={() => openTestPage(`${origin}/embed/form/${form.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Legacy iframe toggle */}
                    <div className="pt-4 border-t">
                      <button
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowLegacyForms(!showLegacyForms)}
                      >
                        {showLegacyForms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Legacy iframe embed
                      </button>
                      {showLegacyForms && forms.length > 0 && (
                        <div className="mt-3 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Use iframe embeds if the inline SDK doesn&apos;t work on your platform.
                          </p>
                          <CodeBlock code={getFormIframeCode(forms[0].id)} id="form-iframe" size="xs" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Chatbot Embed */}
          {hasChatbotAccess && (
            <TabsContent value="chatbot" className="space-y-4">
            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="font-display text-xl">AI Chatbot</CardTitle>
                    <CardDescription className="text-base">
                      Add a floating chat button to your website. The chatbot can answer questions, qualify leads, and help book appointments.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Floating Chat Button</h4>
                  <p className="text-sm text-muted-foreground">
                    A floating button that appears on every page of your site, opening a chat popup when clicked. Visitors can chat without leaving your site.
                  </p>
                  <CodeBlock code={getFloatingWidgetCode()} id="chatbot-floating" />
                  <Button
                    onClick={() => openTestPage(`${origin}/widget/${widgetId}?view=chat`)}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>

        {/* Demo & Installation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <ExternalLink className="h-5 w-5 text-accent" />
                </div>
                <CardTitle className="font-display text-xl">Preview All Features</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                See all three features in action on our interactive demo page
              </p>
              <Button
                onClick={() => openTestPage(`${origin}/demo/${widgetId}`)}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Interactive Demo
              </Button>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs font-mono break-all">
                  {origin}/demo/{widgetId}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="font-display text-xl">Installation Instructions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>
                  <strong>Copy the embed code</strong>
                  <p className="text-muted-foreground ml-5 mt-1">
                    Choose the feature above and click &ldquo;Copy&rdquo;
                  </p>
                </li>
                <li>
                  <strong>Paste into your website</strong>
                  <p className="text-muted-foreground ml-5 mt-1">
                    Add the embed snippet to any HTML page
                  </p>
                </li>
                <li>
                  <strong>No configuration needed</strong>
                  <p className="text-muted-foreground ml-5 mt-1">
                    The widget auto-sizes and adapts to your page layout
                  </p>
                </li>
                <li>
                  <strong>Save and publish</strong>
                  <p className="text-muted-foreground ml-5 mt-1">
                    Widget appears on your live site immediately
                  </p>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
