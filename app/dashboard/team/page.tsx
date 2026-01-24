'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, UserPlus, Crown, AlertTriangle, Loader2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { InviteMemberDialog } from '@/components/team/invite-member-dialog';
import { TeamMembersList } from '@/components/team/team-members-list';
import { usePermissions } from '@/hooks/use-permissions';
import Link from 'next/link';

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

interface TeamData {
  members: TeamMember[];
  owner: {
    id: string;
    name: string | null;
    email: string;
    businessName: string | null;
  } | null;
  seats: {
    used: number;
    total: number;
    canAddMore: boolean;
  };
  tier?: {
    current: string;
    canInviteMembers: boolean;
    upgradeMessage?: string;
  };
}

export default function TeamPage() {
  const { isOwner, isAdmin, loading: permissionsLoading, can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamData | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const teamData = await response.json();
        setData(teamData);
      } else if (response.status === 403) {
        // User doesn't have permission to view team
        setData(null);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading || permissionsLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-24 rounded-xl bg-muted" />
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  // Permission check
  if (!can('team:view')) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground text-center max-w-md">
                You don't have permission to manage team settings. Please contact your team owner for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading team data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const seatPercentage = data.seats.total > 0 ? (data.seats.used / data.seats.total) * 100 : 0;
  const isAtSeatLimit = !data.seats.canAddMore;
  const requiresUpgrade = data.tier && !data.tier.canInviteMembers;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8">
          <div className="gradient-mesh absolute inset-0 -z-10" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight">Team</h1>
            </div>
            <p className="text-lg text-foreground-secondary font-light">
              Manage your team members and collaboration settings
            </p>
          </div>
        </div>

        {/* Upgrade Banner for Free/Chatbot Users */}
        {requiresUpgrade && (
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-lg">
            <CardContent className="py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Team Members - Premium Feature
                    </h2>
                    <p className="text-muted-foreground">
                      Team members are available on Booking and Bundle plans. Upgrade to collaborate with your team.
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/billing">
                  <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seat Usage Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Team Seats</CardTitle>
                  <CardDescription className="text-base">
                    {data.seats.used} of {data.seats.total} seats used
                  </CardDescription>
                </div>
              </div>
              {can('team:invite') && !requiresUpgrade && (
                <InviteMemberDialog
                  canAddMore={data.seats.canAddMore}
                  seatsUsed={data.seats.used}
                  seatsTotal={data.seats.total}
                  onInviteSent={fetchTeamData}
                />
              )}
              {can('team:invite') && requiresUpgrade && (
                <Link href="/dashboard/billing">
                  <Button variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Upgrade to Invite
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={seatPercentage} className="h-2" />

              {isAtSeatLimit && (
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100">
                        You've reached your seat limit
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Add more seats to invite additional team members
                      </p>
                    </div>
                  </div>
                  {isOwner && (
                    <Link href="/dashboard/billing">
                      <Button variant="outline" size="sm">
                        Add Seats
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Owner Card */}
        {data.owner && (
          <Card className="border-border shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Crown className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="font-display text-xl">Account Owner</CardTitle>
                  <CardDescription className="text-base">
                    The primary owner of this account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{data.owner.name || 'Account Owner'}</span>
                    <Badge variant="default" className="bg-amber-500">Owner</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{data.owner.email}</p>
                  {data.owner.businessName && (
                    <p className="text-sm text-muted-foreground">{data.owner.businessName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members Card */}
        <Card className="border-border shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserPlus className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Team Members</CardTitle>
                <CardDescription className="text-base">
                  People who can access and manage your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TeamMembersList
              members={data.members}
              isOwner={isOwner}
              isAdmin={isAdmin}
              onMemberUpdated={fetchTeamData}
            />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-border bg-muted/30">
          <CardContent className="py-6">
            <div className="space-y-4 text-sm text-muted-foreground">
              <h3 className="font-medium text-foreground">About Team Roles</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-background rounded-lg">
                  <p className="font-medium text-foreground mb-1">Admin</p>
                  <p>Can manage appointments, customize settings, and invite new members.</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="font-medium text-foreground mb-1">Member</p>
                  <p>Can view and create appointments, and connect their own calendar.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
