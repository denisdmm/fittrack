'use client';
import { BarChart, Dumbbell, Activity, Calendar, PlusCircle } from 'lucide-react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { ProgressRecord, Workout } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WorkoutForm } from './workouts/_components/workout-form';

const chartConfig = {
  volume: {
    label: 'Volume (x1000 kg)',
    color: 'hsl(var(--primary))',
  },
};

export default function DashboardPage() {
  const { user } = useAppContext();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const progressCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.id}/workout_logs`);
  }, [firestore, user]);

  const { data: progress, isLoading: isProgressLoading } = useCollection<ProgressRecord>(progressCollectionRef);

  const chartData = useMemo(() => {
    if (!progress) return [];
    return progress.slice(-7).map(p => ({ date: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit'}), volume: p.volume / 1000 }));
  }, [progress]);

  const totalWorkouts = progress?.length || 0;
  const totalVolume = progress?.reduce((acc, p) => acc + p.volume, 0).toLocaleString('pt-BR') || '0';
  const totalMinutes = progress?.reduce((acc, p) => acc + p.duration, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Bem-vindo(a) de volta, {user?.firstName}!</h1>
        <p className="text-muted-foreground">Aqui está um resumo da sua atividade recente.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              +10% vs. último mês
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
              +15% vs. último mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Treino</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Amanhã</div>
            <p className="text-xs text-muted-foreground">
              Cardio Queima-Calorias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Comece um Novo Treino</CardTitle>
            <CardDescription>
              Escolha um treino da biblioteca ou crie o seu próprio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm text-muted-foreground">
                Pronto para suar? Pegue um treino predefinido ou crie um que se alinhe perfeitamente com seus objetivos de hoje.
            </p>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="flex gap-4">
                    <Button asChild className="w-full">
                        <Link href="/dashboard/workouts">Ver Biblioteca</Link>
                    </Button>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                             <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Treino
                        </Button>
                    </DialogTrigger>
                </div>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Treino</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes para criar uma nova rotina de treino.
                        </DialogDescription>
                    </DialogHeader>
                    <WorkoutForm onFinished={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
