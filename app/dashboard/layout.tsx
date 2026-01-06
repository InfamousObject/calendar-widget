import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/login');
  }

  const user = await currentUser();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <DashboardNav />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <DashboardHeader user={{
          name: user?.fullName || user?.firstName || 'User',
          email: user?.emailAddresses[0]?.emailAddress || '',
          image: user?.imageUrl,
        }} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
