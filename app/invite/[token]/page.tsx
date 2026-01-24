'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface InvitationDetails {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  invitedAt: string;
  expiresAt: string;
  account: {
    ownerName: string | null;
    businessName: string | null;
  };
}

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/team/accept?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid invitation');
        return;
      }

      setInvitation(data.invitation);
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);

    try {
      const response = await fetch('/api/team/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setAccepted(true);
      toast.success('Invitation accepted!');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              This invitation may have expired or already been used.
            </p>
            <Link href="/">
              <Button variant="outline">Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Accepted state
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined {invitation?.account.businessName || 'the team'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Redirecting you to the dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const accountName = invitation?.account.businessName || invitation?.account.ownerName || 'the team';

  // Invitation details
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
          <CardDescription className="text-base">
            Join <strong>{accountName}</strong> on Kentroi
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invited by</span>
              <span className="text-sm font-medium">{invitation?.account.ownerName || 'Team Owner'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your role</span>
              <Badge variant={invitation?.role === 'admin' ? 'default' : 'secondary'}>
                {invitation?.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
            </div>

            {invitation?.name && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invited as</span>
                <span className="text-sm font-medium">{invitation.name}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invitation for</span>
              <span className="text-sm font-medium">{invitation?.email}</span>
            </div>
          </div>

          {/* Role Description */}
          <p className="text-sm text-muted-foreground text-center">
            {invitation?.role === 'admin'
              ? 'As an admin, you can manage appointments, customize the widget, and invite other team members.'
              : 'As a member, you can view and create appointments, and connect your calendar for availability.'}
          </p>

          {/* Actions */}
          {isSignedIn ? (
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full"
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign in or create an account to accept this invitation
              </p>
              <div className="flex gap-3">
                <SignInButton mode="modal" forceRedirectUrl={`/invite/${token}`}>
                  <Button variant="outline" className="flex-1">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal" forceRedirectUrl={`/invite/${token}`}>
                  <Button className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            </div>
          )}

          {/* Expiry Notice */}
          {invitation?.expiresAt && (
            <p className="text-xs text-center text-muted-foreground">
              This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
