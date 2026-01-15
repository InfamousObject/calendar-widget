'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section with Gradient */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
            </div>
            <p className="text-lg text-foreground-secondary font-light">
              Customize your Kentroi experience
            </p>
          </div>
        </div>

        {/* Appearance Settings */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="font-display text-xl">Appearance</CardTitle>
                <CardDescription className="text-base">Customize the look and feel of your dashboard</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Theme</Label>

              {/* Theme Options */}
              <div className="grid grid-cols-3 gap-3">
                {/* Light Theme */}
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <Sun className="h-5 w-5 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="p-3 rounded-lg bg-gray-900 border border-gray-700 shadow-sm">
                    <Moon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </button>

                {/* System Theme */}
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === 'system'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-900 border border-gray-300 shadow-sm">
                    <Monitor className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                {theme === 'system'
                  ? `Using your system preference (currently ${resolvedTheme})`
                  : `Using ${theme} mode`}
              </p>
            </div>

            {/* Quick Toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode-toggle" className="text-sm font-medium">
                  Quick Toggle
                </Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <Switch
                id="dark-mode-toggle"
                checked={resolvedTheme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
