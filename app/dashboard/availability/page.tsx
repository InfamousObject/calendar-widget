'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';

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
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
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
        await fetchData();
        setShowOverrideForm(false);
        setOverrideForm({
          date: '',
          isAvailable: false,
          startTime: '',
          endTime: '',
          reason: '',
        });
      }
    } catch (error) {
      console.error('Error adding override:', error);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Delete this date override?')) return;

    try {
      await fetch(`/api/date-overrides/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting override:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Availability Settings</h2>
        <p className="text-muted-foreground">
          Set your weekly schedule and date-specific overrides
        </p>
      </div>

      {/* Timezone Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>
            Select your local timezone for appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="mt-2 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Set your regular weekly availability
              </CardDescription>
            </div>
            <Button onClick={handleSaveSchedule} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((dayName, dayOfWeek) => (
              <div
                key={dayOfWeek}
                className="flex items-center gap-4 rounded-lg border p-4"
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Date Overrides</CardTitle>
              <CardDescription>
                Set specific dates with different availability (vacations, special hours)
              </CardDescription>
            </div>
            <Button onClick={() => setShowOverrideForm(!showOverrideForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Override
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showOverrideForm && (
            <form onSubmit={handleAddOverride} className="mb-6 rounded-lg border p-4">
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

              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOverrideForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Override</Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {dateOverrides.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No date overrides set
              </p>
            ) : (
              dateOverrides.map((override) => (
                <div
                  key={override.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(override.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {override.isAvailable
                        ? `Available ${override.startTime || ''} - ${
                            override.endTime || ''
                          }`
                        : 'Unavailable'}
                      {override.reason && ` • ${override.reason}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteOverride(override.id)}
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
