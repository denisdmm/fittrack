'use client';

import { useForm } from "react-hook-form";
import * as z from "zod";
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from "react";

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
import type { Exercise } from '@/lib/types';
import { db } from "@/firebase/config";
import { Textarea } from "@/components/ui/textarea";
import { useAppContext } from "@/context/app-provider";
import { toTitleCase } from "@/lib/utils";

interface ExerciseFormProps {
    exercise: Exercise | null;
    isDuplicating?: boolean;
    onFinished: () => void;
    allExercises: Exercise[]; // Pass all exercises for name checking
}

const formSchema = z.object({
    name: z.string().min(3, { message: "O nome é obrigatório." }),
    aliases: z.string().optional(),
    description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
    type: z.enum(['Força', 'Cardio', 'Flexibilidade', 'HIIT', 'Calistenia', 'Hipertrofia']),
    muscleGroup: z.enum(['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Corpo Inteiro', 'Cardio', 'Flexibilidade']),
    equipment: z.enum(['Calistenia', 'Aparelhos', 'Livres', 'Ambos']),
});

export function ExerciseForm({ exercise, isDuplicating, onFinished, allExercises }: ExerciseFormProps) {
    const { toast } = useToast();
    const { user } = useAppContext();
    const [originalName, setOriginalName] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            name: exercise?.name || "",
            aliases: exercise?.aliases?.join(', ') || "",
            description: exercise?.description || "",
            type: exercise?.type as any || undefined,
            muscleGroup: exercise?.muscleGroup as any || undefined,
            equipment: exercise?.equipment as any || undefined,
        },
    });

    useEffect(() => {
        form.reset({
            name: exercise?.name || "",
            aliases: exercise?.aliases?.join(', ') || "",
            description: exercise?.description || "",
            type: exercise?.type as any || undefined,
            muscleGroup: exercise?.muscleGroup as any || undefined,
            equipment: exercise?.equipment as any || undefined,
        });
        if (isDuplicating && exercise) {
            setOriginalName(exercise.name);
        } else {
            setOriginalName(null);
        }
    }, [exercise, isDuplicating, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: 'Erro', description: 'Você precisa estar logado para fazer isso.', variant: 'destructive' });
        return;
    }
    
    const isNameTaken = allExercises.some(ex => ex.name.toLowerCase() === values.name.toLowerCase() && ex.id !== exercise?.id);
    if (isNameTaken) {
        form.setError("name", {
            type: "manual",
            message: "Este nome de exercício já está em uso. Por favor, escolha outro.",
        });
        return;
    }

    const dataToSave = {
        ...values,
        name: toTitleCase(values.name),
        aliases: values.aliases ? values.aliases.split(',').map(s => toTitleCase(s.trim())).filter(Boolean) : [],
    };

    try {
        if (exercise && !isDuplicating) {
            const exerciseRef = doc(db, "exercises", exercise.id);
            await setDoc(exerciseRef, dataToSave, { merge: true });
            toast({
                title: "Exercício Atualizado",
                description: `O exercício ${values.name} foi atualizado.`,
            });
        } else {
            const exercisesCollectionRef = collection(db, "exercises");
            await addDoc(exercisesCollectionRef, { ...dataToSave, userId: user.id });
            toast({
                title: "Exercício Criado",
                description: `O exercício ${values.name} foi adicionado com sucesso.`,
            });
        }
        onFinished();
    } catch (error: any) {
        toast({
            title: "Erro",
            description: `Ocorreu um erro: ${error.message}`,
            variant: "destructive"
        });
    }
  }

  const isSaveDisabled = isDuplicating && form.watch('name') === originalName;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome do Exercício</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Supino Reto" {...field} onBlur={(e) => field.onChange(toTitleCase(e.target.value))}/>
                </FormControl>
                {isSaveDisabled && <FormDescription className="text-amber-600">Por favor, altere o nome para salvar como um novo exercício.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="aliases"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nomes Alternativos</FormLabel>
                <FormControl>
                    <Input placeholder="Ex: Supino, Bench Press" {...field} onBlur={(e) => field.onChange(e.target.value.split(',').map(s => toTitleCase(s.trim())).join(', '))}/>
                </FormControl>
                <FormDescription>
                    Também conhecido como. Separe os nomes por vírgula.
                </FormDescription>
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
                    <Textarea placeholder="Descreva como realizar o exercício..." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-3 gap-4">
            <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Força">Força</SelectItem>
                                <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                                <SelectItem value="Cardio">Cardio</SelectItem>
                                <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                                <SelectItem value="HIIT">HIIT</SelectItem>
                                <SelectItem value="Calistenia">Calistenia</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="muscleGroup"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Grupo Muscular</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um grupo" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Peito">Peito</SelectItem>
                                <SelectItem value="Costas">Costas</SelectItem>
                                <SelectItem value="Pernas">Pernas</SelectItem>
                                <SelectItem value="Ombros">Ombros</SelectItem>
                                <SelectItem value="Braços">Braços</SelectItem>
                                <SelectItem value="Core">Core</SelectItem>
                                <SelectItem value="Corpo Inteiro">Corpo Inteiro</SelectItem>
                                <SelectItem value="Cardio">Cardio</SelectItem>
                                <SelectItem value="Flexibilidade">Flexibilidade</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="equipment"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Equipamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Livres">Pesos Livres</SelectItem>
                                <SelectItem value="Aparelhos">Aparelhos</SelectItem>
                                <SelectItem value="Calistenia">Calistenia</SelectItem>
                                <SelectItem value="Ambos">Ambos</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaveDisabled}>Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
