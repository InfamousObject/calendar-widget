'use client';
// Force dynamic rendering to avoid useSearchParams() prerender errors
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, ArrowLeft, Check } from 'lucide-react';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { trackConversion } from '@/lib/analytics/track';

interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
}

interface BookingFormField {
  id: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface TimeSlot {
  start: string;
  end: string;
  startLocal: string;
  endLocal: string;
  available: boolean;
}

interface WidgetConfig {
  widgetId: string;
  businessName: string;
  appointmentTypes: AppointmentType[];
  bookingSettings: {
    timeFormat: string;
    requirePhone: boolean;
    showNotes: boolean;
    daysToDisplay: number;
  };
  customFields: BookingFormField[];
}

type Step = 'select-type' | 'select-date' | 'select-time' | 'details' | 'success';

function EmbedBookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const widgetId = params.widgetId as string;
  const preselectedTypeId = searchParams.get('type');

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('select-type');
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [customFormResponses, setCustomFormResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // CAPTCHA state
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize: Report height to parent window for iframe resizing
  useEffect(() => {
    const reportHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage({ type: 'kentroi-resize', height }, '*');
      }
    };

    // Report initial height
    reportHeight();

    // Watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      reportHeight();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also report on step changes (content changes)
    const observer = new MutationObserver(() => {
      setTimeout(reportHeight, 100); // Small delay for DOM to settle
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [step, loading, loadingSlots]);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config && preselectedTypeId) {
      const type = config.appointmentTypes.find((t) => t.id === preselectedTypeId);
      if (type) {
        setSelectedType(type);
        setStep('select-date');
      }
    }
  }, [config, preselectedTypeId]);

  useEffect(() => {
    if (selectedDate && selectedType) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedType]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/embed/booking/${widgetId}`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedType) return;

    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startDate = startOfDay(selectedDate).toISOString();
      const endDate = addDays(selectedDate, 1).toISOString();

      const response = await fetch(
        `/api/availability/slots?widgetId=${widgetId}&appointmentTypeId=${selectedType.id}&startDate=${startDate}&endDate=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        // Find slots for the selected date and filter to only available ones
        const daySlots = data.slots?.find((s: { date: string; slots: TimeSlot[] }) => s.date === dateStr);
        if (daySlots) {
          const available = daySlots.slots.filter((s: TimeSlot) => s.available);
          setAvailableSlots(available);
        } else {
          setAvailableSlots([]);
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot || !selectedType || !config) return;

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!formData.email.trim()) {
      alert('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate phone if required
    if (config.bookingSettings.requirePhone && !formData.phone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    // Validate required custom fields
    const missingFields = config.customFields.filter(
      (field) => field.required && !customFormResponses[field.id]
    );
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    // Validate CAPTCHA if configured
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
      alert('Please complete the CAPTCHA verification');
      return;
    }

    setSubmitting(true);
    try {
      const startTime = parseISO(selectedSlot.start);

      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId,
          appointmentTypeId: selectedType.id,
          startTime: startTime.toISOString(),
          visitorName: formData.name,
          visitorEmail: formData.email,
          visitorPhone: formData.phone,
          notes: formData.notes,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          formResponses: Object.keys(customFormResponses).length > 0 ? customFormResponses : undefined,
          captchaToken: captchaToken || undefined,
        }),
      });

      if (response.ok) {
        trackConversion('booking_completed', { appointment_type: selectedType?.name, widget_id: widgetId });
        setStep('success');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to book appointment');
        // Reset CAPTCHA on error
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
          setCaptchaToken('');
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field: BookingFormField) => {
    const value = customFormResponses[field.id] || '';
    const updateValue = (newValue: any) => {
      setCustomFormResponses({ ...customFormResponses, [field.id]: newValue });
    };

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'url':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
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
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
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
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={updateValue}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
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
              checked={value}
              onCheckedChange={updateValue}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Booking system not found</p>
      </div>
    );
  }

  const daysToDisplay = config.bookingSettings.daysToDisplay || 7;
  const availableDays = Array.from({ length: daysToDisplay }, (_, i) => addDays(startOfDay(new Date()), i));

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {step !== 'select-type' && step !== 'success' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (step === 'select-date') {
                    if (preselectedTypeId) {
                      window.history.back();
                    } else {
                      setStep('select-type');
                      setSelectedType(null);
                    }
                  } else if (step === 'select-time') {
                    setStep('select-date');
                    setSelectedSlot(null);
                  } else if (step === 'details') {
                    setStep('select-time');
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle>
                {step === 'success' ? 'Booking Confirmed!' : `Book with ${config.businessName}`}
              </CardTitle>
              {selectedType && step !== 'success' && (
                <CardDescription>{selectedType.name} ({selectedType.duration} min)</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Select Appointment Type */}
          {step === 'select-type' && (
            <div className="space-y-3">
              <h3 className="font-medium mb-4">Select appointment type</h3>
              {config.appointmentTypes.map((type) => (
                <Card
                  key={type.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedType(type);
                    setStep('select-date');
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5" style={{ color: type.color }} />
                      {type.name}
                    </CardTitle>
                    {type.description && (
                      <CardDescription>{type.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{type.duration} minutes</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Select Date */}
          {step === 'select-date' && (
            <div className="space-y-4">
              <h3 className="font-medium">Select a date</h3>
              <div className="grid grid-cols-4 gap-2">
                {availableDays.map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                      setStep('select-time');
                    }}
                    className="flex flex-col h-auto py-3"
                  >
                    <span className="text-xs">{format(date, 'EEE')}</span>
                    <span className="text-lg font-bold">{format(date, 'd')}</span>
                    <span className="text-xs">{format(date, 'MMM')}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Select Time */}
          {step === 'select-time' && selectedDate && (
            <div className="space-y-4">
              <h3 className="font-medium">
                Select a time on {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Loading available times...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available times for this date</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.start}
                      variant={selectedSlot?.start === slot.start ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep('details');
                      }}
                    >
                      {slot.startLocal}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <h3 className="font-medium">Your information</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                {config.bookingSettings.requirePhone && (
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                )}
                {config.customFields.map((field) => renderCustomField(field))}
                {config.bookingSettings.showNotes && (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any special requests?"
                    />
                  </div>
                )}
              </div>

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

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  !formData.email ||
                  submitting ||
                  (!!process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken)
                }
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center space-y-6 py-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Appointment Confirmed!</h3>
                <p className="text-muted-foreground">
                  Your {selectedType?.name} appointment is scheduled for{' '}
                  {selectedDate && format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot?.startLocal}.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  A confirmation email has been sent to {formData.email}.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmbedBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <p>Loading...</p>
      </div>
    }>
      <EmbedBookingContent />
    </Suspense>
  );
}
