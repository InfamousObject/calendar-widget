'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, MessageSquare, Loader2 } from 'lucide-react';

interface WidgetConfig {
  widgetId: string;
  businessName: string;
  logoUrl?: string;
  features: {
    forms: Array<{
      id: string;
      name: string;
    }>;
  };
}

export default function DemoPage() {
  const params = useParams();
  const widgetId = params.widgetId as string;
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/widget/config?widgetId=${widgetId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading widget config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the first form ID for demo purposes
  const firstFormId = config?.features?.forms?.[0]?.id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading demo...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Widget not found</h1>
          <p className="text-muted-foreground">The widget ID you provided is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          {config.logoUrl && (
            <img
              src={config.logoUrl}
              alt={config.businessName}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-4xl font-bold mb-2">{config.businessName}</h1>
          <p className="text-xl text-muted-foreground">
            Interactive Demo - All Features
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Explore our appointment booking, contact forms, and AI chatbot
          </p>
        </div>

        {/* Demo Cards */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="all">All Features</TabsTrigger>
            <TabsTrigger value="booking">
              <Calendar className="h-4 w-4 mr-2" />
              Booking
            </TabsTrigger>
            <TabsTrigger value="forms">
              <FileText className="h-4 w-4 mr-2" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="chatbot">
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Chat
            </TabsTrigger>
          </TabsList>

          {/* All Features View */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Booking Card */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Appointment Booking</CardTitle>
                  </div>
                  <CardDescription>
                    Schedule appointments instantly with our easy-to-use booking system
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <iframe
                    src={`${origin}/embed/booking/${widgetId}`}
                    className="w-full h-[500px] border-0 rounded-lg"
                    title="Appointment Booking"
                  />
                </CardContent>
              </Card>

              {/* Contact Form Card */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Contact Forms</CardTitle>
                  </div>
                  <CardDescription>
                    Get in touch with us using our customizable contact forms
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {firstFormId ? (
                    <iframe
                      src={`${origin}/embed/form/${firstFormId}`}
                      className="w-full h-[500px] border-0 rounded-lg"
                      title="Contact Forms"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                      <p>No forms available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Chatbot Card */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle>AI Chatbot</CardTitle>
                  </div>
                  <CardDescription>
                    Chat with our AI assistant for instant help and support
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <iframe
                    src={`${origin}/widget/${widgetId}?view=chat`}
                    className="w-full h-[500px] border-0 rounded-lg"
                    title="AI Chatbot"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Individual Feature Views */}
          <TabsContent value="booking">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Appointment Booking</CardTitle>
                    <CardDescription className="mt-1">
                      Browse available time slots and book your appointment in seconds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <iframe
                  src={`${origin}/embed/booking/${widgetId}`}
                  className="w-full h-[700px] border-0 rounded-lg"
                  title="Appointment Booking"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Contact Forms</CardTitle>
                    <CardDescription className="mt-1">
                      Fill out our contact form to get in touch with us
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {firstFormId ? (
                  <iframe
                    src={`${origin}/embed/form/${firstFormId}`}
                    className="w-full h-[700px] border-0 rounded-lg"
                    title="Contact Forms"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[700px] text-muted-foreground">
                    <p>No forms available. Create a form in your dashboard to see it here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chatbot">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">AI-Powered Chatbot</CardTitle>
                    <CardDescription className="mt-1">
                      Get instant answers, book appointments, and more through conversation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex justify-center">
                <iframe
                  src={`${origin}/widget/${widgetId}?view=chat`}
                  className="w-full max-w-2xl h-[700px] border-0 rounded-lg shadow-xl"
                  title="AI Chatbot"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Smart Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Real-time availability</li>
                <li>✓ Calendar integration</li>
                <li>✓ Automatic reminders</li>
                <li>✓ Buffer time management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Custom Forms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Drag-and-drop builder</li>
                <li>✓ Custom fields</li>
                <li>✓ Email notifications</li>
                <li>✓ Submission tracking</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Natural conversation</li>
                <li>✓ Knowledge base integration</li>
                <li>✓ Lead qualification</li>
                <li>✓ Appointment booking</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-12 pb-8">
          <p>Powered by {config.businessName}</p>
        </div>
      </div>
    </div>
  );
}
