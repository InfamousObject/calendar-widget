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
import { Palette, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WidgetSettings {
  id: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
  position: string;
  offsetX: number;
  offsetY: number;
  showOnMobile: boolean;
  delaySeconds: number;
  logoUrl?: string;
  businessName?: string;
  welcomeMessage: string;
  timeFormat: string;
  requirePhone: boolean;
  showNotes: boolean;
}

export default function WidgetSettingsPage() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/widget/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/widget/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'Your widget settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Widget Settings</h1>
            <p className="text-muted-foreground mt-1">
              Customize your booking widget appearance and behavior
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-6">
          {/* Branding Section */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Set your business name and welcome message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, businessName: e.target.value })
                  }
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={(e) =>
                    setSettings({ ...settings, welcomeMessage: e.target.value })
                  }
                  placeholder="Welcome! Book an appointment with us"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (optional)</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={settings.logoUrl || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, logoUrl: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize colors and styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) =>
                        setSettings({ ...settings, primaryColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) =>
                        setSettings({ ...settings, backgroundColor: e.target.value })
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) =>
                        setSettings({ ...settings, backgroundColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={settings.textColor}
                      onChange={(e) =>
                        setSettings({ ...settings, textColor: e.target.value })
                      }
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.textColor}
                      onChange={(e) =>
                        setSettings({ ...settings, textColor: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Select
                    value={settings.borderRadius}
                    onValueChange={(value) =>
                      setSettings({ ...settings, borderRadius: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sharp">Sharp (0px)</SelectItem>
                      <SelectItem value="medium">Medium (8px)</SelectItem>
                      <SelectItem value="rounded">Rounded (16px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(value) =>
                      setSettings({ ...settings, fontFamily: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="open-sans">Open Sans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>
                Configure booking form behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <Select
                  value={settings.timeFormat}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timeFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requirePhone"
                    checked={settings.requirePhone}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, requirePhone: checked as boolean })
                    }
                  />
                  <Label htmlFor="requirePhone" className="cursor-pointer font-normal">
                    Require phone number
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showNotes"
                    checked={settings.showNotes}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showNotes: checked as boolean })
                    }
                  />
                  <Label htmlFor="showNotes" className="cursor-pointer font-normal">
                    Show notes field
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showOnMobile"
                    checked={settings.showOnMobile}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showOnMobile: checked as boolean })
                    }
                  />
                  <Label htmlFor="showOnMobile" className="cursor-pointer font-normal">
                    Show widget on mobile devices
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Widget Position Section */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Position (Future)</CardTitle>
              <CardDescription>
                Configure where the widget appears on your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={settings.position}
                    onValueChange={(value) =>
                      setSettings({ ...settings, position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offsetX">Horizontal Offset (px)</Label>
                  <Input
                    id="offsetX"
                    type="number"
                    value={settings.offsetX}
                    onChange={(e) =>
                      setSettings({ ...settings, offsetX: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offsetY">Vertical Offset (px)</Label>
                  <Input
                    id="offsetY"
                    type="number"
                    value={settings.offsetY}
                    onChange={(e) =>
                      setSettings({ ...settings, offsetY: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delaySeconds">Display Delay (seconds)</Label>
                <Input
                  id="delaySeconds"
                  type="number"
                  value={settings.delaySeconds}
                  onChange={(e) =>
                    setSettings({ ...settings, delaySeconds: parseInt(e.target.value) })
                  }
                  min="0"
                />
                <p className="text-sm text-muted-foreground">
                  How long to wait before showing the widget after page load
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
