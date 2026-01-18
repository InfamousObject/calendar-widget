'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Moon, Sun, Monitor, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const router = useRouter();
  const { signOut } = useClerk();

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        // Sign out and redirect to home
        await signOut();
        router.push('/');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

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

        {/* Danger Zone */}
        <Card className="border-destructive/50 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="font-display text-xl text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-base">Irreversible actions for your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-destructive">Are you sure you want to delete your account?</p>
                    <p className="text-sm text-muted-foreground">
                      This action cannot be undone. This will permanently delete your account,
                      all your data, calendar connections, appointments, and remove your access
                      to connected services.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-delete" className="text-sm">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </Label>
                  <input
                    id="confirm-delete"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmText('');
                    }}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting || confirmText !== 'DELETE'}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
