'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ArrowLeft, ArrowRight, Check, AlertCircle, DollarSign, Video } from 'lucide-react';
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
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { PaymentForm } from '@/components/booking/payment-form';

interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
  enableGoogleMeet?: boolean;
  // Payment fields
  price?: number | null;
  currency?: string;
  requirePayment?: boolean;
  depositPercent?: number | null;
}

interface WidgetInfo {
  businessName: string;
  timezone: string;
  daysToDisplay?: number;
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
  const [slotsError, setSlotsError] = useState<string | null>(null);
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

  // CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);

  // Step 4: Payment (if required)
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  // Step 5: Confirmation
  const [booking, setBooking] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Helper to format price
  const formatPrice = (cents: number | null | undefined, currency: string = 'usd') => {
    if (cents === null || cents === undefined) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  // Check if selected appointment type requires payment
  const requiresPayment = selectedType?.requirePayment && selectedType?.price;

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchWidgetInfo(), fetchCustomFields()]);
      setLoading(false);
    };
    loadInitialData();
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
        `/api/availability/dates?widgetId=${widgetId}&appointmentTypeId=${appointmentTypeId}&daysAhead=${widgetInfo?.daysToDisplay || 14}`
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
        }).catch(() => {});
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
    setSlotsError(null);
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
        // Extract slots for the selected date
        const daySlots = data.slots.find((s: DaySlots) => s.date === date);
        if (daySlots) {
          const availSlots = daySlots.slots.filter((s: TimeSlot) => s.available);
          setAvailableSlots(availSlots);
          setOptimisticSlots([]); // Clear optimistic once real data arrives
        } else {
          setOptimisticSlots([]); // Clear optimistic if no data
        }
      } else {
        setOptimisticSlots([]); // Clear on error
        try {
          const errorData = await response.json();
          setSlotsError(errorData.error || 'Failed to load available times');
        } catch {
          setSlotsError('Failed to load available times');
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setOptimisticSlots([]); // Clear on error
      setSlotsError('Unable to connect. Please check your internet connection and try again.');
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
    setSlotsError(null);
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

  const handleBookAppointment = async (paymentId?: string) => {
    if (!selectedType || !selectedSlot || !contactInfo.name || !contactInfo.email) {
      setBookingError('Please fill in all required fields.');
      return;
    }

    // Validate required custom fields
    const missingFields = customFormFields.filter(
      (field) => field.required && !formResponses[field.id]
    );

    if (missingFields.length > 0) {
      setBookingError(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    // Validate CAPTCHA if configured
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
      setBookingError('Please complete the CAPTCHA verification.');
      return;
    }

    // Use provided paymentId or existing state
    const finalPaymentIntentId = paymentId || paymentIntentId;

    setBooking(true);
    setBookingError(null);
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
          captchaToken: captchaToken || undefined,
          paymentIntentId: finalPaymentIntentId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmationData({ ...data.appointment, calendarCreated: data.calendarCreated });
        // Set step to 5 if payment was required, 4 otherwise
        setStep(requiresPayment ? 5 : 4);
      } else if (response.status === 409) {
        setBookingError('This time slot was just booked by someone else. Please select another time.');
        setStep(2); // Go back to time selection
      } else if (response.status === 429) {
        setBookingError('Too many requests. Please wait a few minutes and try again.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setBookingError(errorData.error || 'Failed to book appointment. Please try again.');
      }
      // Reset CAPTCHA on any error
      if (!response.ok && captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken('');
      }
    } catch (error) {
      setBookingError('Network error. Please check your connection and try again.');
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken('');
      }
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl font-semibold tracking-tight mb-3">{widgetInfo.businessName}</h1>
          <p className="text-lg text-foreground-secondary font-light">Schedule your appointment in minutes</p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="relative mb-12">
          {/* Progress steps - dynamically include payment if required */}
          {(() => {
            const steps = [
              { num: 1, label: 'Service' },
              { num: 2, label: 'Time' },
              { num: 3, label: 'Details' },
              ...(requiresPayment ? [{ num: 4, label: 'Payment' }] : []),
              { num: requiresPayment ? 5 : 4, label: 'Confirm' },
            ];
            const totalSteps = steps.length;
            const currentStepIndex = steps.findIndex(s => s.num === step);
            const progressPercent = currentStepIndex >= 0 ? (currentStepIndex / (totalSteps - 1)) * 100 : 0;

            return (
              <>
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="relative flex items-center justify-between">
                  {steps.map((s) => (
                    <div key={s.num} className="flex flex-col items-center gap-2">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                          step >= s.num
                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30'
                            : step === s.num - 1
                            ? 'bg-background border-primary/50 text-primary scale-110'
                            : 'bg-background border-border text-foreground-tertiary'
                        }`}
                      >
                        {step > s.num ? (
                          <Check className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <span className="text-sm font-semibold">{steps.indexOf(s) + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium transition-colors duration-300 ${
                        step >= s.num ? 'text-primary' : 'text-foreground-tertiary'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Step 1: Select Appointment Type */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">Select Appointment Type</CardTitle>
                <CardDescription className="text-base mt-2">
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
                      aria-label={`Select ${type.name}, ${type.duration} minutes${type.price ? `, ${formatPrice(type.price, type.currency)}` : ', Free'}`}
                      className="group flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{type.name}</h3>
                          {type.enableGoogleMeet && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400">
                              <Video className="h-3 w-3" aria-hidden="true" />
                              Meet
                            </span>
                          )}
                        </div>
                        {type.description && (
                          <p className="text-sm text-foreground-secondary">
                            {type.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-sm text-foreground-tertiary">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" aria-hidden="true" />
                            {type.duration} minutes
                          </span>
                          {type.requirePayment && type.price && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <DollarSign className="h-4 w-4" aria-hidden="true" />
                              {formatPrice(type.price, type.currency)}
                              {type.depositPercent && (
                                <span className="text-foreground-tertiary font-normal">
                                  ({type.depositPercent}% deposit)
                                </span>
                              )}
                            </span>
                          )}
                          {!type.requirePayment && (
                            <span className="text-foreground-tertiary">Free</span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-foreground-tertiary group-hover:text-primary transition-colors duration-300" aria-hidden="true" />
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
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        </div>
                        <p className="text-foreground-secondary">Finding available dates...</p>
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="py-12 px-4">
                        <div className="max-w-md mx-auto rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/5 to-background p-8 text-center">
                          <div className="inline-flex p-4 rounded-full bg-warning/10 mb-4">
                            <AlertCircle className="h-8 w-8 text-warning" aria-hidden="true" />
                          </div>
                          <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                            No Available Dates
                          </h3>
                          <p className="text-foreground-secondary">
                            This calendar doesn't have any available booking dates configured yet.
                            Please check back later or contact the business directly.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {availableDates.map((date, index) => {
                          const parsedDate = parseISO(date);
                          const isToday = format(new Date(), 'yyyy-MM-dd') === date;

                          return (
                            <button
                              key={date}
                              onClick={() => handleSelectDate(date)}
                              aria-label={format(parsedDate, 'EEEE, MMMM d, yyyy')}
                              className="group relative h-auto py-6 px-4 flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-surface transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              {isToday && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                                  Today
                                </span>
                              )}

                              <span className="text-xs font-medium text-foreground-tertiary group-hover:text-primary transition-colors">
                                {format(parsedDate, 'EEE')}
                              </span>
                              <span className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                                {format(parsedDate, 'd')}
                              </span>
                              <span className="text-xs text-foreground-tertiary">
                                {format(parsedDate, 'MMM')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Show time slots for selected date
                  <>
                    {validating && optimisticSlots.length > 0 && (
                      <div className="mb-4 flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="relative w-5 h-5">
                          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                        <span className="text-sm font-medium text-primary">
                          Validating availability with your calendar...
                        </span>
                      </div>
                    )}

                    {loadingSlots && optimisticSlots.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        </div>
                        <p className="text-foreground-secondary">Loading available times...</p>
                      </div>
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
                    ) : slotsError ? (
                      <div className="py-12 px-4">
                        <div className="max-w-md mx-auto rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/5 to-background p-8 text-center">
                          <div className="inline-flex p-4 rounded-full bg-destructive/10 mb-4">
                            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
                          </div>
                          <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                            Something Went Wrong
                          </h3>
                          <p className="text-foreground-secondary mb-6">
                            {slotsError}
                          </p>
                          <div className="flex gap-3 justify-center">
                            <Button
                              variant="outline"
                              onClick={handleBackToDateSelection}
                              className="gap-2"
                            >
                              <ArrowLeft className="h-4 w-4" />
                              Choose Another Date
                            </Button>
                            <Button
                              onClick={() => fetchSlotsForDate(selectedDate)}
                              className="gap-2"
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="py-12 px-4">
                        <div className="max-w-md mx-auto rounded-2xl border border-border bg-surface p-8 text-center">
                          <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                            <AlertCircle className="h-8 w-8 text-foreground-secondary" aria-hidden="true" />
                          </div>
                          <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                            Fully Booked
                          </h3>
                          <p className="text-foreground-secondary mb-6">
                            All time slots for this date are taken. Please select a different date.
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleBackToDateSelection}
                            className="gap-2"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Choose Another Date
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Show real validated slots
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectSlot(slot)}
                            className="group relative h-auto py-4 px-3 rounded-xl border-2 border-border bg-surface text-sm font-semibold transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                            style={{ animationDelay: `${idx * 20}ms` }}
                          >
                            {format(parseISO(slot.start), 'h:mm a')}
                          </button>
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

                {/* hCaptcha verification */}
                {process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && (
                  <div className="flex justify-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY}
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken('')}
                      onError={() => setCaptchaToken('')}
                    />
                  </div>
                )}

                {/* Payment info notice if required */}
                {requiresPayment && (
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-foreground">Payment Required</p>
                        <p className="text-sm text-foreground-secondary">
                          {formatPrice(selectedType?.depositPercent
                            ? Math.round((selectedType.price || 0) * (selectedType.depositPercent / 100))
                            : selectedType?.price, selectedType?.currency)}
                          {selectedType?.depositPercent && ` (${selectedType.depositPercent}% deposit)`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bookingError && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{bookingError}</p>
                    </div>
                    <button
                      onClick={() => setBookingError(null)}
                      className="text-destructive/60 hover:text-destructive flex-shrink-0"
                      aria-label="Dismiss error"
                    >
                      <span className="text-lg leading-none">&times;</span>
                    </button>
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30"
                  onClick={() => {
                    setBookingError(null);
                    // Validate fields first
                    if (!contactInfo.name || !contactInfo.email) {
                      setBookingError('Please fill in all required fields.');
                      return;
                    }

                    const missingFields = customFormFields.filter(
                      (field) => field.required && !formResponses[field.id]
                    );
                    if (missingFields.length > 0) {
                      setBookingError(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
                      return;
                    }

                    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
                      setBookingError('Please complete the CAPTCHA verification.');
                      return;
                    }

                    // If payment is required, go to payment step
                    if (requiresPayment) {
                      setStep(4);
                    } else {
                      // Otherwise, book directly
                      handleBookAppointment();
                    }
                  }}
                  disabled={
                    booking ||
                    !contactInfo.name ||
                    !contactInfo.email ||
                    (!!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken)
                  }
                >
                  {requiresPayment ? 'Continue to Payment' : booking ? 'Booking...' : 'Confirm Booking'}
                  {requiresPayment && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Payment (if required) */}
        {step === 4 && requiresPayment && selectedType && !confirmationData && (
          <div className="space-y-4">
            <PaymentForm
              widgetId={widgetId}
              appointmentTypeId={selectedType.id}
              visitorEmail={contactInfo.email}
              visitorName={contactInfo.name}
              onPaymentSuccess={(paymentId) => {
                setPaymentIntentId(paymentId);
                // Automatically proceed to book after successful payment
                handleBookAppointment(paymentId);
              }}
              onBack={() => setStep(3)}
            />
          </div>
        )}

        {/* Step 4/5: Enhanced Confirmation */}
        {((step === 4 && !requiresPayment) || (step === 5 && requiresPayment) || confirmationData) && confirmationData && (
          <div className="space-y-6">
            <Card className="border-success/20 bg-gradient-to-br from-success/5 via-background to-background overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-50" />

              <CardHeader className="relative">
                <div className="flex flex-col items-center text-center">
                  {/* Animated success icon */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 animate-ping">
                      <div className="w-20 h-20 rounded-full bg-success/20" />
                    </div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center shadow-lg shadow-success/30">
                      <Check className="h-10 w-10 text-white animate-bounce" />
                    </div>
                  </div>

                  <CardTitle className="font-display text-3xl font-semibold mb-3">
                    You're All Set!
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Your appointment has been confirmed. We've sent the details to your email.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {/* Appointment details card */}
                <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
                  <div className="flex items-start gap-4 pb-4 border-b border-border">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                      {confirmationData.visitorName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {confirmationData.visitorName}
                      </h3>
                      <p className="text-sm text-foreground-secondary">
                        {confirmationData.visitorEmail}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground-secondary font-medium">Service</span>
                      <span className="font-semibold text-foreground">
                        {confirmationData.appointmentType.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground-secondary font-medium">Date</span>
                      <span className="font-semibold text-foreground">
                        {format(parseISO(confirmationData.startTime), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground-secondary font-medium">Time</span>
                      <span className="font-semibold text-foreground">
                        {format(parseISO(confirmationData.startTime), 'h:mm a')} - {format(parseISO(confirmationData.endTime), 'h:mm a')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground-secondary font-medium">Duration</span>
                      <span className="font-semibold text-foreground">
                        {confirmationData.appointmentType.duration} minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next steps */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                    What happens next?
                  </h4>
                  <ul className="space-y-2 text-sm text-foreground-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>{confirmationData.calendarCreated
                        ? `Calendar invitation sent to ${confirmationData.visitorEmail}`
                        : 'Check your email for appointment details'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>You'll receive a reminder 24 hours before your appointment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Need to reschedule? Use the link in your confirmation email</span>
                    </li>
                  </ul>
                </div>

                {/* CTA buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setStep(1);
                      setSelectedType(null);
                      setSelectedSlot(null);
                      setContactInfo({ name: '', email: '', phone: '', notes: '' });
                      setConfirmationData(null);
                      setPaymentIntentId(null);
                      setFormResponses({});
                      // Reset CAPTCHA
                      if (captchaRef.current) {
                        captchaRef.current.resetCaptcha();
                        setCaptchaToken('');
                      }
                    }}
                  >
                    Book Another
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30"
                    onClick={() => window.close()}
                  >
                    Done
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
