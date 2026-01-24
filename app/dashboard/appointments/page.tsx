'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Check, X, Calendar, Clock, AlertCircle, DollarSign, Video, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AppointmentType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
  bufferBefore: number;
  bufferAfter: number;
  active: boolean;
  enableGoogleMeet?: boolean;
  // Payment fields
  price?: number | null;
  currency?: string;
  requirePayment?: boolean;
  depositPercent?: number | null;
  refundPolicy?: string;
}

interface TierInfo {
  current: string;
  canAcceptPayments: boolean;
  upgradeMessage?: string;
}

export default function AppointmentsPage() {
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    color: '#3b82f6',
    bufferBefore: 0,
    bufferAfter: 0,
    active: true,
    enableGoogleMeet: false,
    // Payment settings
    price: null as number | null,
    currency: 'usd',
    requirePayment: false,
    depositPercent: null as number | null,
    refundPolicy: 'full',
  });

  useEffect(() => {
    fetchAppointmentTypes();
    fetchTierInfo();
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

  const fetchTierInfo = async () => {
    try {
      const response = await fetch('/api/stripe/connect');
      if (response.ok) {
        const data = await response.json();
        if (data.tier) {
          setTierInfo(data.tier);
        }
      }
    } catch (error) {
      console.error('Error fetching tier info:', error);
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
        const errorData = await response.json();
        if (errorData.requiresUpgrade) {
          toast.error('Please upgrade to a Booking or Bundle plan to accept payments');
          // Refresh tier info
          await fetchTierInfo();
        } else {
          toast.error(errorData.error || 'Failed to save appointment type');
        }
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
      enableGoogleMeet: type.enableGoogleMeet || false,
      // Payment settings
      price: type.price ?? null,
      currency: type.currency || 'usd',
      requirePayment: type.requirePayment || false,
      depositPercent: type.depositPercent ?? null,
      refundPolicy: type.refundPolicy || 'full',
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
      enableGoogleMeet: false,
      price: null,
      currency: 'usd',
      requirePayment: false,
      depositPercent: null,
      refundPolicy: 'full',
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Helper to format price for display (cents to dollars)
  const formatPrice = (cents: number | null | undefined) => {
    if (cents === null || cents === undefined) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
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

              {/* Google Meet Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="enableGoogleMeet" className="text-sm font-medium">
                      Google Meet
                    </Label>
                    <p className="text-xs text-foreground-secondary">
                      Automatically create a Google Meet link for this appointment
                    </p>
                  </div>
                </div>
                <Switch
                  id="enableGoogleMeet"
                  checked={formData.enableGoogleMeet}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableGoogleMeet: checked })
                  }
                />
              </div>

              {/* Payment Settings Section */}
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                {tierInfo && !tierInfo.canAcceptPayments ? (
                  // Upgrade prompt for free/chatbot users
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Lock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Payment Settings</Label>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            <Sparkles className="h-3 w-3" />
                            Premium
                          </span>
                        </div>
                        <p className="text-xs text-foreground-secondary">
                          Accept payments for appointments with Booking and Bundle plans
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/billing">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Upgrade to Enable
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // Payment settings for booking/bundle users
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <Label htmlFor="requirePayment" className="text-sm font-medium">
                            Require Payment
                          </Label>
                          <p className="text-xs text-foreground-secondary">
                            Collect payment when customers book this appointment
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="requirePayment"
                        checked={formData.requirePayment}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, requirePayment: checked })
                        }
                      />
                    </div>

                    {formData.requirePayment && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
                                $
                              </span>
                              <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0.50"
                                placeholder="0.00"
                                className="pl-7"
                                value={formData.price ? (formData.price / 100).toFixed(2) : ''}
                                onChange={(e) => {
                                  const dollars = parseFloat(e.target.value);
                                  setFormData({
                                    ...formData,
                                    price: isNaN(dollars) ? null : Math.round(dollars * 100),
                                  });
                                }}
                              />
                            </div>
                            <p className="text-xs text-foreground-secondary">
                              Minimum $0.50 (Stripe requirement)
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <select
                              id="currency"
                              value={formData.currency}
                              onChange={(e) =>
                                setFormData({ ...formData, currency: e.target.value })
                              }
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="usd">USD ($)</option>
                              <option value="eur">EUR (&euro;)</option>
                              <option value="gbp">GBP (&pound;)</option>
                              <option value="cad">CAD ($)</option>
                              <option value="aud">AUD ($)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="depositPercent">Deposit Percentage (Optional)</Label>
                            <div className="relative">
                              <Input
                                id="depositPercent"
                                type="number"
                                min="1"
                                max="100"
                                placeholder="100"
                                value={formData.depositPercent ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({
                                    ...formData,
                                    depositPercent: value === '' ? null : parseInt(value),
                                  });
                                }}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
                                %
                              </span>
                            </div>
                            <p className="text-xs text-foreground-secondary">
                              Leave empty for full payment upfront
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="refundPolicy">Refund Policy</Label>
                            <select
                              id="refundPolicy"
                              value={formData.refundPolicy}
                              onChange={(e) =>
                                setFormData({ ...formData, refundPolicy: e.target.value })
                              }
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="full">Full Refund (100%)</option>
                              <option value="partial">Partial Refund (50%)</option>
                              <option value="none">No Refund</option>
                            </select>
                            <p className="text-xs text-foreground-secondary">
                              Applied when customer cancels
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-xl font-semibold">{type.name}</h3>
                      {type.enableGoogleMeet && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400">
                          <Video className="h-3 w-3" />
                          Meet
                        </span>
                      )}
                      {type.requirePayment && type.price && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium dark:bg-green-900/30 dark:text-green-400">
                          <DollarSign className="h-3 w-3" />
                          {formatPrice(type.price)}
                        </span>
                      )}
                    </div>
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
                      {type.depositPercent && (
                        <span className="text-foreground-tertiary">
                          • {type.depositPercent}% deposit
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
