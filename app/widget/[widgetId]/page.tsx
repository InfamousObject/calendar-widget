'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, FileText, X, ArrowLeft, Check, MessageSquare, Send } from 'lucide-react';
import { format, addDays, startOfDay, parseISO, addMinutes } from 'date-fns';

interface WidgetConfig {
  widgetId: string;
  businessName: string;
  welcomeMessage: string;
  logoUrl?: string;
  appearance: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontFamily: string;
  };
  bookingSettings: {
    timeFormat: string;
    requirePhone: boolean;
    showNotes: boolean;
  };
  chatbot?: {
    enabled: boolean;
    botName: string;
    greetingMessage: string;
  };
  features: {
    appointmentTypes: Array<{
      id: string;
      name: string;
      description?: string;
      duration: number;
      color: string;
    }>;
    forms: Array<{
      id: string;
      name: string;
      description?: string;
      fields: any[];
      settings: any;
    }>;
  };
}

type View = 'menu' | 'booking' | 'form' | 'chat' | 'success';

export default function WidgetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const widgetId = params.widgetId as string;

  // Get initial view from query param or default to 'menu'
  const initialView = (searchParams.get('view') as View) || 'menu';

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(initialView);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    // Apply custom styles
    if (config) {
      applyCustomStyles();
    }
  }, [config]);

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

  const applyCustomStyles = () => {
    if (!config) return;

    document.documentElement.style.setProperty('--widget-primary', config.appearance.primaryColor);
    document.documentElement.style.setProperty('--widget-background', config.appearance.backgroundColor);
    document.documentElement.style.setProperty('--widget-text', config.appearance.textColor);
  };

  const handleClose = () => {
    window.parent.postMessage('smartwidget:close', '*');
  };

  const handleBookingSuccess = () => {
    setView('success');
  };

  const handleFormSuccess = () => {
    setView('success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Widget not found</p>
      </div>
    );
  }

  // Only show back button if we navigated from menu (not direct link)
  const showBackButton = view !== 'menu' && initialView === 'menu';

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: config.appearance.backgroundColor }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setView('menu');
                setSelectedFeature(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {config.logoUrl && (
            <img src={config.logoUrl} alt="Logo" className="h-8 w-auto" />
          )}
          <div>
            <h1 className="font-semibold" style={{ color: config.appearance.textColor }}>
              {config.businessName}
            </h1>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === 'menu' && (
          <MenuView
            config={config}
            onSelectBooking={(type: WidgetConfig['features']['appointmentTypes'][number]) => {
              setSelectedFeature(type);
              setView('booking');
            }}
            onSelectForm={(form: WidgetConfig['features']['forms'][number]) => {
              setSelectedFeature(form);
              setView('form');
            }}
            onSelectChat={() => setView('chat')}
          />
        )}

        {view === 'booking' && selectedFeature && (
          <BookingView
            widgetId={widgetId}
            appointmentType={selectedFeature}
            config={config}
            onSuccess={handleBookingSuccess}
          />
        )}

        {view === 'form' && selectedFeature && (
          <FormView
            form={selectedFeature}
            config={config}
            onSuccess={handleFormSuccess}
          />
        )}

        {view === 'chat' && (
          <ChatView
            widgetId={widgetId}
            config={config}
          />
        )}

        {view === 'success' && (
          <SuccessView config={config} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}

// Menu View Component
function MenuView({ config, onSelectBooking, onSelectForm, onSelectChat }: any) {
  const hasBooking = config.features.appointmentTypes.length > 0;
  const hasForms = config.features.forms.length > 0;
  const hasChat = config.chatbot?.enabled;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2" style={{ color: config.appearance.textColor }}>
          {config.welcomeMessage}
        </h2>
        <p className="text-muted-foreground">How can we help you today?</p>
      </div>

      <div className="space-y-3">
        {hasChat && (
          <>
            <h3 className="font-medium text-sm text-muted-foreground">Chat with Us</h3>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={onSelectChat}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" style={{ color: config.appearance.primaryColor }} />
                  {config.chatbot.botName}
                </CardTitle>
                <CardDescription>{config.chatbot.greetingMessage}</CardDescription>
              </CardHeader>
            </Card>
          </>
        )}

        {hasBooking && (
          <>
            <h3 className="font-medium text-sm text-muted-foreground mt-6">Book an Appointment</h3>
            {config.features.appointmentTypes.map((type: any) => (
              <Card
                key={type.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectBooking(type)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
          </>
        )}

        {hasForms && (
          <>
            <h3 className="font-medium text-sm text-muted-foreground mt-6">Contact Forms</h3>
            {config.features.forms.map((form: any) => (
              <Card
                key={form.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectForm(form)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {form.name}
                  </CardTitle>
                  {form.description && (
                    <CardDescription>{form.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Booking View Component (simplified version)
function BookingView({ widgetId, appointmentType, config, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [customFormFields, setCustomFormFields] = useState<any[]>([]);
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomFields();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

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

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/appointments/available-slots?widgetId=${widgetId}&appointmentTypeId=${appointmentType.id}&date=${format(selectedDate, 'yyyy-MM-dd')}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    // Validate required custom fields
    const missingFields = customFormFields.filter(
      (field) => field.required && !formResponses[field.id]
    );
    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const startTime = parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);

      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId,
          appointmentTypeId: appointmentType.id,
          startTime: startTime.toISOString(),
          visitorName: formData.name,
          visitorEmail: formData.email,
          visitorPhone: formData.phone,
          notes: formData.notes,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          formResponses: Object.keys(formResponses).length > 0 ? formResponses : undefined,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field: any) => {
    const value = formResponses[field.id] || '';
    const updateValue = (newValue: any) => {
      setFormResponses({ ...formResponses, [field.id]: newValue });
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

  // Simplified date picker (showing next 30 days)
  const next30Days = Array.from({ length: 30 }, (_, i) => addDays(startOfDay(new Date()), i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">{appointmentType.name}</h2>
        <p className="text-sm text-muted-foreground">{appointmentType.duration} minutes</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-medium">Select a date</h3>
          <div className="grid grid-cols-3 gap-2">
            {next30Days.map((date) => (
              <Button
                key={date.toISOString()}
                variant={selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                  setStep(2);
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

      {step === 2 && selectedDate && (
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
              {availableSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedTime(time);
                    setStep(3);
                  }}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-medium">Your information</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
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
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            )}
            {customFormFields.map((field) => renderCustomField(field))}
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
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.email || submitting}
            style={{ backgroundColor: config.appearance.primaryColor }}
          >
            {submitting ? 'Booking...' : 'Book Appointment'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Form View Component
function FormView({ form, config, onSuccess }: any) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const fields = form.fields as Array<{ id: string; label: string; required: boolean }>;
    const missingFields = fields.filter((field) => field.required && !formData[field.id]);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map((f) => f.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          data: formData,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';
    const updateValue = (newValue: any) => {
      setFormData({ ...formData, [field.id]: newValue });
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
              rows={4}
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">{form.name}</h2>
        {form.description && (
          <p className="text-sm text-muted-foreground">{form.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {form.fields.map((field: any) => renderField(field))}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={submitting}
        style={{ backgroundColor: config.appearance.primaryColor }}
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}

// Success View Component
function SuccessView({ config, onClose }: any) {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="flex justify-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: config.appearance.primaryColor + '20' }}
        >
          <Check className="h-8 w-8" style={{ color: config.appearance.primaryColor }} />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">Success!</h2>
        <p className="text-muted-foreground">
          Thank you for your submission. We'll be in touch soon.
        </p>
      </div>
      <Button onClick={onClose} style={{ backgroundColor: config.appearance.primaryColor }}>
        Close
      </Button>
    </div>
  );
}

// Chat View Component
function ChatView({ widgetId, config }: any) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [visitorId] = useState(() => `visitor-${Date.now()}-${Math.random()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    // Add initial greeting
    if (config.chatbot?.greetingMessage) {
      setMessages([{ role: 'assistant', content: config.chatbot.greetingMessage }]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId,
          visitorId,
          messages: newMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      } else {
        const errorData = await response.json();
        setMessages([
          ...newMessages,
          { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'bg-muted'
              }`}
              style={
                msg.role === 'user'
                  ? { backgroundColor: config.appearance.primaryColor }
                  : {}
              }
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <p className="text-sm text-muted-foreground">Typing...</p>
            </div>
          </div>
        )}
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          disabled={loading}
          className="text-foreground"
          style={{ color: '#000000' }}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{ backgroundColor: config.appearance.primaryColor }}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
