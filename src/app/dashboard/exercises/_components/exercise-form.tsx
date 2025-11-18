'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';

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

interface ExerciseFormProps {
    exercise: Exercise | null;
    onFinished: () => void;
}

const formSchema = z.object({
    name: z.string().min(3, { message: "O nome é obrigatório." }),
    description: z.string().min(10, { message: "A descrição deve ter pelo menos 10 caracteres." }),
    type: z.enum(['Força', 'Cardio', 'Flexibilidade', 'HIIT', 'Calistenia']),
    sets: z.coerce.number().min(1, { message: "Deve ter pelo menos 1 série." }),
    reps: z.coerce.number().min(1, { message: "Deve ter pelo menos 1 repetição." }),
});

export function ExerciseForm({ exercise, onFinished }: ExerciseFormProps) {
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: exercise?.name || "",
            description: exercise?.description || "",
            type: exercise?.type || undefined,
            sets: exercise?.sets || 4,
            reps: exercise?.reps || 10,
        },
    });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        if (exercise) {
            // Update
            const exerciseRef = doc(db, "exercises", exercise.id);
            await setDoc(exerciseRef, values, { merge: true });
            toast({
                title: "Exercício Atualizado",
                description: `O exercício ${values.name} foi atualizado.`,
            });
        } else {
            // Create
            const exercisesCollectionRef = collection(db, "exercises");
            await addDoc(exercisesCollectionRef, values);
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
                    <Input placeholder="Ex: Supino Reto" {...field} />
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
                    <Textarea placeholder="Descreva como realizar o exercício..." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Exercício</FormLabel>
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
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="sets"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Séries</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="4" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Repetições</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <div className="flex justify-end">
            <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
