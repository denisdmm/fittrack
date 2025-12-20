'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from 'firebase/firestore';
import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import type { Exercise, SessionExercise } from "@/lib/types";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, XCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


interface ExercisePickerProps {
    initialExercises: SessionExercise[];
    onSave: (exercises: SessionExercise[]) => void;
}

const seriesSchema = z.object({
  value: z.string().min(1, "A descrição da série é obrigatória."),
});

const seriesRepsSchema = z.object({
  series: z.array(seriesSchema).min(1, "Adicione pelo menos uma série."),
});


const muscleGroups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Corpo Inteiro', 'Cardio', 'Flexibilidade'];
const equipments = ['Todos', 'Livres', 'Aparelhos', 'Calistenia', 'Ambos'];

export function ExercisePicker({ initialExercises, onSave }: ExercisePickerProps) {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedExercises, setSelectedExercises] = useState<SessionExercise[]>(initialExercises);
    const [muscleGroupFilter, setMuscleGroupFilter] = useState('Todos');
    const [equipmentFilter, setEquipmentFilter] = useState('Todos');

    const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
    const [configuringExercise, setConfiguringExercise] = useState<Exercise | null>(null);

    const form = useForm<z.infer<typeof seriesRepsSchema>>({
        defaultValues: {
            series: [{ value: "" }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "series"
    });

    const exercisesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exercises');
    }, [firestore]);

    const { data: allExercises, isLoading: isLoadingExercises } = useCollection<Exercise>(exercisesCollectionRef);

    const openSeriesModal = (exercise: Exercise) => {
        setConfiguringExercise(exercise);
        form.reset({ series: [{ value: "10-12 reps @ 60s" }] });
        setIsSeriesModalOpen(true);
    };

    function onSeriesSubmit(values: z.infer<typeof seriesRepsSchema>) {
        if (!configuringExercise) return;
        const newSessionExercise: SessionExercise = {
            exerciseId: configuringExercise.id,
            seriesAndReps: values.series.map(s => s.value),
            exercise: configuringExercise,
        };
        setSelectedExercises(prev => [...prev, newSessionExercise]);
        setIsSeriesModalOpen(false);
        setConfiguringExercise(null);
    }

    const removeExercise = (exerciseId: string) => {
        setSelectedExercises(prev => prev.filter(e => e.exerciseId !== exerciseId));
    };

    const availableExercises = useMemo(() => {
        if (!allExercises) return [];
        
        const selectedIds = new Set(selectedExercises.map(e => e.exerciseId));
        let filtered = allExercises.filter(ex => !selectedIds.has(ex.id));

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(exercise => 
                exercise.name.toLowerCase().includes(lowercasedTerm) ||
                (exercise.aliases && exercise.aliases.some(alias => alias.toLowerCase().includes(lowercasedTerm)))
            );
        } else {
            if (muscleGroupFilter !== 'Todos') {
              filtered = filtered.filter(exercise => 
                exercise.muscleGroup === muscleGroupFilter
              );
            }
            if (equipmentFilter !== 'Todos') {
              filtered = filtered.filter(exercise => 
                exercise.equipment === equipmentFilter || (exercise.equipment === 'Ambos')
              );
            }
        }
        return filtered.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6);
    }, [allExercises, selectedExercises, searchTerm, muscleGroupFilter, equipmentFilter]);

    const renderExerciseListItem = (item: Exercise) => (
        <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
            <div className="text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.muscleGroup}{item.equipment ? ` - ${item.equipment}` : ''}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => openSeriesModal(item)}>
                <PlusCircle className="h-4 w-4" />
            </Button>
        </div>
      );

    return (
        <>
        <div className="flex flex-col h-full pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow min-h-0">
                <div className="flex flex-col space-y-2 min-h-0">
                    <h3 className="text-base font-semibold">Exercícios Selecionados ({selectedExercises.length})</h3>
                    <ScrollArea className="flex-grow w-full rounded-md border p-2">
                       {selectedExercises.length > 0 ? (
                            <div className="space-y-2">
                                {selectedExercises.map(ex => (
                                    <div key={ex.exerciseId} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                        <div>
                                            <p className="text-sm font-medium">{ex.exercise?.name}</p>
                                            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                                                {ex.seriesAndReps.map((sr, i) => <span key={i}>{i > 0 && '•'} {sr}</span>)}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeExercise(ex.exerciseId)}>
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                       ) : (
                           <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground">Adicione exercícios da biblioteca.</p>
                           </div>
                       )}
                    </ScrollArea>
                </div>
                
                <div className="flex flex-col space-y-2 min-h-0">
                    <h3 className="text-base font-semibold">Biblioteca de Exercícios</h3>
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-[150px]">
                          <Select value={equipmentFilter} onValueChange={setEquipmentFilter} disabled={!!searchTerm}>
                            <SelectTrigger>
                              <SelectValue placeholder="Equipamento" />
                            </SelectTrigger>
                            <SelectContent>
                              {equipments.map(group => (
                                <SelectItem key={group} value={group}>{group}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-full sm:w-[200px]">
                          <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter} disabled={!!searchTerm}>
                            <SelectTrigger>
                              <SelectValue placeholder="Grupo muscular" />
                            </SelectTrigger>
                            <SelectContent>
                              {muscleGroups.map(group => (
                                <SelectItem key={group} value={group}>{group}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                    <ScrollArea className="flex-grow w-full rounded-md border">
                        {isLoadingExercises ? (
                            <div className="p-4 space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <div className="p-2">
                                {availableExercises.length > 0 ? (
                                    availableExercises.map(renderExerciseListItem)
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center p-4">Nenhum exercício encontrado.</p>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <Button onClick={() => onSave(selectedExercises)}>Salvar Sessão</Button>
            </div>
        </div>

        <Dialog open={isSeriesModalOpen} onOpenChange={setIsSeriesModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Definir Séries e Repetições</DialogTitle>
                    <DialogDescription>
                        Defina como o exercício <span className="font-bold">{configuringExercise?.name}</span> será executado nesta sessão.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSeriesSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="series"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Séries</FormLabel>
                                    <div className="space-y-2">
                                        {fields.map((field, index) => (
                                            <FormField
                                                key={field.id}
                                                control={form.control}
                                                name={`series.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-2">
                                                        <FormLabel className="text-sm text-muted-foreground pt-2">Série {index + 1}</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Ex: 10-12 reps @ 60s" {...field} />
                                                        </FormControl>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => remove(index)}
                                                            disabled={fields.length <= 1}
                                                            className="text-destructive hover:text-destructive h-8 w-8"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ value: "" })}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Série
                        </Button>

                        <Button type="submit" className="w-full mt-4">Adicionar Exercício ao Treino</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        </>
    );
}
