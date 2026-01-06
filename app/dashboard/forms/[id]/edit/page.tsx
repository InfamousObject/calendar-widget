'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical, Eye, ArrowLeft, Save, FileEdit, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface FormField {
  id: string;
  label: string;
  fieldType: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'number' | 'url';
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
    emailNotifications: boolean;
    notificationEmail?: string;
  };
  active: boolean;
}

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // New field state
  const [newField, setNewField] = useState<Omit<FormField, 'id'>>({
    label: '',
    fieldType: 'text',
    placeholder: '',
    required: false,
    options: [],
  });
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
      } else {
        toast.error('Form not found');
        router.push('/dashboard/forms');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast.error('Field label is required');
      return;
    }

    if (newField.fieldType === 'select' && (!newField.options || newField.options.length === 0)) {
      toast.error('Dropdown fields must have at least one option');
      return;
    }

    const field: FormField = {
      id: `field-${Date.now()}`,
      ...newField,
      options: newField.fieldType === 'select' ? newField.options : undefined,
    };

    setForm((prev) => prev ? { ...prev, fields: [...prev.fields, field] } : null);
    setShowAddDialog(false);
    setNewField({
      label: '',
      fieldType: 'text',
      placeholder: '',
      required: false,
      options: [],
    });
    setOptionInput('');
  };

  const handleRemoveField = (fieldId: string) => {
    setForm((prev) =>
      prev ? { ...prev, fields: prev.fields.filter((f) => f.id !== fieldId) } : null
    );
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewField({
        ...newField,
        options: [...(newField.options || []), optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setNewField({
      ...newField,
      options: (newField.options || []).filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!form) return;

    if (form.fields.length === 0) {
      toast.error('Add at least one field before saving');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Form saved successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const renderFieldPreview = (field: FormField) => {
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'url':
        return (
          <Input
            type={field.fieldType}
            placeholder={field.placeholder || field.label}
            disabled
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || field.label}
            disabled
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} disabled />
            <label htmlFor={field.id} className="text-sm">
              {field.label}
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 h-96 rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-32 rounded-xl bg-muted" />
              <div className="h-48 rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/forms')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <FileEdit className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="font-display text-4xl font-semibold tracking-tight">{form.name}</h1>
                </div>
                {form.description && (
                  <p className="text-lg text-foreground-secondary font-light">{form.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Form'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form Builder */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileEdit className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl">Form Fields</CardTitle>
                      <CardDescription className="text-base">
                        Add and configure fields for your contact form
                      </CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {form.fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No fields yet</p>
                    <p className="text-sm mt-1">
                      Click "Add Field" to create your first field
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{field.label}</p>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {field.fieldType}
                            </span>
                            {field.required && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          {field.placeholder && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Placeholder: {field.placeholder}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(field.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Eye className="h-5 w-5 text-success" />
                  </div>
                  <CardTitle className="font-display text-xl">Form Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={form.active}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, active: checked as boolean })
                    }
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    Form is active
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Inactive forms won't accept submissions
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Settings className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="font-display text-xl">Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="successMessage">Success Message</Label>
                  <Textarea
                    id="successMessage"
                    value={form.settings.successMessage}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, successMessage: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emailNotifications"
                      checked={form.settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            emailNotifications: checked as boolean,
                          },
                        })
                      }
                    />
                    <Label htmlFor="emailNotifications" className="cursor-pointer">
                      Email notifications
                    </Label>
                  </div>
                </div>

                {form.settings.emailNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      type="email"
                      value={form.settings.notificationEmail || ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            notificationEmail: e.target.value,
                          },
                        })
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Field Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Field</DialogTitle>
              <DialogDescription>
                Configure a new field for your form
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Field Label *</Label>
                <Input
                  id="label"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="e.g., Full Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fieldType">Field Type *</Label>
                <Select
                  value={newField.fieldType}
                  onValueChange={(value: FormField['fieldType']) =>
                    setNewField({ ...newField, fieldType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={newField.placeholder}
                  onChange={(e) =>
                    setNewField({ ...newField, placeholder: e.target.value })
                  }
                  placeholder="e.g., Enter your full name"
                />
              </div>

              {newField.fieldType === 'select' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex gap-2">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      placeholder="Add an option"
                      onKeyPress={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addOption())
                      }
                    />
                    <Button type="button" onClick={addOption}>
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {newField.options?.map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={newField.required}
                  onCheckedChange={(checked) =>
                    setNewField({ ...newField, required: checked as boolean })
                  }
                />
                <Label htmlFor="required" className="cursor-pointer">
                  Required field
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddField} disabled={!newField.label}>
                Add Field
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Form Preview</DialogTitle>
              <DialogDescription>
                This is how your form will look to visitors
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label} {field.required && '*'}
                  </Label>
                  {renderFieldPreview(field)}
                </div>
              ))}
              {form.fields.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No fields to preview
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
