'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { ProgressRecord } from '@/lib/types';
import { useAppContext } from '@/context/app-provider';
import { useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { resetUserHistory } from '@/ai/flows/reset-user-history-flow';

const chartConfig = {
  Volume: {
    label: 'Volume (kg)',
    color: 'hsl(var(--primary))',
  },
  Duração: {
    label: 'Duração (min)',
    color: 'hsl(var(--accent))',
  },
};

export default function ProgressPage() {
  const { user } = useAppContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const progressCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.id}/workout_logs`);
  }, [firestore, user]);
  
  const { data: progress, isLoading } = useCollection<ProgressRecord>(progressCollectionRef);

  const volumeData = useMemo(() => {
    if (!progress) return [];
    return progress.map(p => ({
      date: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      Volume: p.volume
    }));
  }, [progress]);

  const durationData = useMemo(() => {
    if (!progress) return [];
    return progress.map(p => ({
      date: new Date(p.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      Duração: p.duration
    }));
  }, [progress]);

  const handleResetHistory = async () => {
    if (!user) return;
    try {
      const result = await resetUserHistory({ userId: user.id });
      if (result.success) {
        toast({ title: "Histórico Resetado", description: "Seu histórico de treinos foi limpo com sucesso." });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Erro", description: `Falha ao resetar o histórico: ${error.message}`, variant: "destructive" });
    }
    setIsAlertOpen(false);
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Seu Progresso</h1>
          <p className="text-muted-foreground">Visualize sua jornada e celebre suas conquistas.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Volume de Treino ao Longo do Tempo</CardTitle>
              <CardDescription>Volume total levantado (peso x séries x reps) por treino.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer>
                  <LineChart data={volumeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="Volume" stroke="var(--color-Volume)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Duração do Treino</CardTitle>
              <CardDescription>Tempo gasto em cada sessão de treino em minutos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer>
                  <BarChart data={durationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="Duração" fill="var(--color-Duração)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
              <CardTitle>Histórico de Treinos</CardTitle>
              <CardDescription>Um registro detalhado de suas sessões de treino recentes.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsAlertOpen(true)} disabled={!progress || progress.length === 0}>
                <History className="mr-2 h-4 w-4" />
                Resetar Histórico
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Treino</TableHead>
                  <TableHead className="text-right">Duração (min)</TableHead>
                  <TableHead className="text-right">Volume (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>
                    <TableRow><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>
                  </>
                )}
                {progress && progress.length > 0 ? (
                    progress.slice().reverse().map((log, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{new Date(log.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{log.workoutName}</TableCell>
                        <TableCell className="text-right">{log.duration}</TableCell>
                        <TableCell className="text-right">{log.volume.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    !isLoading && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum treino registrado ainda.
                        </TableCell>
                    </TableRow>
                    )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é uma ação irreversível. Todos os seus registros de treinos, volume e duração serão apagados permanentemente. Não será possível recuperar seus dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetHistory} className="bg-destructive hover:bg-destructive/90">
              Sim, apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
