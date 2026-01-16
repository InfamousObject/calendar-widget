'use client';
// Force dynamic rendering to avoid useSearchParams() prerender errors
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Trash2, CalendarCheck, AlertCircle, Zap, Link2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CalendarConnection {
  id: string;
  provider: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
  expiresAt: string;
  source?: 'clerk' | 'manual';
}

interface CalendarStatus {
  connected: boolean;
  source?: 'clerk' | 'manual';
  email?: string;
  hasGoogleSignIn: boolean;
  hasCalendarScopes: boolean;
  canAutoConnect: boolean;
}

function CalendarContent() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoConnecting, setAutoConnecting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchData();

    // Handle OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast.success('Google Calendar connected successfully!');
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/calendar');
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Access denied. Please try again.',
        missing_params: 'Missing parameters. Please try again.',
        user_not_found: 'User not found.',
        no_tokens: 'Failed to get access tokens.',
        no_calendar: 'No calendar found.',
        callback_failed: 'OAuth callback failed. Please try again.',
      };
      toast.error(errorMessages[error] || 'An error occurred. Please try again.');
      window.history.replaceState({}, '', '/dashboard/calendar');
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      // Fetch both connections and status in parallel
      const [connectionsRes, statusRes] = await Promise.all([
        fetch('/api/calendar/connections'),
        fetch('/api/calendar/status'),
      ]);

      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(data);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to Google OAuth flow
    window.location.href = '/api/calendar/connect';
  };

  const handleAutoConnect = async () => {
    setAutoConnecting(true);
    try {
      const response = await fetch('/api/calendar/auto-connect', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Google Calendar connected using your Google sign-in!');
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to auto-connect calendar');
      }
    } catch (error) {
      console.error('Error auto-connecting:', error);
      toast.error('Failed to auto-connect calendar');
    } finally {
      setAutoConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    const confirmDisconnect = window.confirm('Are you sure you want to disconnect this calendar?');
    if (!confirmDisconnect) {
      return;
    }

    try {
      const response = await fetch(
        `/api/calendar/disconnect?id=${connectionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Calendar disconnected successfully');
        await fetchData();
      } else {
        toast.error('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    );
  }

  const hasGoogleConnection = connections.some((c) => c.provider === 'google');

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
        <div className="gradient-mesh absolute inset-0 -z-10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <CalendarCheck className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Calendar Integration</h2>
          </div>
          <p className="text-lg text-foreground-secondary font-light">
            Connect your calendar to sync appointments and check for conflicts
          </p>
        </div>
      </div>

      {/* Google Calendar */}
      <Card className="border-border hover:border-primary/30 transition-all duration-300 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 shadow-sm">
                <Calendar className="h-7 w-7 text-blue-500" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl mb-1">Google Calendar</CardTitle>
                <CardDescription className="text-base">
                  Sync appointments with your Google Calendar
                </CardDescription>
              </div>
            </div>
            {!hasGoogleConnection && (
              <div className="flex items-center gap-3">
                {status?.canAutoConnect && (
                  <Button
                    onClick={handleAutoConnect}
                    disabled={autoConnecting}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                    size="lg"
                  >
                    {autoConnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Auto-connect
                  </Button>
                )}
                <Button
                  onClick={handleConnect}
                  variant={status?.canAutoConnect ? 'outline' : 'default'}
                  className={status?.canAutoConnect
                    ? 'hover:border-blue-500 hover:text-blue-500 transition-all duration-300'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300'
                  }
                  size="lg"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {status?.canAutoConnect ? 'Manual Connect' : 'Connect Google Calendar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-muted/30 border-2 border-dashed border-muted-foreground/25">
              <div className="p-3 rounded-xl bg-blue-500/10 inline-flex mb-3">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm text-foreground-secondary max-w-md mx-auto">
                No calendar connections yet. Click the button above to connect your Google Calendar and start syncing appointments.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection, index) => (
                <div
                  key={connection.id}
                  className="group flex items-center justify-between rounded-xl border border-border p-5 hover:border-success/30 hover:shadow-md hover:shadow-success/5 transition-all duration-300 animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 shadow-sm transition-transform duration-200 group-hover:scale-110">
                      <Check className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{connection.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-foreground-secondary">
                          Connected {new Date(connection.createdAt).toLocaleDateString()}
                        </p>
                        {connection.isPrimary && (
                          <Badge variant="default" className="text-xs">
                            Primary
                          </Badge>
                        )}
                        {connection.source === 'clerk' ? (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <Link2 className="h-3 w-3 mr-1" />
                            Google Sign-in
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Manual
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(connection.id)}
                    className="hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coming Soon - Outlook */}
      <Card className="relative border-border opacity-60">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-[1px] rounded-xl" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/10 shadow-sm">
                <Calendar className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl mb-1 flex items-center gap-2">
                  Microsoft Outlook
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Sync with Outlook Calendar
                </CardDescription>
              </div>
            </div>
            <Button disabled className="opacity-50">
              <AlertCircle className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}
