'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  RefreshCw,
  Trash2,
  Shield,
  User,
  Mail,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ChangeRoleDialog } from './change-role-dialog';
import { MemberSettingsDialog } from './member-settings-dialog';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  receiveNotifications: boolean;
  invitedAt: string;
  joinedAt: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface TeamMembersListProps {
  members: TeamMember[];
  isOwner: boolean;
  isAdmin: boolean;
  onMemberUpdated?: () => void;
}

export function TeamMembersList({
  members,
  isOwner,
  isAdmin,
  onMemberUpdated,
}: TeamMembersListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleResendInvite = async (memberId: string) => {
    setActionLoading(memberId);

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resendInvitation: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      toast.success('Invitation resent');
      onMemberUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    setActionLoading(memberId);

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      toast.success('Member removed');
      onMemberUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No team members yet</p>
        <p className="text-sm mt-1">Invite your first team member to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {members.map((member) => {
        const isPending = member.status === 'pending';
        const displayName = member.user?.name || member.name || member.email;
        const displayEmail = member.user?.email || member.email;
        const isLoading = actionLoading === member.id;

        return (
          <div
            key={member.id}
            className="flex items-center justify-between py-4 px-2"
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {member.role === 'admin' ? (
                  <Shield className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayName}</span>
                  <Badge
                    variant={member.role === 'admin' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {member.role}
                  </Badge>
                  {isPending && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {displayEmail}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              {!isPending && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                  Joined {new Date(member.joinedAt!).toLocaleDateString()}
                </span>
              )}

              {/* Actions dropdown */}
              {(isOwner || isAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Settings */}
                    <MemberSettingsDialog
                      member={member}
                      onUpdated={onMemberUpdated}
                    >
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <User className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </MemberSettingsDialog>

                    {/* Change Role (owner only) */}
                    {isOwner && (
                      <ChangeRoleDialog
                        member={member}
                        onRoleChanged={onMemberUpdated}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                      </ChangeRoleDialog>
                    )}

                    {/* Resend Invite (pending only) */}
                    {isPending && (
                      <DropdownMenuItem onClick={() => handleResendInvite(member.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                    )}

                    {/* Remove (owner only) */}
                    {isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.id, member.email)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
