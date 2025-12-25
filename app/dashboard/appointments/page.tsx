'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

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
        setAppointmentTypes(data);
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
        await fetchAppointmentTypes();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving appointment type:', error);
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
    if (!confirm('Are you sure you want to delete this appointment type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/appointment-types/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAppointmentTypes();
      }
    } catch (error) {
      console.error('Error deleting appointment type:', error);
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
        await fetchAppointmentTypes();
      }
    } catch (error) {
      console.error('Error updating appointment type:', error);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointment Types</h2>
          <p className="text-muted-foreground">
            Manage your appointment types and durations
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment Type
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Appointment Type' : 'New Appointment Type'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      setFormData({ ...formData, duration: parseInt(e.target.value) })
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
                        bufferBefore: parseInt(e.target.value),
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
                        bufferAfter: parseInt(e.target.value),
                      })
                    }
                    min={0}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {appointmentTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                No appointment types yet. Create one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          appointmentTypes.map((type) => (
            <Card key={type.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div
                    className="h-12 w-12 rounded-lg"
                    style={{ backgroundColor: type.color }}
                  />
                  <div>
                    <h3 className="font-semibold">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.duration} minutes
                      {type.bufferBefore > 0 &&
                        ` • ${type.bufferBefore}m before`}
                      {type.bufferAfter > 0 && ` • ${type.bufferAfter}m after`}
                    </p>
                    {type.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
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
                  >
                    {type.active ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" />
                        Inactive
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
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
