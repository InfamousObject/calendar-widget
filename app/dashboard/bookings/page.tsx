'use client';

import { useEffect, useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, Phone, User, X } from 'lucide-react';
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
  appointmentType: {
    id: string;
    name: string;
    color: string;
    duration: number;
  };
}

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
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        await fetchAppointments();
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground">
          View and manage your scheduled appointments
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Appointment Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
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
                    className="w-full"
                    onClick={() => handleCancelAppointment(selectedEvent.id)}
                  >
                    Cancel Appointment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming appointments
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent"
                      onClick={() => {
                        const event = events.find((e) => e.id === apt.id);
                        if (event) handleSelectEvent(event);
                      }}
                    >
                      <div
                        className="h-10 w-1 rounded-full"
                        style={{ backgroundColor: apt.appointmentType.color }}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{apt.visitorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.appointmentType.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confirmed</span>
                  <span className="font-medium">
                    {
                      appointments.filter((apt) => apt.status === 'confirmed')
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cancelled</span>
                  <span className="font-medium">
                    {
                      appointments.filter((apt) => apt.status === 'cancelled')
                        .length
                    }
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
