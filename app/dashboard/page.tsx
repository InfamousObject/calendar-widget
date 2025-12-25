import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, MessageSquare, Users } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Fetch dashboard stats
  const [appointmentsCount, formsCount, submissionsCount, user] =
    await Promise.all([
      prisma.appointment.count({
        where: { userId: session.user.id },
      }),
      prisma.form.count({
        where: { userId: session.user.id },
      }),
      prisma.formSubmission.count({
        where: { userId: session.user.id },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { widgetId: true, businessName: true },
      }),
    ]);

  const stats = [
    {
      title: 'Total Appointments',
      value: appointmentsCount,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      title: 'Contact Forms',
      value: formsCount,
      icon: FileText,
      color: 'text-green-500',
    },
    {
      title: 'Form Submissions',
      value: submissionsCount,
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: 'Conversations',
      value: 0,
      icon: MessageSquare,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {session.user.name}!
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your SmartWidget account
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Widget ID Card */}
      {user?.widgetId && (
        <Card>
          <CardHeader>
            <CardTitle>Your Widget ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Use this ID to embed your widget on your website:
            </p>
            <code className="block rounded-md bg-muted p-4 text-sm">
              {user.widgetId}
            </code>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/dashboard/appointments"
              className="flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors hover:bg-accent"
            >
              <Calendar className="mb-2 h-8 w-8 text-primary" />
              <span className="font-medium">Manage Appointments</span>
            </a>
            <a
              href="/dashboard/forms"
              className="flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors hover:bg-accent"
            >
              <FileText className="mb-2 h-8 w-8 text-primary" />
              <span className="font-medium">Create Form</span>
            </a>
            <a
              href="/dashboard/widget"
              className="flex flex-col items-center justify-center rounded-lg border p-6 text-center transition-colors hover:bg-accent"
            >
              <MessageSquare className="mb-2 h-8 w-8 text-primary" />
              <span className="font-medium">Customize Widget</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
