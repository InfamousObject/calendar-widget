'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  X,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Rocket,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface SetupTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link: string;
  icon: React.ElementType;
}

interface SetupChecklistProps {
  onComplete?: () => void;
}

export function SetupChecklist({ onComplete }: SetupChecklistProps) {
  const [tasks, setTasks] = useState<SetupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if checklist was dismissed
    const dismissed = localStorage.getItem('setup-checklist-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    fetchSetupStatus();
  }, []);

  const fetchSetupStatus = async () => {
    try {
      // Fetch calendar connection status
      const calendarResponse = await fetch('/api/calendar/connections');
      const calendarData = await calendarResponse.json();
      const hasCalendar = Array.isArray(calendarData) ? calendarData.length > 0 : false;

      // Fetch appointment types
      const appointmentTypesResponse = await fetch('/api/appointment-types');
      const appointmentTypesData = await appointmentTypesResponse.json();
      const hasAppointmentTypes = appointmentTypesData.appointmentTypes?.length > 0;

      // Fetch contact forms
      const formsResponse = await fetch('/api/forms');
      const formsData = await formsResponse.json();
      const hasForms = formsData.forms?.length > 0;

      const setupTasks: SetupTask[] = [
        {
          id: 'calendar',
          title: 'Connect Google Calendar',
          description: 'Sync appointments with your Google Calendar',
          completed: hasCalendar,
          link: '/dashboard/calendar',
          icon: Calendar,
        },
        {
          id: 'appointment-type',
          title: 'Create Appointment Type',
          description: 'Set up your first service or meeting type',
          completed: hasAppointmentTypes,
          link: '/dashboard/appointments',
          icon: Clock,
        },
        {
          id: 'contact-form',
          title: 'Create Contact Form',
          description: 'Build a custom form for lead collection',
          completed: hasForms,
          link: '/dashboard/forms',
          icon: FileText,
        },
      ];

      setTasks(setupTasks);

      // If all tasks completed, call onComplete callback
      const allCompleted = setupTasks.every((task) => task.completed);
      if (allCompleted && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error fetching setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('setup-checklist-dismissed', 'true');
    setIsDismissed(true);
  };

  const handleRestore = () => {
    localStorage.removeItem('setup-checklist-dismissed');
    setIsDismissed(false);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = (completedCount / totalCount) * 100;
  const allCompleted = completedCount === totalCount;

  // Don't show if all tasks are completed
  if (allCompleted) {
    return null;
  }

  // Show restore button if dismissed
  if (isDismissed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        className="mb-6"
      >
        Show Setup Checklist
      </Button>
    );
  }

  return (
    <Card className="relative border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden mb-8">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl" />

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <div className="w-14 h-14 rounded-xl bg-primary/20" />
              </div>
              <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                <Rocket className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="font-display text-2xl font-semibold">
                Complete Your Setup
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {completedCount} of {totalCount} essential tasks completed
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-10 w-10 rounded-lg hover:bg-background/50"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mt-6">
          <div className="relative h-3 rounded-full bg-border overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out shadow-lg shadow-primary/30"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {progressPercentage.toFixed(0)}% complete
            </p>
            <p className="text-xs text-foreground-tertiary">
              {totalCount - completedCount} task{totalCount - completedCount !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-3">
          {tasks.map((task, index) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className={`group flex items-start gap-4 rounded-xl border-2 p-5 transition-all duration-300 ${
                  task.completed
                    ? 'bg-success/5 border-success/30 shadow-sm'
                    : 'bg-surface border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Status icon */}
                <div className="mt-1">
                  {task.completed ? (
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping">
                        <div className="w-6 h-6 rounded-full bg-success/20" />
                      </div>
                      <div className="relative w-6 h-6 rounded-full bg-success flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border group-hover:border-primary transition-colors duration-200" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg transition-all duration-200 ${
                      task.completed
                        ? 'bg-success/10'
                        : 'bg-primary/10 group-hover:bg-primary group-hover:scale-110'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        task.completed
                          ? 'text-success'
                          : 'text-primary group-hover:text-white'
                      } transition-colors duration-200`} />
                    </div>
                    <h3 className={`font-semibold ${
                      task.completed ? 'text-success' : 'text-foreground'
                    }`}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {task.description}
                  </p>
                </div>

                {/* Action button */}
                {!task.completed ? (
                  <Link href={task.link}>
                    <Button
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                    >
                      Setup
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={task.link}>
                    <Button size="sm" variant="outline" className="gap-2">
                      View
                    </Button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Encouragement message */}
        {completedCount > 0 && completedCount < totalCount && (
          <div className="mt-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Great progress!
                </p>
                <p className="text-sm text-foreground-secondary">
                  Complete the remaining {totalCount - completedCount} task{totalCount - completedCount !== 1 ? 's' : ''} to unlock the full potential of Kentroi.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
