'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormData {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings: {
    successMessage: string;
  };
}

export default function EmbedFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/embed/form/${formId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    // Validate required fields
    const missingFields = form.fields.filter(
      (field) => field.required && !formData[field.id]
    );

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
        setSubmitted(true);
        setFormData({});
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

  const renderField = (field: FormField) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading form...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Form not found</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Success!</h2>
          <p className="text-muted-foreground mb-6">
            {form.settings.successMessage}
          </p>
          <Button onClick={() => setSubmitted(false)}>
            Submit Another Response
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.name}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.fields.map((field) => renderField(field))}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
