'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Dumbbell,
  Home,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAppContext } from '@/context/app-provider';
import { Badge } from '../ui/badge';


const navItems = [
  { href: '/dashboard', icon: Home, label: 'Painel' },
  { href: '/dashboard/workouts', icon: Dumbbell, label: 'Treinos' },
  { href: '/dashboard/progress', icon: BarChart3, label: 'Progresso' },
  { href: '/dashboard/profile', icon: Settings, label: 'Perfil' },
];

const adminNavItems = [
  { href: '/dashboard/admin/users', icon: Users, label: 'Usuários' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useAppContext();

  const renderNavItem = (item: { href: string, icon: React.ElementType, label: string }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link key={item.href} href={item.href}>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className="w-full justify-start"
        >
          <Icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block dark:bg-card">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo />
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map(renderNavItem)}
            {role === 'admin' && (
              <>
                <div className="my-2 ml-4 text-xs text-muted-foreground uppercase">Admin</div>
                {adminNavItems.map(renderNavItem)}
              </>
            )}
          </nav>
        </div>
        <div className="mt-auto p-4">
            <div className="text-center text-xs text-muted-foreground">
                <p>&copy; 2024 FitTrack Firestore</p>
            </div>
        </div>
      </div>
    </div>
  );
}
