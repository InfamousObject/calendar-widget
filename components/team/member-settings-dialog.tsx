'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  receiveNotifications: boolean;
}

interface MemberSettingsDialogProps {
  member: TeamMember;
  onUpdated?: () => void;
  children: React.ReactNode;
}

export function MemberSettingsDialog({
  member,
  onUpdated,
  children,
}: MemberSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiveNotifications, setReceiveNotifications] = useState(
    member.receiveNotifications
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (receiveNotifications === member.receiveNotifications) {
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiveNotifications }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      toast.success('Settings updated');
      setOpen(false);
      onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Member Settings</DialogTitle>
            <DialogDescription>
              Configure settings for {member.name || member.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Notifications Setting */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="notifications" className="font-medium">
                    Booking Notifications
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications when new bookings are made
                </p>
              </div>
              <Switch
                id="notifications"
                checked={receiveNotifications}
                onCheckedChange={setReceiveNotifications}
              />
            </div>

            {/* Info box */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {receiveNotifications
                  ? 'This member will receive email notifications for new bookings, cancellations, and reminders.'
                  : 'This member will not receive any booking notification emails.'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || receiveNotifications === member.receiveNotifications}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
