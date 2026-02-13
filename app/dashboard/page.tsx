'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, MessageSquare, Users, Copy, ExternalLink, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { SetupChecklist } from '@/components/dashboard/setup-checklist';
import { trackConversion } from '@/lib/analytics/track';

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [stats, setStats] = useState({
    appointments: 0,
    forms: 0,
    submissions: 0,
    conversations: 0,
  });
  const [widgetId, setWidgetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // Track sign_up conversion when arriving from registration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'true') {
      trackConversion('sign_up', { method: 'clerk' });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchDashboardData();
      fetchRecentBookings();

      // Poll for new bookings every 30 seconds
      const interval = setInterval(fetchRecentBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn]);

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
    toast.success('Copied to clipboard!', {
      description: 'Share this link with your customers',
    });
  };

  const openBookingPage = () => {
    window.open(`/book/${widgetId}`, '_blank');
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-32 rounded-2xl bg-muted" />

        {/* Stats skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
      </div>
    );
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
    <div className="space-y-8">
      {/* Welcome Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
        <div className="gradient-mesh absolute inset-0 -z-10" />

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-semibold tracking-tight mb-3">
            Welcome back, {user?.firstName || user?.fullName || 'there'}
          </h2>
          <p className="text-lg text-foreground-secondary font-light">
            {recentBookings.filter(b => b.isNew).length > 0
              ? `You have ${recentBookings.filter(b => b.isNew).length} new booking${recentBookings.filter(b => b.isNew).length !== 1 ? 's' : ''} waiting for you`
              : "Here's your scheduling overview for today"}
          </p>
        </div>
      </div>

      {/* Setup Checklist */}
      <SetupChecklist />

      {/* Enhanced Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground-secondary">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-${stat.color}/10 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display tracking-tight">
                  {stat.value}
                </div>
              </CardContent>

              {/* Subtle gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings with Enhanced Design */}
      {recentBookings.filter((b) => b.isNew).length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-display">New Bookings</CardTitle>
                  <p className="text-sm text-foreground-secondary mt-1">
                    {recentBookings.filter((b) => b.isNew).length} appointment{recentBookings.filter((b) => b.isNew).length !== 1 ? 's' : ''} pending review
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings
                .filter((b) => b.isNew)
                .map((booking, index) => (
                  <div
                    key={booking.id}
                    className="group flex items-start justify-between rounded-xl border border-border bg-surface p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar placeholder */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white font-semibold text-sm">
                        {booking.visitorName.split(' ').map((n: string) => n[0]).join('')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground mb-1">
                          {booking.visitorName}
                        </p>
                        <p className="text-sm text-foreground-secondary mb-1">
                          {booking.appointmentType}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(booking.startTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

      {/* Booking Link Card with Enhanced Styling */}
      {widgetId && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Your Booking Page</CardTitle>
            <p className="text-sm text-foreground-secondary mt-2">
              Share this link for customers to book appointments
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <code className="block rounded-lg border border-border bg-surface p-4 text-sm font-mono overflow-x-auto transition-colors duration-200 group-hover:border-primary/30">
                    {`${window.location.origin}/book/${widgetId}`}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-auto aspect-square hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                  onClick={copyBookingUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-auto aspect-square hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                  onClick={openBookingPage}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions with Enhanced Hover Effects */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/appointments"
              className="group relative flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="mb-4 p-4 rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                <Calendar className="h-8 w-8 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                Manage Appointments
              </span>
            </a>
            <a
              href="/dashboard/forms"
              className="group relative flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="mb-4 p-4 rounded-xl bg-accent/10 transition-all duration-300 group-hover:bg-accent group-hover:scale-110">
                <FileText className="h-8 w-8 text-accent transition-colors duration-300 group-hover:text-accent-foreground" />
              </div>
              <span className="font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
                Create Form
              </span>
            </a>
            <a
              href="/dashboard/widget"
              className="group relative flex flex-col items-center justify-center rounded-xl border border-border p-8 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
            >
              <div className="mb-4 p-4 rounded-xl bg-success/10 transition-all duration-300 group-hover:bg-success group-hover:scale-110">
                <MessageSquare className="h-8 w-8 text-success transition-colors duration-300 group-hover:text-success-foreground" />
              </div>
              <span className="font-semibold text-foreground group-hover:text-success transition-colors duration-300">
                Customize Widget
              </span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
