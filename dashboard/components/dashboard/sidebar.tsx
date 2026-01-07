'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  BarChart3,
  Database,
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: FileText,
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Data Sources',
    href: '/dashboard/data-sources',
    icon: Database,
  },
];

const bottomItems = [
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo/Brand - minimal */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">RV</span>
          </div>
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Items */}
      <div className="border-t p-3">
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-secondary-foreground"
            onClick={() => {
              // Logout logic here
              console.log('Logout clicked');
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
