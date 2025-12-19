'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, CheckCircle, Play, Pause, X, Pencil } from 'lucide-react';
import { useAppContext } from '@/context/app-provider';
import type { Exercise, LoggedSet, ProgressRecord, Workout, WorkoutPlan, SessionExercise } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export function WorkoutLogger() {
  const { activeWorkout, setActiveWorkout, user } = useAppContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [loggedExercises, setLoggedExercises] = useState<Record<string, LoggedSet[]>>({});
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionExerciseDetails, setSessionExerciseDetails] = useState<Record<string, string[]>>({});

  // --- Fetch Exercises details for the active workout ---
  const exerciseIds = useMemo(() => activeWorkout?.exerciseIds || [], [activeWorkout]);

  const exercisesRef = useMemoFirebase(() => {
    if (!firestore || exerciseIds.length === 0) return null;
    return query(collection(firestore, 'exercises'), where('__name__', 'in', exerciseIds));
  }, [firestore, exerciseIds]);

  const { data: exercisesData, isLoading: areExercisesLoading } = useCollection<Exercise>(exercisesRef);

  // Effect to initialize or reset state when a workout becomes active/inactive
  useEffect(() => {
    if (activeWorkout && exercisesData && user && firestore) {
      setStartTime(new Date());
      setElapsedSeconds(0);
      setIsPaused(false);
      setCompletedExercises(new Set());
      setCompletedSets({});
      
      const fetchLastLogsAndInitialize = async () => {
          const initialLogs: Record<string, LoggedSet[]> = {};
          const sessionDetailsMap: Record<string, string[]> = {};
          
          // Get the full plan to find the session details
          let sessionDetails = null;
          if (activeWorkout.sessionTag && activeWorkout.id) {
              const planQuery = query(collection(firestore, 'workout_routines_public'), where('id', '==', activeWorkout.id));
              const planSnapshot = await getDocs(planQuery);
              
              if (!planSnapshot.empty) {
                  const planData = planSnapshot.docs[0].data() as WorkoutPlan;
                  sessionDetails = planData.sessions.find(s => s.sessionTag === activeWorkout.sessionTag);
              }
          }

          for (const ex of exercisesData) {
              const exerciseInSession = (sessionDetails?.exercises as any)?.find((e: any) => e.exerciseId === ex.id);
              const seriesAndReps = exerciseInSession?.seriesAndReps || [];
              const seriesLength = seriesAndReps.length || 1; // Default to 1 for cardio/ad-hoc
              
              sessionDetailsMap[ex.id] = seriesAndReps;
              
              let lastSets: LoggedSet[] | undefined;

              // Query for the last log containing this exercise
              const logsQuery = query(
                  collection(firestore, `users/${user.id}/workout_logs`),
                  orderBy('date', 'desc'),
                  limit(50) // Search within last 50 logs for performance
              );

              const logsSnapshot = await getDocs(logsQuery);
              for (const doc of logsSnapshot.docs) {
                  const logData = doc.data() as ProgressRecord;
                  if (logData.loggedSets && logData.loggedSets[ex.id]) {
                      lastSets = logData.loggedSets[ex.id];
                      break;
                  }
              }

              // Initialize with last weight, but current reps as 0
              initialLogs[ex.id] = Array.from({ length: seriesLength }, (_, i) => ({
                  reps: 0,
                  weight: ex.type === 'Cardio' ? 0 : (lastSets?.[i]?.weight || 0),
              }));
          }
          setLoggedExercises(initialLogs);
          setSessionExerciseDetails(sessionDetailsMap);
      };

      fetchLastLogsAndInitialize();

    } else if (!activeWorkout) {
      // Reset all states when workout is finished or cancelled
      setStartTime(null);
      setLoggedExercises({});
      setCompletedExercises(new Set());
      setCompletedSets({});
      setElapsedSeconds(0);
      setIsPaused(false);
      setSessionExerciseDetails({});
    }
  }, [activeWorkout, exercisesData, user, firestore]);


  // Effect for the timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (startTime && !isPaused) {
      intervalId = setInterval(() => {
        setElapsedSeconds(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [startTime, isPaused]);

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setLoggedExercises(prev => {
      const newSets = [...(prev[exerciseId] || [])];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: newSets };
    });
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    setCompletedSets(prev => {
        const newCompletedSets = { ...prev };
        const exerciseSets = new Set(newCompletedSets[exerciseId]);

        if (exerciseSets.has(setIndex)) {
            exerciseSets.delete(setIndex);
        } else {
            exerciseSets.add(setIndex);
        }
        newCompletedSets[exerciseId] = exerciseSets;

        // If all sets are complete, mark the exercise as complete
        const exerciseSeriesCount = loggedExercises[exerciseId]?.length || 0;
        if (exerciseSets.size === exerciseSeriesCount) {
          setCompletedExercises(current => new Set(current).add(exerciseId));
        } else {
          // If we un-complete a set, make sure the exercise is not marked as complete
          setCompletedExercises(current => {
            const newSet = new Set(current);
            newSet.delete(exerciseId);
            return newSet;
          });
        }
        
        return newCompletedSets;
    });
};


  const handleFinishWorkout = async () => {
    if (!activeWorkout || !user || !firestore || !startTime) return;

    const duration = Math.round(elapsedSeconds / 60); // in minutes
    
    let totalVolume = 0;
    const exerciseDetails = exercisesData?.reduce((acc, ex) => ({ ...acc, [ex.id]: ex }), {} as Record<string, Exercise>);

    Object.entries(loggedExercises).forEach(([exerciseId, sets]) => {
        const exercise = exerciseDetails?.[exerciseId];
        // Only calculate volume for non-cardio exercises
        if (exercise?.type !== 'Cardio') {
            sets.forEach(set => {
                totalVolume += set.reps * set.weight;
            });
        }
    });

    try {
        const logsCollectionRef = collection(firestore, `users/${user.id}/workout_logs`);
        await addDoc(logsCollectionRef, {
            userId: user.id,
            workoutRoutineId: activeWorkout.id,
            workoutName: activeWorkout.name,
            date: new Date().toISOString(),
            duration,
            volume: totalVolume,
            loggedSets: loggedExercises,
            sessionTag: activeWorkout.sessionTag,
        });

        toast({
            title: "Treino Finalizado!",
            description: "Seu progresso foi salvo com sucesso.",
        });

    } catch (error: any) {
         toast({
            title: "Erro ao Salvar",
            description: `Não foi possível salvar seu progresso: ${error.message}`,
            variant: "destructive",
        });
    } finally {
        setActiveWorkout(null);
    }
  };
  
  const handleClose = () => {
    setActiveWorkout(null);
  };
  
  const exercises = useMemo(() => {
    if (!exercisesData || !activeWorkout?.exerciseIds) return [];
    // Ensure the order from the workout is preserved
    return activeWorkout.exerciseIds
      .map(id => exercisesData.find(ex => ex.id === id))
      .filter(Boolean) as Exercise[];
  }, [exercisesData, activeWorkout?.exerciseIds]);
  
  const allExercisesCompleted = exercises.length > 0 && completedExercises.size === exercises.length;

  if (!activeWorkout) {
    return null;
  }

  return (
    <Sheet open={!!activeWorkout} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader className="pr-12">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
             <div>
                <SheetTitle>{activeWorkout.name}</SheetTitle>
                <SheetDescription>Registre suas séries e repetições. Vamos lá!</SheetDescription>
             </div>
             <div className="text-left sm:text-right">
                <p className="text-sm font-medium text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p className="font-mono text-2xl font-bold">{formatDuration(elapsedSeconds)}</p>
             </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-4">
            {areExercisesLoading ? <p>Carregando exercícios...</p> : 
            exercises.map((exercise) => {
              const isExerciseCompleted = completedExercises.has(exercise.id);
              const setsToRender = loggedExercises[exercise.id] || [];
              const seriesAndRepsTarget = sessionExerciseDetails[exercise.id] || [];

              return (
              <Card key={exercise.id} className={cn("transition-all", isExerciseCompleted && "border-green-500 bg-green-500/5")}>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    {isExerciseCompleted && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="mr-1 h-3 w-3" />Concluído</Badge>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {setsToRender.length > 0 ? (
                      setsToRender.map((set, setIndex) => {
                        const isSetCompleted = completedSets[exercise.id]?.has(setIndex);
                        return (
                        <div key={setIndex} className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-md", isSetCompleted && "bg-muted")}>
                          <div className="font-mono text-sm text-muted-foreground sm:w-40 text-left sm:text-center bg-background/50 p-2 rounded-md w-full">
                            <span>Série {setIndex + 1}</span>
                            {seriesAndRepsTarget[setIndex] && <p className='text-xs'>({seriesAndRepsTarget[setIndex]})</p>}
                          </div>
                          <div className="flex flex-grow items-center gap-2 w-full">
                            {exercise.type === 'Cardio' ? (
                                <>
                                <div className="flex-1 space-y-1">
                                    <Input
                                    type="number"
                                    placeholder="Tempo"
                                    value={set.reps > 0 ? set.reps : ''}
                                    onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                    disabled={isSetCompleted}
                                    />
                                    <label className="text-xs text-muted-foreground ml-1">min</label>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Input
                                    type="number"
                                    placeholder="Carga"
                                    value={set.weight > 0 ? set.weight : ''}
                                    onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', parseInt(e.target.value) || 0)}
                                    disabled={isSetCompleted}
                                    />
                                    <label className="text-xs text-muted-foreground ml-1">nível</label>
                                </div>
                                </>
                            ) : (
                                <>
                                <div className="flex-1 space-y-1">
                                    <Input
                                    type="number"
                                    placeholder="Peso"
                                    value={set.weight > 0 ? set.weight : ''}
                                    onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', parseInt(e.target.value) || 0)}
                                    disabled={isSetCompleted}
                                    />
                                    <label className="text-xs text-muted-foreground ml-1">kg</label>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Input
                                    type="number"
                                    placeholder="Reps"
                                    value={set.reps > 0 ? set.reps : ''}
                                    onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                    disabled={isSetCompleted}
                                    />
                                    <label className="text-xs text-muted-foreground ml-1">reps</label>
                                </div>
                                </>
                            )}
                          </div>
                          <Button
                            variant={isSetCompleted ? "secondary" : "outline"}
                            size="icon"
                            onClick={() => toggleSetComplete(exercise.id, setIndex)}
                            className='h-9 w-9 sm:ml-auto flex-shrink-0'
                          >
                            {isSetCompleted ? <Pencil className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      )})
                    ) : (
                      <p className="text-sm text-muted-foreground px-2">Configurando exercício...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </ScrollArea>
        
        <SheetFooter className="mt-auto pt-4 border-t flex-row sm:justify-between">
            <div/>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsPaused(!isPaused)}>
                    {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                    {isPaused ? 'Retomar' : 'Pausar'}
                </Button>
                <Button onClick={handleFinishWorkout} disabled={!allExercisesCompleted}>
                    Finalizar Treino
                </Button>
            </div>
        </SheetFooter>
         <button onClick={handleClose} className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </SheetContent>
    </Sheet>
  );
}
