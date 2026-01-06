'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, AlertCircle, Clock, Calendar as CalendarIcon, Globe, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DateOverride {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>([]);
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Weekly schedule state (one entry per day)
  const [weeklySchedule, setWeeklySchedule] = useState<
    Record<number, { enabled: boolean; startTime: string; endTime: string }>
  >({
    0: { enabled: false, startTime: '09:00', endTime: '17:00' },
    1: { enabled: true, startTime: '09:00', endTime: '17:00' },
    2: { enabled: true, startTime: '09:00', endTime: '17:00' },
    3: { enabled: true, startTime: '09:00', endTime: '17:00' },
    4: { enabled: true, startTime: '09:00', endTime: '17:00' },
    5: { enabled: true, startTime: '09:00', endTime: '17:00' },
    6: { enabled: false, startTime: '09:00', endTime: '17:00' },
  });

  // Date override form
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    date: '',
    isAvailable: false,
    startTime: '',
    endTime: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, availabilityRes, overridesRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/availability'),
        fetch('/api/date-overrides'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setTimezone(userData.timezone || 'America/New_York');
      }

      if (availabilityRes.ok) {
        const availabilityData = await availabilityRes.json();
        setAvailability(availabilityData);

        // Populate weekly schedule from availability data
        const schedule = { ...weeklySchedule };
        availabilityData.forEach((item: Availability) => {
          schedule[item.dayOfWeek] = {
            enabled: item.isAvailable,
            startTime: item.startTime,
            endTime: item.endTime,
          };
        });
        setWeeklySchedule(schedule);
      }

      if (overridesRes.ok) {
        const overridesData = await overridesRes.json();
        setDateOverrides(overridesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: newTimezone }),
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
    }
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    try {
      // Delete all existing availability
      await Promise.all(
        availability.map((item) =>
          fetch(`/api/availability/${item.id}`, { method: 'DELETE' })
        )
      );

      // Create new availability for each enabled day
      const promises = Object.entries(weeklySchedule)
        .filter(([_, day]) => day.enabled)
        .map(([dayOfWeek, day]) =>
          fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dayOfWeek: parseInt(dayOfWeek),
              startTime: day.startTime,
              endTime: day.endTime,
              isAvailable: true,
            }),
          })
        );

      await Promise.all(promises);
      await fetchData();
      toast.success('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/date-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date(overrideForm.date).toISOString(),
          isAvailable: overrideForm.isAvailable,
          startTime: overrideForm.startTime || undefined,
          endTime: overrideForm.endTime || undefined,
          reason: overrideForm.reason || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Date override added successfully');
        await fetchData();
        setShowOverrideForm(false);
        setOverrideForm({
          date: '',
          isAvailable: false,
          startTime: '',
          endTime: '',
          reason: '',
        });
      } else {
        toast.error('Failed to add date override');
      }
    } catch (error) {
      console.error('Error adding override:', error);
      toast.error('Failed to add date override');
    }
  };

  const handleDeleteOverride = async (id: string) => {
    const confirmDelete = window.confirm('Delete this date override?');
    if (!confirmDelete) return;

    try {
      await fetch(`/api/date-overrides/${id}`, { method: 'DELETE' });
      toast.success('Date override deleted successfully');
      await fetchData();
    } catch (error) {
      console.error('Error deleting override:', error);
      toast.error('Failed to delete date override');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-48 rounded-xl bg-muted" />
        <div className="h-96 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  const hasAnyAvailability = availability.length > 0;

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
        <div className="gradient-mesh absolute inset-0 -z-10" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-tight">Availability Settings</h2>
          </div>
          <p className="text-lg text-foreground-secondary font-light">
            Set your weekly schedule and date-specific overrides
          </p>
        </div>
      </div>

      {!hasAnyAvailability && (
        <Card className="border-warning/30 bg-warning/5 animate-fadeInUp">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-warning/20">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No availability configured
                </h3>
                <p className="text-foreground-secondary">
                  Your booking page won't show any available dates until you save your weekly schedule below.
                  Enable at least one day and click "Save Schedule" to start accepting bookings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timezone Selector */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Globe className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="font-display text-xl">Timezone</CardTitle>
              <CardDescription className="text-base">
                Select your local timezone for appointments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="mt-2 flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="text-black dark:text-white bg-white dark:bg-gray-800">
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Weekly Schedule</CardTitle>
                <CardDescription className="text-base">
                  Set your regular weekly availability
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSaveSchedule}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((dayName, dayOfWeek) => (
              <div
                key={dayOfWeek}
                className="flex items-center gap-4 rounded-xl border border-border p-4 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`day-${dayOfWeek}`}
                    checked={weeklySchedule[dayOfWeek].enabled}
                    onChange={(e) =>
                      setWeeklySchedule({
                        ...weeklySchedule,
                        [dayOfWeek]: {
                          ...weeklySchedule[dayOfWeek],
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label
                    htmlFor={`day-${dayOfWeek}`}
                    className="w-24 font-medium"
                  >
                    {dayName}
                  </Label>
                </div>

                {weeklySchedule[dayOfWeek].enabled && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">From</Label>
                      <Input
                        type="time"
                        value={weeklySchedule[dayOfWeek].startTime}
                        onChange={(e) =>
                          setWeeklySchedule({
                            ...weeklySchedule,
                            [dayOfWeek]: {
                              ...weeklySchedule[dayOfWeek],
                              startTime: e.target.value,
                            },
                          })
                        }
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">To</Label>
                      <Input
                        type="time"
                        value={weeklySchedule[dayOfWeek].endTime}
                        onChange={(e) =>
                          setWeeklySchedule({
                            ...weeklySchedule,
                            [dayOfWeek]: {
                              ...weeklySchedule[dayOfWeek],
                              endTime: e.target.value,
                            },
                          })
                        }
                        className="w-32"
                      />
                    </div>
                  </div>
                )}

                {!weeklySchedule[dayOfWeek].enabled && (
                  <span className="text-sm text-muted-foreground">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date Overrides */}
      <Card className="border-border shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CalendarIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Date Overrides</CardTitle>
                <CardDescription className="text-base">
                  Set specific dates with different availability (vacations, special hours)
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="bg-gradient-to-r from-accent to-accent/90 hover:shadow-lg hover:shadow-accent/30 transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showOverrideForm && (
            <form onSubmit={handleAddOverride} className="mb-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 animate-fadeInUp">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="override-date">Date</Label>
                  <Input
                    id="override-date"
                    type="date"
                    value={overrideForm.date}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="override-reason">Reason (Optional)</Label>
                  <Input
                    id="override-reason"
                    placeholder="Vacation, Holiday, etc."
                    value={overrideForm.reason}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, reason: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="override-available"
                  checked={overrideForm.isAvailable}
                  onChange={(e) =>
                    setOverrideForm({
                      ...overrideForm,
                      isAvailable: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="override-available">Available on this date</Label>
              </div>

              {overrideForm.isAvailable && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="override-start">Start Time</Label>
                    <Input
                      id="override-start"
                      type="time"
                      value={overrideForm.startTime}
                      onChange={(e) =>
                        setOverrideForm({
                          ...overrideForm,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="override-end">End Time</Label>
                    <Input
                      id="override-end"
                      type="time"
                      value={overrideForm.endTime}
                      onChange={(e) =>
                        setOverrideForm({
                          ...overrideForm,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOverrideForm(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Override
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {dateOverrides.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-muted/30 border-2 border-dashed border-muted-foreground/25">
                <div className="p-3 rounded-xl bg-accent/10 inline-flex mb-3">
                  <CalendarIcon className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm text-foreground-secondary">
                  No date overrides set
                </p>
              </div>
            ) : (
              dateOverrides.map((override, index) => (
                <div
                  key={override.id}
                  className="group flex items-center justify-between rounded-xl border border-border p-4 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-300 animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-lg">
                        {new Date(override.date).toLocaleDateString()}
                      </p>
                      <Badge variant={override.isAvailable ? 'default' : 'secondary'} className="text-xs">
                        {override.isAvailable ? (
                          <><Check className="h-3 w-3 mr-1" /> Available</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Unavailable</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      {override.isAvailable && override.startTime && override.endTime
                        ? `${override.startTime} - ${override.endTime}`
                        : override.isAvailable ? 'All day' : 'Blocked'}
                      {override.reason && ` • ${override.reason}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteOverride(override.id)}
                    className="hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
