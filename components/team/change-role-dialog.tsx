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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface ChangeRoleDialogProps {
  member: TeamMember;
  onRoleChanged?: () => void;
  children: React.ReactNode;
}

export function ChangeRoleDialog({
  member,
  onRoleChanged,
  children,
}: ChangeRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(member.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === member.role) {
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      toast.success(`${member.name || member.email}'s role changed to ${role}`);
      setOpen(false);
      onRoleChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
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
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {member.name || member.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Member</span>
                      <span className="text-xs text-muted-foreground">
                        Can view and create appointments
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">
                        Can manage appointments, settings, and invite others
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {role === 'admin' ? (
                  <>
                    <strong>Admin permissions:</strong> View and manage all appointments,
                    customize widget settings, manage knowledge base, and invite team members.
                  </>
                ) : (
                  <>
                    <strong>Member permissions:</strong> View appointments, create new
                    bookings, and connect their own calendar for availability.
                  </>
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || role === member.role}>
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
