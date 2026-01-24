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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
  canAddMore: boolean;
  seatsUsed: number;
  seatsTotal: number;
  onInviteSent?: () => void;
  children?: React.ReactNode;
}

export function InviteMemberDialog({
  canAddMore,
  seatsUsed,
  seatsTotal,
  onInviteSent,
  children,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${email}`);
      setOpen(false);
      setEmail('');
      setName('');
      setRole('member');
      onInviteSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button disabled={!canAddMore}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team. They'll receive an email with a link to accept.
            </DialogDescription>
          </DialogHeader>

          {!canAddMore && (
            <div className="flex items-center gap-2 p-3 mt-4 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm">
                You've used all {seatsTotal} seats. Add more seats to invite additional members.
              </p>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!canAddMore}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canAddMore}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as 'admin' | 'member')}
                disabled={!canAddMore}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex flex-col">
                      <span>Member</span>
                      <span className="text-xs text-muted-foreground">Can view and create appointments</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span>Admin</span>
                      <span className="text-xs text-muted-foreground">Can manage appointments, settings, and invite others</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canAddMore || !email}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
