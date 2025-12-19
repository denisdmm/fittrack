'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { useAppContext } from "@/context/app-provider";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { WorkoutPlan, SessionExercise, WorkoutSession } from "@/lib/types";
import { ExercisePicker } from "./ExercisePicker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkoutFormProps {
    workoutPlan: WorkoutPlan | null;
    onFinished: () => void;
}

const sessionSchema = z.object({
    sessionTag: z.enum(['A', 'B', 'C', 'D', 'E']),
    description: z.string().optional(),
    exercises: z.array(z.any()).min(1, "A sessão deve ter pelo menos um exercício."), 
});

const formSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
    difficultyLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
    frequency: z.coerce.number().min(1, { message: "A frequência deve ser de no mínimo 1 vez." }),
    sessions: z.array(sessionSchema).min(1, { message: "Adicione pelo menos uma sessão de treino." }),
});

type SessionTag = 'A' | 'B' | 'C' | 'D' | 'E';
const allSessionTags: SessionTag[] = ['A', 'B', 'C', 'D', 'E'];

export function WorkoutForm({ workoutPlan, onFinished }: WorkoutFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useAppContext();
    
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<{session: z.infer<typeof sessionSchema>, index: number} | null>(null);
    const [newSessionTag, setNewSessionTag] = useState<SessionTag | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            difficultyLevel: undefined,
            frequency: 12,
            sessions: [],
        },
    });

    useEffect(() => {
        if (workoutPlan) {
            form.reset({
                name: workoutPlan.name,
                description: workoutPlan.description,
                difficultyLevel: workoutPlan.difficultyLevel,
                frequency: workoutPlan.frequency,
                // Ensure exercises are properly populated for editing
                sessions: workoutPlan.sessions.map(s => ({
                    sessionTag: s.sessionTag,
                    description: s.description || "",
                    exercises: s.exercises || [],
                })),
            });
        } else {
            form.reset({
                name: "",
                description: "",
                difficultyLevel: undefined,
                frequency: 12,
                sessions: [],
            });
        }
    }, [workoutPlan, form]);

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "sessions"
      });

    const openExercisePicker = (tag: SessionTag) => {
        setNewSessionTag(tag);
        setEditingSession(null);
        setIsPickerOpen(true);
    }
    
    const handleEditSession = (index: number) => {
        const session = fields[index];
        setEditingSession({ session: session as any, index });
        setNewSessionTag(null);
        setIsPickerOpen(true);
    };

    const handleSaveSession = (exercises: SessionExercise[]) => {
        if (editingSession) {
            // update the session at the specified index
            update(editingSession.index, { ...editingSession.session, exercises });
        } else if (newSessionTag) {
            // add a new session
            append({ sessionTag: newSessionTag, description: "", exercises });
        }
        // Close the modal and reset states
        setIsPickerOpen(false);
        setEditingSession(null);
        setNewSessionTag(null);
    };

    const availableTags = allSessionTags.filter(tag => !fields.some(field => field.sessionTag === tag));

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !user) {
            toast({
                variant: "destructive",
                title: "Erro de Autenticação",
                description: "Você precisa estar logado para criar um plano de treino.",
            });
            return;
        }

        const sessionsToSave = values.sessions.map(session => ({
            sessionTag: session.sessionTag,
            description: session.description,
            // Storing exerciseIds is redundant if 'exercises' contains the same info.
            // Let's rely on the 'exercises' field for consistency.
            exerciseIds: session.exercises.map((ex: SessionExercise) => ex.exerciseId),
            // Only store the IDs and the series/reps info in Firestore
            exercises: session.exercises.map((ex: SessionExercise) => ({
                exerciseId: ex.exerciseId,
                seriesAndReps: ex.seriesAndReps,
            })),
        }));

        const finalPlanData = { ...values, sessions: sessionsToSave };

        try {
            if (workoutPlan) {
                // Update existing plan
                const planRef = doc(firestore, 'workout_routines_public', workoutPlan.id);
                await setDoc(planRef, finalPlanData, { merge: true });
                toast({
                    title: "Plano de Treino Atualizado",
                    description: `O plano "${values.name}" foi atualizado com sucesso.`,
                });
            } else {
                // Create new plan
                const collectionRef = collection(firestore, 'workout_routines_public');
                const docRef = doc(collectionRef); // Let Firestore generate the ID
                const planToSave = {
                    ...finalPlanData,
                    id: docRef.id,
                    userId: user.id, // Associate with the user who created it
                    image: `https://picsum.photos/seed/${docRef.id}/600/400`,
                    imageHint: 'workout fitness',
                };
                await setDoc(docRef, planToSave);
                toast({
                    title: "Plano de Treino Criado",
                    description: `O plano "${values.name}" foi criado com sucesso.`,
                });
            }
            onFinished();
        } catch (error: any) {
            console.error("Failed to save workout plan:", error);
            toast({
                title: "Erro ao Salvar",
                description: `Ocorreu um erro ao salvar o plano. Erro: ${error.message}`,
                variant: "destructive"
            });
        }
    }
    
    const sessionTitle = editingSession 
        ? `Editando Sessão ${editingSession.session.sessionTag}` 
        : (newSessionTag ? `Adicionar Exercícios para Sessão ${newSessionTag}` : 'Configurar Sessão');

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
        {/* Header with Save Button */}
        <div className="flex items-center justify-between p-4 border-b">
             <h3 className="text-lg font-medium">Detalhes do Plano</h3>
             <Button type="submit">{workoutPlan ? 'Salvar Alterações' : 'Salvar Plano'}</Button>
        </div>

        <ScrollArea className="flex-grow">
            <div className="p-4 space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome do Plano de Treino</FormLabel>
                        <FormControl>
                        <Input placeholder="Ex: Hipertrofia para 3 Meses" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Descreva o objetivo geral deste plano de treino..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="difficultyLevel"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nível de Dificuldade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um nível" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                                    <SelectItem value="Avançado">Avançado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Duração do Ciclo (em treinos)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Ex: 12" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                            Número total de treinos antes de completar o ciclo.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            
                <Separator />
            
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="sessions"
                        render={() => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <FormLabel className="text-base">Sessões de Treino</FormLabel>
                                        <FormDescription>Adicione e configure as sessões A, B, C...</FormDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button type="button" variant="outline" size="sm" disabled={availableTags.length === 0}>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Adicionar Sessão
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {availableTags.map(tag => (
                                                <DropdownMenuItem key={tag} onSelect={() => openExercisePicker(tag)}>
                                                    Sessão {tag}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-2 rounded-lg border">
                                {fields.length > 0 ? (
                                        <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                                            {fields.map((session, index) => (
                                                <AccordionItem value={`item-${index}`} key={session.id}>
                                                    <AccordionTrigger className="px-4 text-base font-semibold">
                                                        Sessão {session.sessionTag}
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="px-4 pb-4 space-y-4">
                                                             <FormField
                                                                control={form.control}
                                                                name={`sessions.${index}.description`}
                                                                render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Descrição da Sessão</FormLabel>
                                                                    <FormControl>
                                                                    <Input placeholder="Ex: Foco em peito e ombros" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                                )}
                                                            />
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-2">Exercícios ({session.exercises?.length || 0}):</h4>
                                                                {session.exercises && session.exercises.length > 0 ? (
                                                                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                                        {session.exercises.map((ex: SessionExercise) => (
                                                                            <li key={ex.exerciseId}>{ex.exercise?.name}: {ex.seriesAndReps.join(' / ')}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-sm text-muted-foreground">Nenhum exercício adicionado a esta sessão.</p>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-4">
                                                                <Button type="button" variant="outline" size="sm" onClick={() => handleEditSession(index)}>
                                                                    Editar Exercícios
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Remover Sessão
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    ) : (
                                        <div className="text-center py-8 text-sm text-muted-foreground">
                                            Nenhuma sessão adicionada ainda.
                                        </div>
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </ScrollArea>
      </form>
    </Form>
    
    <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{sessionTitle}</DialogTitle>
                <DialogDescription>
                    Selecione os exercícios para esta sessão na biblioteca e defina suas séries/repetições.
                </DialogDescription>
            </DialogHeader>
            <ExercisePicker 
                initialExercises={editingSession?.session.exercises as SessionExercise[] || []}
                onSave={handleSaveSession} 
            />
        </DialogContent>
    </Dialog>

    </>
  );
}
