'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, PlayCircle, Repeat, Dumbbell, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Workout, Exercise } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const { setActiveWorkout } = useAppContext();
  
  const workoutDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    // This could be a user's custom workout or a public one. For now, just public.
    return doc(firestore, 'workout_routines_public', params.id);
  }, [firestore, params.id]);

  const { data: workout, isLoading } = useDoc<Workout>(workoutDocRef);

  // We can't use notFound() directly with hooks, so we handle loading and empty states
  if (isLoading) {
    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-2/3 space-y-4">
                  <Skeleton className="h-48 w-full" />
                </div>
                <div className="w-full md:w-1/3">
                  <Skeleton className="h-40 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!workout) {
    // This will be rendered on the client if the doc doesn't exist
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center">
        <h1 className="text-2xl font-bold">Treino não encontrado</h1>
        <p className="text-muted-foreground">O treino que você está procurando não existe.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/workouts">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para a Biblioteca
          </Link>
        </Button>
      </div>
    );
  }
  
  const exercises = workout.exerciseIds as unknown as Exercise[];

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/workouts">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para a Biblioteca
          </Link>
        </Button>
      </div>

      <div className="relative h-64 w-full rounded-lg overflow-hidden mb-8">
        <Image
          src={workout.image || "https://picsum.photos/seed/1/1200/400"}
          alt={workout.name}
          fill
          className="object-cover"
          data-ai-hint={workout.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <Badge variant="secondary" className="mb-2 bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">
            {workout.difficultyLevel}
          </Badge>
          <h1 className="text-4xl font-bold text-white font-headline">{workout.name}</h1>
          <p className="text-lg text-white/90 mt-1">{workout.description}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Exercícios</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {exercises && exercises.map((exercise: any, index: number) => (
                  <li key={index}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{exercise.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-4 w-4" /> {exercise.sets} séries
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-4 w-4" /> {exercise.reps} reps
                        </span>
                         <span className="flex items-center gap-1">
                          <Timer className="h-4 w-4" /> {exercise.rest || '60s'} rest
                        </span>
                      </div>
                    </div>
                    {index < exercises.length - 1 && <Separator className="mt-4" />}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-1/3">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Pronto para começar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Inicie uma sessão de treino para registrar seu progresso.
              </p>
              <Button size="lg" className="w-full" onClick={() => setActiveWorkout(workout)}>
                <PlayCircle className="mr-2 h-5 w-5" />
                Iniciar Treino
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
