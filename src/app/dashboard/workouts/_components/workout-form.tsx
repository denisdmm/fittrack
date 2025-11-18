'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addDoc, collection } from 'firebase/firestore';

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
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Exercise } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface WorkoutFormProps {
    onFinished: () => void;
}

const formSchema = z.object({
    name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
    description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
    difficultyLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado']),
    type: z.enum(['Força', 'Cardio', 'Flexibilidade', 'HIIT', 'Calistenia']),
    exerciseIds: z.array(z.string()).min(1, { message: "Selecione pelo menos um exercício." }),
  });

export function WorkoutForm({ onFinished }: WorkoutFormProps) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const exercisesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exercises');
    }, [firestore]);

    const { data: exercises, isLoading: isLoadingExercises } = useCollection<Exercise>(exercisesCollectionRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      exerciseIds: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    
    try {
        const workoutsCollectionRef = collection(firestore, 'workout_routines_public');
        
        const selectedExercises = exercises?.filter(e => values.exerciseIds.includes(e.id));
        
        await addDoc(workoutsCollectionRef, {
            ...values,
            exerciseIds: selectedExercises || [], // Embed full exercise objects
        });
        
        toast({
            title: "Treino Criado",
            description: `O treino "${values.name}" foi criado com sucesso.`,
        });

        onFinished();
    } catch (error: any) {
        toast({
            title: "Erro",
            description: `Ocorreu um erro: ${error.message}`,
            variant: "destructive"
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome do Treino</FormLabel>
                        <FormControl>
                        <Input placeholder="Ex: Força Total" {...field} />
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
                        <Textarea placeholder="Descreva o objetivo deste treino..." {...field} />
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
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Treino</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um tipo" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Força">Força</SelectItem>
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
                </div>
            </div>
             <FormField
                control={form.control}
                name="exerciseIds"
                render={() => (
                    <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base">Exercícios</FormLabel>
                            <FormDescription>
                               Selecione os exercícios que farão parte desta rotina.
                            </FormDescription>
                        </div>
                        <ScrollArea className="h-72 w-full rounded-md border p-4">
                            {isLoadingExercises && <Skeleton className="h-full w-full" />}
                            {exercises?.map((item) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name="exerciseIds"
                                render={({ field }) => {
                                    return (
                                    <FormItem
                                        key={item.id}
                                        className="flex flex-row items-center space-x-3 space-y-0 my-2"
                                    >
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...field.value, item.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                    (value) => value !== item.id
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {item.name}
                                        </FormLabel>
                                    </FormItem>
                                    )
                                }}
                                />
                            ))}
                        </ScrollArea>
                        <FormMessage />
                    </FormItem>
                )}
                />
        </div>
        <div className="flex justify-end">
            <Button type="submit">Salvar Treino</Button>
        </div>
      </form>
    </Form>
  );
}
