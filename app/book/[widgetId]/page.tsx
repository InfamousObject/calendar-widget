'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { format, addDays, startOfDay, parseISO, addMinutes } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
}

interface WidgetInfo {
  businessName: string;
  timezone: string;
  appointmentTypes: AppointmentType[];
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DaySlots {
  date: string;
  slots: TimeSlot[];
}

interface BookingFormField {
  id: string;
  label: string;
  fieldType: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
  active: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const widgetId = typeof params.widgetId === 'string' ? params.widgetId : params.widgetId?.[0] || '';

  const [loading, setLoading] = useState(true);
  const [widgetInfo, setWidgetInfo] = useState<WidgetInfo | null>(null);
  const [step, setStep] = useState(1);

  // Step 1: Select appointment type
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);

  // Step 2: Select date and time
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [optimisticSlots, setOptimisticSlots] = useState<TimeSlot[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [validating, setValidating] = useState(false);

  // Step 3: Contact info
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [customFormFields, setCustomFormFields] = useState<BookingFormField[]>([]);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  // Step 4: Confirmation
  const [booking, setBooking] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  useEffect(() => {
    fetchWidgetInfo();
    fetchCustomFields();
  }, [widgetId]);

  const fetchWidgetInfo = async () => {
    try {
      const response = await fetch(`/api/widget/${widgetId}`);
      if (response.ok) {
        const data = await response.json();
        setWidgetInfo(data);
      } else {
        alert('Widget not found');
      }
    } catch (error) {
      console.error('Error fetching widget info:', error);
      alert('Failed to load booking page');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const response = await fetch(`/api/booking-form/public?widgetId=${widgetId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomFormFields(data.fields);
      }
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    }
  };

  const fetchAvailableDates = async (appointmentTypeId: string) => {
    setLoadingDates(true);
    try {
      const response = await fetch(
        `/api/availability/dates?widgetId=${widgetId}&appointmentTypeId=${appointmentTypeId}&daysAhead=14`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableDates(data.availableDates);

        // Trigger pre-warming for next 5 days in background (don't await)
        fetch('/api/availability/prewarm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId,
            appointmentTypeId,
            daysToPrewarm: 5,
          }),
        }).catch(err => console.log('Pre-warm request failed:', err));
      }
    } catch (error) {
      console.error('Error fetching dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchSlotsForDate = async (date: string) => {
    // OPTIMISTIC RENDERING: Show all theoretical slots immediately
    setLoadingSlots(true);
    setAvailableSlots([]);
    setOptimisticSlots(generateOptimisticSlots(date));

    try {
      const startDate = startOfDay(parseISO(date)).toISOString();
      const endDate = addDays(parseISO(date), 1).toISOString();

      // Fetch actual availability in background
      setValidating(true);
      const response = await fetch(
        `/api/availability/slots?widgetId=${widgetId}&appointmentTypeId=${selectedType?.id}&startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Booking] Slots API response:', data);
        // Extract slots for the selected date
        const daySlots = data.slots.find((s: DaySlots) => s.date === date);
        console.log('[Booking] Day slots for', date, ':', daySlots);
        if (daySlots) {
          const availSlots = daySlots.slots.filter((s: TimeSlot) => s.available);
          console.log('[Booking] Available slots:', availSlots.length);
          setAvailableSlots(availSlots);
          setOptimisticSlots([]); // Clear optimistic once real data arrives
        } else {
          console.log('[Booking] No day slots found for date:', date);
          setOptimisticSlots([]); // Clear optimistic if no data
        }
      } else {
        console.error('[Booking] Slots API error:', response.status);
        setOptimisticSlots([]); // Clear on error
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setOptimisticSlots([]); // Clear on error
    } finally {
      setLoadingSlots(false);
      setValidating(false);
    }
  };

  // Generate optimistic slots based on appointment type duration
  const generateOptimisticSlots = (date: string): TimeSlot[] => {
    if (!selectedType) return [];

    const slots: TimeSlot[] = [];
    const startHour = 9; // Default business hours
    const endHour = 17;

    let current = parseISO(date);
    current.setHours(startHour, 0, 0, 0);

    const dayEnd = parseISO(date);
    dayEnd.setHours(endHour, 0, 0, 0);

    while (current < dayEnd) {
      const slotEnd = addMinutes(current, selectedType.duration);
      if (slotEnd > dayEnd) break;

      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        available: true,
      });

      current = addMinutes(current, selectedType.duration);
    }

    return slots;
  };

  const handleSelectType = (type: AppointmentType) => {
    setSelectedType(type);
    setSelectedDate('');
    setAvailableSlots([]);
    fetchAvailableDates(type.id);
    setStep(2);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    fetchSlotsForDate(date);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleBackToDateSelection = () => {
    setSelectedDate('');
    setAvailableSlots([]);
  };

  const renderCustomField = (field: BookingFormField) => {
    const value = formResponses[field.id] || '';

    const updateValue = (newValue: any) => {
      setFormResponses({ ...formResponses, [field.id]: newValue });
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.fieldType}
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => updateValue(e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value} onValueChange={updateValue}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value === true}
              onCheckedChange={(checked) => updateValue(checked)}
            />
            <Label htmlFor={field.id} className="cursor-pointer font-normal">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedType || !selectedSlot || !contactInfo.name || !contactInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate required custom fields
    const missingFields = customFormFields.filter(
      (field) => field.required && !formResponses[field.id]
    );

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    setBooking(true);
    try {
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId,
          appointmentTypeId: selectedType.id,
          startTime: selectedSlot.start,
          visitorName: contactInfo.name,
          visitorEmail: contactInfo.email,
          visitorPhone: contactInfo.phone || undefined,
          notes: contactInfo.notes || undefined,
          timezone: widgetInfo?.timezone || 'UTC',
          formResponses: Object.keys(formResponses).length > 0 ? formResponses : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmationData(data.appointment);
        setStep(4);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!widgetInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Widget not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{widgetInfo.businessName}</h1>
          <p className="text-muted-foreground">Book an appointment</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step >= s
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > s ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Appointment Type */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Appointment Type</CardTitle>
                <CardDescription>
                  Choose the type of appointment you'd like to book
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {widgetInfo.appointmentTypes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No appointment types available
                  </p>
                ) : (
                  widgetInfo.appointmentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                      className="flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{type.name}</h3>
                        {type.description && (
                          <p className="text-sm text-muted-foreground">
                            {type.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{type.duration} minutes</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Select Date and Time */}
        {step === 2 && selectedType && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {!selectedDate ? 'Select Date' : 'Select Time'}
                    </CardTitle>
                    <CardDescription>
                      {selectedType.name} - {selectedType.duration} minutes
                      {selectedDate && (
                        <span className="ml-2">
                          • {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedDate) {
                        handleBackToDateSelection();
                      } else {
                        setStep(1);
                      }
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  // Show available dates
                  <>
                    {loadingDates ? (
                      <p className="text-center py-8">Loading available dates...</p>
                    ) : availableDates.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No available dates found
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableDates.map((date) => (
                          <Button
                            key={date}
                            variant="outline"
                            onClick={() => handleSelectDate(date)}
                            className="h-auto py-4 flex flex-col items-center gap-1"
                          >
                            <span className="text-sm font-medium">
                              {format(parseISO(date), 'EEE')}
                            </span>
                            <span className="text-2xl font-bold">
                              {format(parseISO(date), 'd')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(date), 'MMM yyyy')}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  // Show time slots for selected date
                  <>
                    {validating && optimisticSlots.length > 0 && (
                      <div className="mb-3 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                        Validating availability...
                      </div>
                    )}

                    {loadingSlots && optimisticSlots.length === 0 ? (
                      <p className="text-center py-8">Loading available times...</p>
                    ) : optimisticSlots.length > 0 ? (
                      // Show optimistic slots (being validated)
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {optimisticSlots.map((slot, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            disabled
                            className="h-auto py-3 opacity-70"
                          >
                            {format(parseISO(slot.start), 'h:mm a')}
                          </Button>
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No available times for this date
                      </p>
                    ) : (
                      // Show real validated slots
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {availableSlots.map((slot, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            onClick={() => handleSelectSlot(slot)}
                            className="h-auto py-3"
                          >
                            {format(parseISO(slot.start), 'h:mm a')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Contact Information */}
        {step === 3 && selectedSlot && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Information</CardTitle>
                    <CardDescription>
                      {format(parseISO(selectedSlot.start), 'EEEE, MMMM d')} at{' '}
                      {format(parseISO(selectedSlot.start), 'h:mm a')}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={contactInfo.name}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, name: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={contactInfo.notes}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, notes: e.target.value })
                    }
                    placeholder="Any additional information..."
                  />
                </div>

                {/* Custom form fields */}
                {customFormFields.map((field) => renderCustomField(field))}

                <Button
                  className="w-full"
                  onClick={handleBookAppointment}
                  disabled={booking || !contactInfo.name || !contactInfo.email}
                >
                  {booking ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && confirmationData && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <CardTitle>Appointment Confirmed!</CardTitle>
                  <CardDescription>
                    You'll receive a confirmation email shortly
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">
                      {confirmationData.appointmentType.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">
                      {format(parseISO(confirmationData.startTime), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {format(parseISO(confirmationData.startTime), 'h:mm a')} -{' '}
                      {format(parseISO(confirmationData.endTime), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">
                      {confirmationData.visitorName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">
                      {confirmationData.visitorEmail}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="text-muted-foreground">
                    A calendar invitation has been sent to your email. If you need to
                    cancel, please use the cancellation link in your confirmation
                    email.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStep(1);
                    setSelectedType(null);
                    setSelectedSlot(null);
                    setContactInfo({ name: '', email: '', phone: '', notes: '' });
                    setConfirmationData(null);
                  }}
                >
                  Book Another Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
