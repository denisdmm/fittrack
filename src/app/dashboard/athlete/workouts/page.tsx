'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, Search, PlayCircle, Eye, CheckCircle, LayoutGrid, List } from 'lucide-react';
import { useMemo, useState } from 'react';
import { collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Workout, WorkoutPlan } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Routine = Workout | WorkoutPlan;

function isPlan(item: Routine): item is WorkoutPlan {
    return 'sessions' in item && Array.isArray(item.sessions);
}

export default function AthleteWorkoutsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, setActiveWorkout } = useAppContext();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const workoutsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'workout_routines_public');
    }, [firestore]);
    
    const { data: routines, isLoading } = useCollection<WorkoutPlan>(workoutsCollectionRef);

    const handleStartWorkout = (workout: Workout) => {
        setActiveWorkout(workout);
        toast({
            title: "Treino Iniciado!",
            description: `A sessão "${workout.name}" foi adicionada ao seu logger.`,
        });
    }

  return (
    <TooltipProvider>
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Biblioteca de Treinos</h1>
          <p className="text-muted-foreground">Encontre a rotina perfeita para você e comece a treinar.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar treinos..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[280px]"
              />
            </div>
             <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grade</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8">
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Lista</TooltipContent>
                </Tooltip>
             </div>
        </div>
      </div>
      
        {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden h-full flex flex-col">
                        <CardHeader className="p-0">
                            <Skeleton className="h-48 w-full" />
                        </CardHeader>
                        <CardContent className="p-4 flex-grow">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-6 w-20" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {routines && routines.map((routine) => (
                <Card key={routine.id} className="overflow-hidden h-full flex flex-col group transition-all hover:shadow-xl">
                <div className="relative">
                    <Link href={`/dashboard/athlete/workouts/${routine.id}`} className='absolute inset-0 z-10' aria-label={`Ver detalhes de ${routine.name}`}/>
                    
                    {user?.activeWorkoutPlanId === routine.id && (
                        <div className="absolute top-2 left-2 z-20">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Ativo
                            </Badge>
                        </div>
                    )}
                    <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                        <Image
                            src={routine.image || "https://picsum.photos/seed/1/600/400"}
                            alt={routine.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            data-ai-hint={routine.imageHint}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-4">
                            <Badge variant={routine.difficultyLevel === 'Iniciante' ? 'default' : routine.difficultyLevel === 'Intermediário' ? 'secondary' : 'destructive'} className="bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">{routine.difficultyLevel}</Badge>
                        </div>
                        </div>
                    </CardHeader>
                </div>

                <Link href={`/dashboard/athlete/workouts/${routine.id}`} className='flex flex-col flex-grow'>
                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="mb-2 text-lg font-headline group-hover:text-primary transition-colors">{routine.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{routine.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex-wrap gap-1">
                        {isPlan(routine) ? 
                            routine.sessions.map(s => <Badge key={s.sessionTag} variant="outline">Sessão {s.sessionTag}</Badge>) :
                            (routine as Workout).sessionTag && <Badge variant="outline">Sessão {(routine as Workout).sessionTag}</Badge>
                        }
                        {!isPlan(routine) && !(routine as Workout).sessionTag && <Badge variant="secondary">Avulso</Badge>}
                    </CardFooter>
                </Link>
                </Card>
            ))}
        </div>

    </div>
    </TooltipProvider>
  );
}
