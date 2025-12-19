'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

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
import type { User, WorkoutPlan } from '@/lib/types';
import { Eye, EyeOff } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { createUser, CreateUserInput, CreateUserInputSchema } from "@/ai/flows/create-user-flow";
import { getFormSchema } from "@/lib/schemas/user-schema";

interface UserFormProps {
    user: User | null;
    onFinished: () => void;
}

export function UserForm({ user, onFinished }: UserFormProps) {
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const firestore = useFirestore();

    const isEditing = !!user;
    const formSchema = getFormSchema(isEditing);
      
    const plansRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'workout_routines_public');
    }, [firestore]);
    
    const { data: workoutPlans, isLoading: arePlansLoading } = useCollection<WorkoutPlan>(plansRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      login: user?.login || "",
      password: "",
      role: user?.role || "user",
      status: user?.status || "active",
      instagramUrl: user?.instagramUrl || "",
      activeWorkoutPlanId: user?.activeWorkoutPlanId || "",
    },
  });

  const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formattedValues = {
        ...values,
        firstName: capitalize(values.firstName),
        lastName: capitalize(values.lastName),
        login: values.login.toLowerCase(),
    };
    
    try {
        if (user) {
            // Update user
            const userRef = doc(db, "users", user.id);
            await setDoc(userRef, { 
                firstName: formattedValues.firstName,
                lastName: formattedValues.lastName,
                login: formattedValues.login,
                role: formattedValues.role,
                status: formattedValues.status,
                instagramUrl: formattedValues.instagramUrl,
                activeWorkoutPlanId: formattedValues.activeWorkoutPlanId === 'none' ? '' : formattedValues.activeWorkoutPlanId,
            }, { merge: true });
            toast({
                title: "Usuário Atualizado",
                description: `O usuário ${values.firstName} foi atualizado com sucesso.`,
            });
        } else {
            // Create user - password is known to be a string here due to schema logic
            const result = await createUser(formattedValues as CreateUserInput);
            if (result.success) {
                toast({
                    title: "Usuário Criado",
                    description: `O usuário ${formattedValues.firstName} foi criado com sucesso.`,
                });
            } else {
                throw new Error(result.message);
            }
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="João" {...field} onChange={e => field.onChange(capitalize(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input placeholder="Silva" {...field} onChange={e => field.onChange(capitalize(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="login"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Usuário</FormLabel>
                <FormControl>
                    <Input placeholder="joao.silva" {...field} disabled={!!user} />
                </FormControl>
                 <FormDescription className="text-xs">
                    {user ? "O nome de usuário não pode ser alterado." : "Será usado para o login. Ex: joao.silva"}
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="instagramUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Instagram URL</FormLabel>
                <FormControl>
                    <Input placeholder="https://instagram.com/seu_usuario" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        {!user && (
          <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                      <div className="relative">
                          <Input
                              type={showPassword ? "text" : "password"}
                              placeholder={"Senha com no mínimo 6 caracteres"}
                              {...field}
                          />
                          <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                      </div>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
          />
        )}
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
        control={form.control}
        name="activeWorkoutPlanId"
        render={({ field }) => (
            <FormItem>
                <FormLabel>Plano de Treino Ativo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'none'} disabled={arePlansLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano de treino" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {workoutPlans?.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormDescription className="text-xs">Atribua um plano de treino ativo para este usuário.</FormDescription>
                <FormMessage />
            </FormItem>
        )}
        />
        <div className="flex justify-end">
            <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
