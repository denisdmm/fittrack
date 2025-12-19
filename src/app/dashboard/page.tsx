
'use client';
import { BarChart, Dumbbell, Activity, Calendar, PlusCircle, PlayCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart as RechartsBarChart, XAxis, YAxis, Bar, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useAppContext } from '@/context/app-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import type { ProgressRecord, Workout, WorkoutPlan } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WorkoutForm } from './admin/workouts/_components/workout-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const chartConfig = {
  volume: {
    label: 'Volume (x1000 kg)',
    color: 'hsl(var(--primary))',
  },
};

export default function DashboardPage() {
  const { user, setActiveWorkout, role } = useAppContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // --- Data Fetching ---
  const progressCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.id}/workout_logs`);
  }, [firestore, user]);

  const { data: progress, isLoading: isProgressLoading } = useCollection<ProgressRecord>(progressCollectionRef);
  
  const activePlanRef = useMemoFirebase(() => {
    if (!firestore || !user?.activeWorkoutPlanId) return null;
    return doc(firestore, 'workout_routines_public', user.activeWorkoutPlanId);
  }, [firestore, user?.activeWorkoutPlanId]);

  const { data: activePlan, isLoading: isPlanLoading } = useDoc<WorkoutPlan>(activePlanRef);

  const lastLogRef = useMemoFirebase(() => {
    if (!progressCollectionRef) return null;
    return query(progressCollectionRef, orderBy('date', 'desc'), limit(1));
  }, [progressCollectionRef]);
  
  const { data: lastLog, isLoading: isLastLogLoading } = useCollection<ProgressRecord>(lastLogRef);

  // --- Memoized Calculations ---
  const chartData = useMemo(() => {
    if (!progress) return [];
    // Sort progress by date just in case and take the last 7
    return progress.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7).map(p => ({ date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit'}), volume: p.volume / 1000 }));
  }, [progress]);

  const totalWorkouts = progress?.length || 0;
  const totalVolume = progress?.reduce((acc, p) => acc + p.volume, 0).toLocaleString('pt-BR') || '0';
  const totalMinutes = progress?.reduce((acc, p) => acc + p.duration, 0) || 0;

  const nextWorkoutSession = useMemo(() => {
    if (!activePlan || !activePlan.sessions) return null;
    
    const lastSessionTag = lastLog?.[0]?.sessionTag;
    if (!lastSessionTag) {
        // If there's no log, the next session is the first one in the plan
        return activePlan.sessions[0];
    }

    const sessionTags = activePlan.sessions.map(s => s.sessionTag);
    const lastIndex = sessionTags.indexOf(lastSessionTag);
    
    // If the last session is not in the plan or is the last one, loop back to the first
    const nextIndex = (lastIndex === -1 || lastIndex === sessionTags.length - 1) ? 0 : lastIndex + 1;
    
    return activePlan.sessions[nextIndex];

  }, [activePlan, lastLog]);
  
  const handleStartNextWorkout = () => {
    if (!nextWorkoutSession || !activePlan) {
        toast({ title: 'Nenhum treino para iniciar', description: 'Selecione um plano de treino ativo na biblioteca.', variant: 'destructive'});
        return;
    }

    // We need to create a `Workout` object from the `WorkoutPlan` and `WorkoutSession`
    const workoutToStart: Workout = {
        id: activePlan.id,
        name: `${activePlan.name} - Sessão ${nextWorkoutSession.sessionTag}`,
        description: activePlan.description,
        difficultyLevel: activePlan.difficultyLevel,
        exerciseIds: nextWorkoutSession.exerciseIds,
        exercises: [], // This will be populated by the logger
        sessionTag: nextWorkoutSession.sessionTag,
        image: activePlan.image,
        imageHint: activePlan.imageHint,
    };
    
    setActiveWorkout(workoutToStart);
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Bem-vindo(a) de volta, {user?.firstName}!</h1>
        <p className="text-muted-foreground">Aqui está um resumo da sua atividade recente.</p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Comece seu próximo treino ou explore outras opções.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Button size="lg" onClick={handleStartNextWorkout} disabled={!nextWorkoutSession}>
                <PlayCircle className="mr-2 h-5 w-5" />
                Iniciar Próximo Treino
             </Button>
            <p className="text-sm text-muted-foreground text-center">
                ou
            </p>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="flex gap-4">
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/dashboard/athlete/workouts">Ver Biblioteca</Link>
                    </Button>
                    {role === 'admin' && (
                      <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Criar Plano
                          </Button>
                      </DialogTrigger>
                    )}
                </div>
                <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Plano de Treino</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes para criar uma nova rotina de treino.
                        </DialogDescription>
                    </DialogHeader>
                    <WorkoutForm onFinished={() => setIsDialogOpen(false)} workoutPlan={null} />
                </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Total de Treinos
                </CardTitle>
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{isProgressLoading ? '...' : totalWorkouts}</div>
                <p className="text-xs text-muted-foreground">
                Continue assim!
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total (Kg)</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{isProgressLoading ? '...' : totalVolume}</div>
                <p className="text-xs text-muted-foreground">
                Volume total acumulado.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Minutos Treinados</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{isProgressLoading ? '...' : totalMinutes}</div>
                <p className="text-xs text-muted-foreground">
                Tempo total em atividade.
                </p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximo Treino</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isPlanLoading || isLastLogLoading ? (
                    <Skeleton className="h-6 w-3/4" />
                ) : (
                    <>
                    <div className="text-2xl font-bold">
                        {nextWorkoutSession ? `Sessão ${nextWorkoutSession.sessionTag}` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {activePlan ? activePlan.name : 'Selecione um plano ativo'}
                    </p>
                    </>
                )}
            </CardContent>
            </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Visão Geral do Volume de Treino</CardTitle>
            <CardDescription>Seu volume total levantado nos últimos 7 treinos.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer>
                <RechartsBarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
                </RechartsBarChart>
            </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
        </Card>
    </div>
  );
}
