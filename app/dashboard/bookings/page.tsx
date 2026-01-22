'use client';

import { useEffect, useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, Phone, User, X, CalendarDays, TrendingUp, DollarSign, Video } from 'lucide-react';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  notes?: string;
  status: string;
  // Video meeting fields
  meetingLink?: string;
  meetingProvider?: string;
  // Payment fields
  paymentIntentId?: string;
  paymentStatus?: string;
  amountPaid?: number;
  currency?: string;
  refundId?: string;
  refundAmount?: number;
  appointmentType: {
    id: string;
    name: string;
    color: string;
    duration: number;
  };
}

// Helper to format price
const formatPrice = (cents: number | undefined, currency: string = 'usd') => {
  if (!cents) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
};

// Payment status badge helper
const getPaymentBadgeVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'paid': return 'default';
    case 'refunded': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

export default function BookingsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchAppointments();
  }, [date, view]);

  const fetchAppointments = async () => {
    try {
      // Calculate date range based on current view
      let startDate: Date;
      let endDate: Date;

      if (view === 'month') {
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
      } else if (view === 'week') {
        startDate = startOfWeek(date);
        endDate = addMonths(startDate, 1);
      } else {
        // day view
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      }

      const response = await fetch(
        `/api/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      title: `${apt.appointmentType.name} - ${apt.visitorName}`,
      start: new Date(apt.startTime),
      end: new Date(apt.endTime),
      resource: apt,
    }));
  }, [appointments]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource.appointmentType.color;
    const isCancelled = event.resource.status === 'cancelled';

    return {
      style: {
        backgroundColor: isCancelled ? '#9ca3af' : backgroundColor,
        opacity: isCancelled ? 0.6 : 1,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        padding: '2px 5px',
        fontSize: '0.875rem',
      },
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this appointment?');
    if (!confirmCancel) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        toast.success('Appointment cancelled successfully');
        await fetchAppointments();
        setSelectedEvent(null);
      } else {
        toast.error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const upcomingAppointments = appointments
    .filter((apt) => {
      const startTime = new Date(apt.startTime);
      return startTime >= new Date() && apt.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[600px] rounded-xl bg-muted" />
          <div className="space-y-6">
            <div className="h-64 rounded-xl bg-muted" />
            <div className="h-48 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
        <div className="gradient-mesh absolute inset-0 -z-10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Appointments</h2>
          </div>
          <p className="text-lg text-foreground-secondary font-light">
            View and manage your scheduled appointments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-border">
            <CardContent className="p-6">
              <div style={{ height: '600px' }}>
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={handleSelectEvent}
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  views={['month', 'week', 'day']}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Event Details */}
          {selectedEvent && (
            <Card className="border-primary/20 shadow-lg shadow-primary/5 animate-fadeInUp">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xl">Appointment Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {selectedEvent.resource.appointmentType.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        selectedEvent.resource.status === 'confirmed'
                          ? 'default'
                          : selectedEvent.resource.status === 'cancelled'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {selectedEvent.resource.status}
                    </Badge>
                    {selectedEvent.resource.paymentStatus && (
                      <Badge variant={getPaymentBadgeVariant(selectedEvent.resource.paymentStatus)}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        {selectedEvent.resource.paymentStatus}
                      </Badge>
                    )}
                    {selectedEvent.resource.meetingLink && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                        <Video className="h-3 w-3 mr-1" />
                        Meet
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(selectedEvent.start, 'MMM d, yyyy')} at{' '}
                      {format(selectedEvent.start, 'h:mm a')} -{' '}
                      {format(selectedEvent.end, 'h:mm a')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.resource.visitorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedEvent.resource.visitorEmail}`}
                      className="text-primary hover:underline"
                    >
                      {selectedEvent.resource.visitorEmail}
                    </a>
                  </div>

                  {selectedEvent.resource.visitorPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${selectedEvent.resource.visitorPhone}`}
                        className="text-primary hover:underline"
                      >
                        {selectedEvent.resource.visitorPhone}
                      </a>
                    </div>
                  )}

                  {/* Meeting Link */}
                  {selectedEvent.resource.meetingLink && (
                    <div className="pt-2 border-t">
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <Video className="h-4 w-4 text-blue-500" />
                        Meeting Link:
                      </p>
                      <a
                        href={selectedEvent.resource.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs break-all"
                      >
                        {selectedEvent.resource.meetingLink}
                      </a>
                    </div>
                  )}

                  {/* Payment Info */}
                  {selectedEvent.resource.paymentStatus && selectedEvent.resource.amountPaid && (
                    <div className="pt-2 border-t">
                      <p className="font-medium mb-1 flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        Payment:
                      </p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>Amount: {formatPrice(selectedEvent.resource.amountPaid, selectedEvent.resource.currency)}</p>
                        {selectedEvent.resource.refundAmount && (
                          <p className="text-amber-600">
                            Refunded: {formatPrice(selectedEvent.resource.refundAmount, selectedEvent.resource.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.resource.notes && (
                    <div className="pt-2 border-t">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-muted-foreground">
                        {selectedEvent.resource.notes}
                      </p>
                    </div>
                  )}
                </div>

                {selectedEvent.resource.status !== 'cancelled' && (
                  <Button
                    variant="destructive"
                    className="w-full hover:shadow-lg hover:shadow-destructive/20 transition-all duration-300"
                    onClick={() => handleCancelAppointment(selectedEvent.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Appointments
              </CardTitle>
              <CardDescription>Your next scheduled meetings</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-3 rounded-xl bg-muted/50 inline-flex mb-3">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    No upcoming appointments
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt, index) => (
                    <div
                      key={apt.id}
                      className="group flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 animate-fadeInUp"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => {
                        const event = events.find((e) => e.id === apt.id);
                        if (event) handleSelectEvent(event);
                      }}
                    >
                      <div
                        className="h-12 w-1.5 rounded-full transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: apt.appointmentType.color }}
                      />
                      <div className="flex-1 space-y-1.5">
                        <p className="font-semibold text-sm">{apt.visitorName}</p>
                        <p className="text-xs text-foreground-secondary">
                          {apt.appointmentType.name}
                        </p>
                        <p className="text-xs text-foreground-tertiary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(apt.startTime), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium text-foreground-secondary">Total</span>
                  <span className="font-display text-2xl font-bold">{appointments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-success/5">
                  <span className="text-sm font-medium text-foreground-secondary">Confirmed</span>
                  <span className="font-display text-2xl font-bold text-success">
                    {appointments.filter((apt) => apt.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="text-sm font-medium text-foreground-secondary">Cancelled</span>
                  <span className="font-display text-2xl font-bold text-foreground-tertiary">
                    {appointments.filter((apt) => apt.status === 'cancelled').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
