'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, setDoc } from 'firebase/firestore';
import type { Workout, Exercise, WorkoutPlan, WorkoutSession, User, SessionExercise } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type Routine = Workout | WorkoutPlan;

function isPlan(item: Routine): item is WorkoutPlan {
    return 'sessions' in item && Array.isArray(item.sessions);
}

// Helper function to get all exercise IDs from a routine
function getExerciseIds(routine: Routine | null): string[] {
    if (!routine) return [];
    if (isPlan(routine)) {
        return routine.sessions.flatMap(session => session.exerciseIds);
    }
    return routine.exerciseIds || [];
}


export default function WorkoutDetailPage() {
  const params = useParams();
  const routineId = params.id as string;
  const firestore = useFirestore();
  const { user, setActiveWorkout } = useAppContext();
  const { toast } = useToast();
  
  const routineDocRef = useMemoFirebase(() => {
    if (!firestore || !routineId) return null;
    return doc(firestore, 'workout_routines_public', routineId);
  }, [firestore, routineId]);

  const { data: routine, isLoading: isRoutineLoading } = useDoc<Routine>(routineDocRef);

  const exerciseIds = useMemo(() => getExerciseIds(routine), [routine]);

  const exercisesRef = useMemoFirebase(() => {
    if (!firestore || exerciseIds.length === 0) return null;
    return query(collection(firestore, 'exercises'), where('__name__', 'in', exerciseIds));
  }, [firestore, exerciseIds]);

  const { data: exercises, isLoading: areExercisesLoading } = useCollection<Exercise>(exercisesRef);

   const usersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: allUsers, isLoading: areUsersLoading } = useCollection<User>(usersRef);

  const activeUsers = useMemo(() => {
    if (!allUsers || !routineId) return [];
    return allUsers.filter(u => u.activeWorkoutPlanId === routineId);
  }, [allUsers, routineId]);

  const fullRoutineData = useMemo(() => {
    if (!routine || !exercises) return null;
    if (isPlan(routine)) {
        return {
            ...routine,
            sessions: routine.sessions.map(session => {
                const exercisesForSession = (session.exercises || []).map((sessionEx: any) => {
                   const fullExercise = exercises.find(e => e.id === sessionEx.exerciseId);
                   return fullExercise ? { ...sessionEx, exercise: fullExercise } : null;
                }).filter(Boolean) as SessionExercise[];
                
                return {
                    ...session,
                    exercises: exercisesForSession,
                }
            })
        };
    }
    return {
        ...routine,
        exercises: (routine.exerciseIds || []).map(id => exercises.find(e => e.id === id)).filter(Boolean) as Exercise[]
    };
  }, [routine, exercises]);
  
  const isLoading = isRoutineLoading || areExercisesLoading || areUsersLoading;

  const handleStartSession = (session: WorkoutSession) => {
    if (!fullRoutineData || !isPlan(fullRoutineData) || !session.exercises) return;
    
    // We need to construct a Workout object that the logger can understand.
    const workoutToStart: Workout = {
        id: fullRoutineData.id,
        name: `${fullRoutineData.name} - Sessão ${session.sessionTag}`,
        description: fullRoutineData.description,
        difficultyLevel: fullRoutineData.difficultyLevel,
        exerciseIds: session.exercises.map(ex => ex.exerciseId),
        exercises: session.exercises.map(ex => ex.exercise!),
        sessionTag: session.sessionTag,
        image: fullRoutineData.image,
        imageHint: fullRoutineData.imageHint,
    };
    setActiveWorkout(workoutToStart);
  }

  const handleActivatePlan = async () => {
    if (!firestore || !user || !routine) {
        toast({ title: 'Erro', description: 'Não foi possível ativar o plano.', variant: 'destructive' });
        return;
    }
    try {
        const userRef = doc(firestore, 'users', user.id);
        await setDoc(userRef, { activeWorkoutPlanId: routine.id }, { merge: true });
        toast({
            title: 'Plano Ativado!',
            description: `"${routine.name}" é agora seu plano de treino ativo.`,
        });
    } catch (error: any) {
        toast({
            title: 'Erro ao Ativar',
            description: `Não foi possível ativar o plano: ${error.message}`,
            variant: 'destructive',
        });
    }
  };

  const handleDeactivatePlan = async () => {
    if (!firestore || !user) {
        toast({ title: 'Erro', description: 'Usuário não autenticado.', variant: 'destructive' });
        return;
    }
    
    try {
        const userRef = doc(firestore, 'users', user.id);
        await setDoc(userRef, { activeWorkoutPlanId: "" }, { merge: true });
        toast({
            title: 'Plano Desativado',
            description: 'O plano de treino não está mais ativo.',
        });
    } catch (error: any) {
        toast({
            title: 'Erro ao Desativar',
            description: `Não foi possível desativar o plano: ${error.message}`,
            variant: 'destructive',
        });
    }
  };


  if (isLoading) {
    return (
        <div className="container mx-auto max-w-4xl py-8 space-y-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-2/3 space-y-4">
                  <Skeleton className="h-48 w-full" />
                   <Skeleton className="h-40 w-full" />
                </div>
                <div className="w-full md:w-1/3">
                  <Skeleton className="h-40 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (!routine || !fullRoutineData) {
    // This will be rendered on the client if the doc doesn't exist
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center">
        <h1 className="text-2xl font-bold">Rotina não encontrada</h1>
        <p className="text-muted-foreground">A rotina de treino que você está procurando não existe.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/athlete/workouts">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para a Biblioteca
          </Link>
        </Button>
      </div>
    );
  }

  const isPlanActiveForUser = user?.activeWorkoutPlanId === routine.id;
  
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/athlete/workouts">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para a Biblioteca
          </Link>
        </Button>
      </div>

      <div className="relative h-64 w-full rounded-lg overflow-hidden mb-8">
        <Image
          src={routine.image || "https://picsum.photos/seed/1/1200/400"}
          alt={routine.name}
          fill
          className="object-cover"
          data-ai-hint={routine.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <Badge variant="secondary" className="mb-2 bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">
            {routine.difficultyLevel}
          </Badge>
          <h1 className="text-4xl font-bold text-white font-headline">{routine.name}</h1>
          <p className="text-lg text-white/90 mt-1">{routine.description}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3 space-y-8">
           {isPlan(fullRoutineData) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Sessões do Plano de Treino</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {fullRoutineData.sessions.map((session) => (
                      <AccordionItem key={session.sessionTag} value={`session-${session.sessionTag}`}>
                        <AccordionTrigger className="text-lg font-semibold">
                          <div className="flex flex-col items-start text-left">
                              <span>Sessão {session.sessionTag}</span>
                              {session.description && <span className="text-sm font-normal text-muted-foreground">{session.description}</span>}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <ul className="space-y-4 pt-4">
                            {session.exercises && session.exercises.map((sessionExercise: SessionExercise, index: number) => (
                              <li key={index}>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-semibold">{sessionExercise.exercise?.name}</p>
                                    <p className="text-sm text-muted-foreground">{sessionExercise.exercise?.muscleGroup}</p>
                                  </div>
                                  <div className="text-sm text-muted-foreground text-right">
                                    {Array.isArray(sessionExercise.seriesAndReps) && sessionExercise.seriesAndReps.map((sr, i) => (
                                      <p key={i}>{sr}</p>
                                    ))}
                                  </div>
                                </div>
                                {index < session.exercises!.length - 1 && <Separator className="mt-4" />}
                              </li>
                            ))}
                          </ul>
                          <Button size="sm" className="w-full mt-4" onClick={() => handleStartSession(session)}>
                            <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Sessão {session.sessionTag}
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
           ) : (
             <Card>
                <CardHeader>
                  <CardTitle>Exercícios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {(fullRoutineData as Workout).exercises && (fullRoutineData as Workout).exercises!.map((exercise, index) => (
                      <li key={index}>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">{exercise.muscleGroup}</p>
                          </div>
                          <div className="text-sm text-muted-foreground text-right">
                            {/* This part might need adjustment if individual workouts also get dynamic series */}
                          </div>
                        </div>
                        {index < (fullRoutineData as Workout).exercises!.length - 1 && <Separator className="mt-4" />}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
           )}
            {isPlan(fullRoutineData) && (
              <Card>
                <CardHeader>
                    <CardTitle>Usuários Ativos no Plano</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeUsers.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {activeUsers.map(activeUser => (
                          <div key={activeUser.id} className="flex flex-col items-center text-center gap-2">
                            <Avatar>
                              <AvatarImage src={`https://picsum.photos/seed/${activeUser.id}/100/100`} data-ai-hint="person portrait" />
                              <AvatarFallback>{activeUser.firstName.charAt(0)}{activeUser.lastName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{activeUser.firstName} {activeUser.lastName}</span>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum usuário está seguindo este plano no momento.</p>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
        <div className="w-full md:w-1/3">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Pronto para começar?</CardTitle>
            </CardHeader>
            <CardContent>
              {isPlan(fullRoutineData) ? (
                 <>
                  {isPlanActiveForUser ? (
                    <>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Este é seu plano de treino ativo.
                        </p>
                        <Button size="lg" variant="destructive" className="w-full" onClick={handleDeactivatePlan}>
                            <XCircle className="mr-2 h-5 w-5" />
                            Desativar Plano
                        </Button>
                    </>
                  ) : (
                    <>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Defina este como seu plano de treino principal.
                        </p>
                        <Button size="lg" className="w-full" onClick={handleActivatePlan}>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Ativar Plano
                        </Button>
                    </>
                  )}
                 </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Inicie uma sessão de treino para registrar seu progresso.
                  </p>
                  <Button size="lg" className="w-full" onClick={() => setActiveWorkout(fullRoutineData as Workout)}>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Iniciar Treino
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
