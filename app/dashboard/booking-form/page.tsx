'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

export default function BookingFormPage() {
  const [fields, setFields] = useState<BookingFormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // New field form state
  const [newField, setNewField] = useState({
    label: '',
    fieldType: 'text' as BookingFormField['fieldType'],
    placeholder: '',
    required: false,
    options: [] as string[],
  });
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await fetch('/api/booking-form/fields');
      if (response.ok) {
        const data = await response.json();
        setFields(data.fields);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    console.log('Adding field:', newField);

    // Validate select fields have at least one option
    if (newField.fieldType === 'select' && newField.options.length === 0) {
      alert('Dropdown fields must have at least one option');
      return;
    }

    setSaving(true);
    try {
      // Clean up the data - don't send empty options array for non-select fields
      const fieldData = {
        ...newField,
        options: newField.fieldType === 'select' ? newField.options : undefined,
      };

      const response = await fetch('/api/booking-form/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        console.log('Field added successfully');
        await fetchFields();
        setShowAddDialog(false);
        // Reset form
        setNewField({
          label: '',
          fieldType: 'text',
          placeholder: '',
          required: false,
          options: [],
        });
        setOptionInput('');
      } else {
        const errorData = await response.json();
        console.error('Failed to add field:', errorData);
        alert(`Failed to add field: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding field:', error);
      alert('Failed to add field. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const response = await fetch(`/api/booking-form/fields/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchFields();
      }
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  const handleToggleRequired = async (field: BookingFormField) => {
    try {
      const response = await fetch(`/api/booking-form/fields/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required: !field.required }),
      });

      if (response.ok) {
        await fetchFields();
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewField({
        ...newField,
        options: [...newField.options, optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options.filter((_, i) => i !== index),
    });
  };

  const renderFieldPreview = (field: BookingFormField) => {
    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'phone':
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
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Booking Form Builder</h1>
            <p className="text-muted-foreground mt-1">
              Add custom fields to your appointment booking form
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Custom Field</DialogTitle>
                  <DialogDescription>
                    Create a new field for your booking form
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Field Label *</Label>
                    <Input
                      id="label"
                      value={newField.label}
                      onChange={(e) =>
                        setNewField({ ...newField, label: e.target.value })
                      }
                      placeholder="e.g., Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fieldType">Field Type *</Label>
                    <Select
                      value={newField.fieldType}
                      onValueChange={(value: BookingFormField['fieldType']) =>
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
                      placeholder="e.g., Enter your company name"
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
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                        />
                        <Button type="button" onClick={addOption}>
                          Add
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {newField.options.map((option, idx) => (
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
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddField}
                    disabled={!newField.label || saving}
                  >
                    {saving ? 'Adding...' : 'Add Field'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Custom Form Fields</CardTitle>
            <CardDescription>
              These fields will appear on your booking page after the default
              fields (name, email, phone, notes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No custom fields yet</p>
                <p className="text-sm mt-1">
                  Click "Add Field" to create your first custom field
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRequired(field)}
                      >
                        {field.required ? 'Make Optional' : 'Make Required'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Form Preview</DialogTitle>
              <DialogDescription>
                This is how your booking form will look to visitors
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Default fields */}
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Your name" disabled />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="your@email.com" disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="(555) 123-4567" disabled />
              </div>

              {/* Custom fields */}
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label} {field.required && '*'}
                  </Label>
                  {renderFieldPreview(field)}
                </div>
              ))}

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea placeholder="Any special requests?" disabled />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
