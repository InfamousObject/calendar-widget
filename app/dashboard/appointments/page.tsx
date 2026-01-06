'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Check, X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
  bufferBefore: number;
  bufferAfter: number;
  active: boolean;
}

export default function AppointmentsPage() {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    color: '#3b82f6',
    bufferBefore: 0,
    bufferAfter: 0,
    active: true,
  });

  useEffect(() => {
    fetchAppointmentTypes();
  }, []);

  const fetchAppointmentTypes = async () => {
    try {
      const response = await fetch('/api/appointment-types');
      if (response.ok) {
        const data = await response.json();
        setAppointmentTypes(data.appointmentTypes || data);
      }
    } catch (error) {
      console.error('Error fetching appointment types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/appointment-types/${editingId}`
        : '/api/appointment-types';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'Appointment type updated successfully' : 'Appointment type created successfully');
        await fetchAppointmentTypes();
        resetForm();
      } else {
        toast.error('Failed to save appointment type');
      }
    } catch (error) {
      console.error('Error saving appointment type:', error);
      toast.error('Failed to save appointment type');
    }
  };

  const handleEdit = (type: AppointmentType) => {
    setFormData({
      name: type.name,
      description: type.description || '',
      duration: type.duration,
      color: type.color,
      bufferBefore: type.bufferBefore,
      bufferAfter: type.bufferAfter,
      active: type.active,
    });
    setEditingId(type.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    // Use toast with confirmation instead of alert
    const confirmDelete = window.confirm('Are you sure you want to delete this appointment type?');
    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/appointment-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Appointment type deleted successfully');
        await fetchAppointmentTypes();
      } else {
        toast.error('Failed to delete appointment type');
      }
    } catch (error) {
      console.error('Error deleting appointment type:', error);
      toast.error('Failed to delete appointment type');
    }
  };

  const toggleActive = async (type: AppointmentType) => {
    try {
      const response = await fetch(`/api/appointment-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !type.active }),
      });

      if (response.ok) {
        toast.success(`Appointment type ${!type.active ? 'activated' : 'deactivated'}`);
        await fetchAppointmentTypes();
      } else {
        toast.error('Failed to update appointment type');
      }
    } catch (error) {
      console.error('Error updating appointment type:', error);
      toast.error('Failed to update appointment type');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 30,
      color: '#3b82f6',
      bufferBefore: 0,
      bufferAfter: 0,
      active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
        <div className="gradient-mesh absolute inset-0 -z-10" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-display text-4xl font-semibold tracking-tight">Appointment Types</h2>
            </div>
            <p className="text-lg text-foreground-secondary font-light">
              Manage your appointment types and durations
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Appointment Type
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-primary/20 shadow-lg shadow-primary/5 animate-fadeInUp">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {editingId ? 'Edit Appointment Type' : 'New Appointment Type'}
            </CardTitle>
            <CardDescription className="text-base">
              {editingId ? 'Update the details below' : 'Create a new appointment type for your calendar'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="30-min Consultation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                    }
                    required
                    min={5}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this appointment type"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bufferBefore">Buffer Before (min)</Label>
                  <Input
                    id="bufferBefore"
                    type="number"
                    value={formData.bufferBefore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bufferBefore: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bufferAfter">Buffer After (min)</Label>
                  <Input
                    id="bufferAfter"
                    type="number"
                    value={formData.bufferAfter}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bufferAfter: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {appointmentTypes.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-2xl bg-primary/10 mb-4">
                <Calendar className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">No appointment types yet</h3>
              <p className="text-foreground-secondary mb-6 text-center max-w-md">
                Create your first appointment type to start accepting bookings
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Appointment Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          appointmentTypes.map((type, index) => (
            <Card
              key={type.id}
              className="group border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fadeInUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-5 flex-1">
                  <div
                    className="h-14 w-14 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105"
                    style={{ backgroundColor: type.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold mb-1">{type.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {type.duration} minutes
                      </span>
                      {type.bufferBefore > 0 && (
                        <span className="text-foreground-tertiary">
                          • {type.bufferBefore}m buffer before
                        </span>
                      )}
                      {type.bufferAfter > 0 && (
                        <span className="text-foreground-tertiary">
                          • {type.bufferAfter}m buffer after
                        </span>
                      )}
                    </div>
                    {type.description && (
                      <p className="mt-2 text-sm text-foreground-secondary">
                        {type.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(type)}
                    className={type.active ? 'border-success text-success hover:bg-success/10' : 'border-muted-foreground/50'}
                  >
                    {type.active ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="mr-1.5 h-4 w-4" />
                        Inactive
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
                    className="hover:border-primary hover:text-primary transition-all duration-200"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="hover:border-destructive hover:text-destructive transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
