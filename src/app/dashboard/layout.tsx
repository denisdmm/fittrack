'use client';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { WorkoutLogger } from '@/components/workout-logger';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAppContext } from '@/context/app-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeWorkout } = useAppContext();

  return (
      <SidebarProvider>
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] dark:bg-background">
          <AppSidebar />
          <div className="flex flex-col">
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
              {children}
            </main>
          </div>
        </div>
        {activeWorkout && <WorkoutLogger />}
      </SidebarProvider>
  );
}
