'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessage = error
    ? 'Authentication failed. Please try again.'
    : 'An unknown error occurred.';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-warning/5 to-destructive/5 p-4">
      {/* Decorative background elements */}
      <div className="gradient-mesh absolute inset-0 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-warning/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-destructive/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl shadow-destructive/10 border-2 border-destructive/20 bg-surface/80 backdrop-blur-sm animate-fadeInUp">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive/10 to-warning/10 border-2 border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="font-display text-3xl font-semibold tracking-tight text-destructive">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-base mt-3">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <p className="text-sm text-foreground-secondary text-center">
                If this problem persists, please{' '}
                <a
                  href="mailto:support@smartwidget.com"
                  className="text-primary hover:text-accent font-medium transition-colors duration-200"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Link href="/auth/login" className="w-full">
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign in
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full border-border hover:border-primary/30 transition-all duration-200">
                Go to Homepage
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Help text */}
        <p className="text-center mt-6 text-sm text-foreground-tertiary animate-fadeInUp" style={{ animationDelay: '100ms' }}>
          Need help?{' '}
          <a href="/help" className="text-primary hover:text-accent font-medium transition-colors duration-200">
            Visit our help center
          </a>
        </p>
      </div>
    </div>
  );
}
