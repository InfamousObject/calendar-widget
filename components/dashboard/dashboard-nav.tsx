'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarCheck,
  FileText,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Palette,
  CreditCard,
  Clock,
  BookOpen,
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Appointments',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'Availability',
    href: '/dashboard/availability',
    icon: Clock,
  },
  {
    title: 'Calendar Integration',
    href: '/dashboard/calendar',
    icon: CalendarCheck,
  },
  {
    title: 'Contact Forms',
    href: '/dashboard/forms',
    icon: FileText,
  },
  {
    title: 'Chatbot',
    href: '/dashboard/chatbot',
    icon: MessageSquare,
  },
  {
    title: 'Knowledge Base',
    href: '/dashboard/knowledge',
    icon: BookOpen,
  },
  {
    title: 'Widget Settings',
    href: '/dashboard/widget',
    icon: Palette,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r bg-card lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-lg font-bold">SmartWidget</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
