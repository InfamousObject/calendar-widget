'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  LayoutDashboard,
  Palette,
  CreditCard,
  Clock,
  BookOpen,
  ClipboardList,
  Code2,
  Wallet,
  Users,
  HelpCircle,
} from 'lucide-react';
import { SupportButton } from '@/components/support/support-button';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarDays,
  },
  {
    title: 'Appointment Types',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'Availability',
    href: '/dashboard/availability',
    icon: Clock,
  },
  {
    title: 'Booking Form',
    href: '/dashboard/booking-form',
    icon: ClipboardList,
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
    title: 'Booking Page Settings',
    href: '/dashboard/widget',
    icon: Palette,
  },
  {
    title: 'Embed Code',
    href: '/dashboard/embed',
    icon: Code2,
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    title: 'Payments',
    href: '/dashboard/settings/payments',
    icon: Wallet,
  },
  {
    title: 'Team',
    href: '/dashboard/team',
    icon: Users,
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
    <aside className="hidden w-72 border-r border-border bg-surface lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <img src="/kentroi-logomark.png" alt="Kentroi" className="h-9 w-9 transition-transform group-hover:scale-110" />
            <div>
              <img src="/kentroi-wordmark.png" alt="Kentroi" className="h-6" />
              <p className="text-xs text-foreground-tertiary">One embed, endless possibilities</p>
            </div>
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
                  'group relative flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25'
                    : 'text-foreground-secondary hover:bg-surface-elevated hover:text-foreground'
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-white" : "text-foreground-tertiary group-hover:text-primary",
                  "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.title}</span>

                {/* Hover effect */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
            <p className="text-xs font-medium text-foreground mb-2">Need help?</p>
            <p className="text-xs text-foreground-secondary mb-3">
              Check our docs or reach out to support
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-accent transition-colors"
              >
                View Docs →
              </Link>
              <span className="text-foreground-tertiary">|</span>
              <SupportButton variant="ghost" size="sm" showLabel />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
