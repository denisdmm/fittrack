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
import { Plus, Trash2, X } from 'lucide-react';
import { useAppContext } from '@/context/app-provider';
import type { Exercise, LoggedSet } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function WorkoutLogger() {
  const { activeWorkout, setActiveWorkout, user } = useAppContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [loggedExercises, setLoggedExercises] = useState<Record<string, LoggedSet[]>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (activeWorkout) {
      setStartTime(new Date());
      // Initialize loggedExercises with empty arrays for each exercise
      const initialLogs: Record<string, LoggedSet[]> = {};
      (activeWorkout.exerciseIds as Exercise[]).forEach(ex => {
        initialLogs[ex.id] = [];
      });
      setLoggedExercises(initialLogs);
    } else {
      setStartTime(null);
      setLoggedExercises({});
    }
  }, [activeWorkout]);

  const handleAddSet = (exerciseId: string) => {
    setLoggedExercises(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), { reps: 0, weight: 0 }],
    }));
  };

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setLoggedExercises(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter((_, i) => i !== setIndex),
    }));
  };

  const handleSetChange = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setLoggedExercises(prev => {
      const newSets = [...prev[exerciseId]];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: newSets };
    });
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkout || !user || !firestore || !startTime) return;

    const duration = Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60)); // in minutes
    
    let totalVolume = 0;
    Object.values(loggedExercises).flat().forEach(set => {
        totalVolume += set.reps * set.weight;
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
            loggedSets: loggedExercises, // Storing the detailed log
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
  
  const handleCancelWorkout = () => {
    // Maybe add a confirmation dialog here in a real app
    setActiveWorkout(null);
  };
  
  const exercises = useMemo(() => activeWorkout?.exerciseIds as Exercise[], [activeWorkout]);

  if (!activeWorkout) {
    return null;
  }

  return (
    <Sheet open={!!activeWorkout} onOpenChange={(open) => !open && setActiveWorkout(null)}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader className="pr-12">
          <SheetTitle>{activeWorkout.name}</SheetTitle>
          <SheetDescription>Registre suas séries e repetições. Vamos lá!</SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6">
            {exercises.map((exercise) => (
              <div key={exercise.id}>
                <h4 className="font-semibold mb-3">{exercise.name}</h4>
                <div className="space-y-2">
                  {(loggedExercises[exercise.id] || []).map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-2">
                       <span className="font-mono text-sm text-muted-foreground w-6">{setIndex + 1}</span>
                       <Input
                        type="number"
                        placeholder="Peso"
                        value={set.weight === 0 ? '' : set.weight}
                        onChange={(e) => handleSetChange(exercise.id, setIndex, 'weight', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                       <span className="text-sm text-muted-foreground">kg</span>
                       <Input
                        type="number"
                        placeholder="Reps"
                        value={set.reps === 0 ? '' : set.reps}
                        onChange={(e) => handleSetChange(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                       <span className="text-sm text-muted-foreground">reps</span>
                       <Button variant="ghost" size="icon" onClick={() => handleRemoveSet(exercise.id, setIndex)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                       </Button>
                    </div>
                  ))}
                </div>
                 <Button variant="outline" size="sm" onClick={() => handleAddSet(exercise.id)} className="mt-3">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Série
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <SheetFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={handleCancelWorkout}>Cancelar</Button>
          <Button onClick={handleFinishWorkout}>Finalizar Treino</Button>
        </SheetFooter>
         <button onClick={handleCancelWorkout} className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </SheetContent>
    </Sheet>
  );
}
