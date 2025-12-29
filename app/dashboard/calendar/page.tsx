'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Check, Trash2 } from 'lucide-react';

interface CalendarConnection {
  id: string;
  provider: string;
  email: string;
  isPrimary: boolean;
  createdAt: string;
  expiresAt: string;
}

export default function CalendarPage() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchConnections();

    // Handle OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      alert('Google Calendar connected successfully!');
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
      alert(errorMessages[error] || 'An error occurred. Please try again.');
      window.history.replaceState({}, '', '/dashboard/calendar');
    }
  }, [searchParams]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/calendar/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    // Redirect to Google OAuth flow
    window.location.href = '/api/calendar/connect';
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/calendar/disconnect?id=${connectionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await fetchConnections();
      } else {
        alert('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      alert('Failed to disconnect calendar');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const hasGoogleConnection = connections.some((c) => c.provider === 'google');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Calendar Integration</h2>
        <p className="text-muted-foreground">
          Connect your calendar to sync appointments and check for conflicts
        </p>
      </div>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>
                  Sync appointments with your Google Calendar
                </CardDescription>
              </div>
            </div>
            {!hasGoogleConnection && (
              <Button onClick={handleConnect}>Connect Google Calendar</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No calendar connections yet. Click the button above to connect your
              Google Calendar.
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{connection.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Connected {new Date(connection.createdAt).toLocaleDateString()}
                        {connection.isPrimary && ' • Primary'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(connection.id)}
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
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Microsoft Outlook</CardTitle>
                <CardDescription>
                  Sync with Outlook Calendar (Coming Soon)
                </CardDescription>
              </div>
            </div>
            <Button disabled>Coming Soon</Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
