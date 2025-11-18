'use client';

import Link from 'next/link';
import {
  BarChart3,
  Dumbbell,
  Home,
  Menu,
  Package2,
  Settings,
  Users,
  UserCheck,
  UserCog
} from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '../logo';
import { useAppContext } from '@/context/app-provider';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Painel' },
  { href: '/dashboard/workouts', icon: Dumbbell, label: 'Treinos' },
  { href: '/dashboard/progress', icon: BarChart3, label: 'Progresso' },
  { href: '/dashboard/profile', icon: Settings, label: 'Perfil' },
];

const adminNavItems = [
  { href: '/dashboard/admin/users', icon: Users, label: 'Usuários' },
];

export function AppHeader() {
    const { role, setRole, user } = useAppContext();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 dark:bg-card">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Logo />
              <span className="sr-only">FitTrack</span>
            </Link>
            {navItems.map(item => (
                <Link
                key={item.label}
                href={item.href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                <item.icon className="h-5 w-5" />
                {item.label}
                </Link>
            ))}
             {role === 'admin' && (
              <>
                <div className="my-2 ml-2 text-sm text-muted-foreground uppercase">Admin</div>
                {adminNavItems.map(item => (
                    <Link
                    key={item.label}
                    href={item.href}
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                    </Link>
                ))}
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        {/* Can add Breadcrumbs or Search here */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Image
                src={`https://picsum.photos/seed/${user?.id ?? '1'}/100/100`}
                width={36}
                height={36}
                alt="Avatar"
                className="rounded-full"
                data-ai-hint="person portrait"
              />
            <span className="sr-only">Alternar menu de usuário</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/dashboard/profile">Perfil</Link></DropdownMenuItem>
          <DropdownMenuItem>Suporte</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/">Sair</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
