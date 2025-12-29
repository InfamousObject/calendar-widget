'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, MessageSquare, Users, Copy, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    appointments: 0,
    forms: 0,
    submissions: 0,
    conversations: 0,
  });
  const [widgetId, setWidgetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchDashboardData();
      fetchRecentBookings();

      // Poll for new bookings every 30 seconds
      const interval = setInterval(fetchRecentBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          appointments: data.appointmentsCount,
          forms: data.formsCount,
          submissions: data.submissionsCount,
          conversations: 0,
        });
        setWidgetId(data.widgetId);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const response = await fetch('/api/appointments/notifications');
      if (response.ok) {
        const data = await response.json();
        setRecentBookings(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const copyBookingUrl = () => {
    const url = `${window.location.origin}/book/${widgetId}`;
    navigator.clipboard.writeText(url);
    alert('Copied to clipboard!');
  };

  const openBookingPage = () => {
    window.open(`/book/${widgetId}`, '_blank');
  };

  if (!session) {
    return null;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Appointments',
      value: stats.appointments,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      title: 'Contact Forms',
      value: stats.forms,
      icon: FileText,
      color: 'text-green-500',
    },
    {
      title: 'Form Submissions',
      value: stats.submissions,
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: 'Conversations',
      value: stats.conversations,
      icon: MessageSquare,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name}!
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your SmartWidget account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings Notifications */}
      {recentBookings.filter((b) => b.isNew).length > 0 && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              New Bookings! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings
                .filter((b) => b.isNew)
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start justify-between rounded-lg border bg-white dark:bg-gray-900 p-4"
                  >
                    <div>
                      <p className="font-medium">{booking.visitorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.appointmentType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startTime).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        (window.location.href = '/dashboard/bookings')
                      }
                    >
                      View
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Link Card */}
      {widgetId && (
        <Card>
          <CardHeader>
            <CardTitle>Your Booking Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Share this link for customers to book appointments:
              </p>
              <div className="flex gap-2">
                <code className="flex-1 rounded-md bg-muted p-3 text-sm overflow-x-auto">
                  {`${window.location.origin}/book/${widgetId}`}
                </code>
                <Button variant="outline" size="sm" onClick={copyBookingUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={openBookingPage}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Widget ID for embedding:
              </p>
              <code className="block rounded-md bg-muted p-3 text-sm">
                {widgetId}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/appointments"
              className="flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors hover:bg-accent"
            >
              <Calendar className="mb-2 h-8 w-8 text-primary" />
              <span className="font-medium">Manage Appointments</span>
            </a>
            <a
              href="/dashboard/forms"
              className="flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors hover:bg-accent"
            >
              <FileText className="mb-2 h-8 w-8 text-primary" />
              <span className="font-medium">Create Form</span>
            </a>
            <a
              href="/dashboard/widget"
              className="flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors hover:bg-accent"
            >
              <MessageSquare className="mb-2 h-8 w-8 text-primary" />
              <span className="font-medium">Customize Widget</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
