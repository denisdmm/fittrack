'use client';

import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { doc, setDoc, addDoc, collection, query, orderBy, limit } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-provider";
import { Separator } from "@/components/ui/separator";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { HealthLog } from "@/lib/types";

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "O nome é obrigatório." }),
  lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
});

const healthFormSchema = z.object({
    birthDate: z.string().optional(),
    height: z.coerce.number().positive({ message: "A altura deve ser um número positivo." }).optional(),
    weight: z.coerce.number().positive({ message: "O peso deve ser um número positivo." }).optional(),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, { message: "A senha atual é obrigatória." }),
    newPassword: z.string().min(1, { message: "A nova senha é obrigatória." }),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAppContext();
  const firestore = useFirestore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --- Health Data ---
  const healthLogsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.id}/health_logs`), orderBy('date', 'desc'), limit(1));
  }, [firestore, user]);

  const { data: latestHealthLog, isLoading: isHealthLogLoading } = useCollection<HealthLog>(healthLogsRef);

  const currentWeight = useMemo(() => latestHealthLog?.[0]?.weight, [latestHealthLog]);

  const age = useMemo(() => {
    if (!user?.birthDate) return null;
    const birthDate = new Date(user.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }, [user?.birthDate]);

  const imc = useMemo(() => {
    if (!currentWeight || !user?.height) return null;
    const heightInMeters = user.height / 100;
    return (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);
  }, [currentWeight, user?.height]);

  // --- Forms ---
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const healthForm = useForm<z.infer<typeof healthFormSchema>>({
    defaultValues: {
        birthDate: user?.birthDate || "",
        height: user?.height || undefined,
        weight: currentWeight || undefined,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

   // Update forms when user data loads
   useEffect(() => {
    if (user) {
        profileForm.reset({
            firstName: user.firstName,
            lastName: user.lastName,
        });
        healthForm.reset({
            birthDate: user.birthDate || "",
            height: user.height || undefined,
            weight: currentWeight || undefined,
        });
    }
  }, [user, currentWeight, profileForm, healthForm]);


  const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!firestore || !user) {
        toast({
            title: "Erro",
            description: "Não foi possível salvar o perfil. Usuário não encontrado.",
            variant: "destructive",
        });
        return;
    }
    const formattedValues = {
        ...values,
        firstName: capitalize(values.firstName),
        lastName: capitalize(values.lastName),
    };
    try {
        const userRef = doc(firestore, "users", user.id);
        await setDoc(userRef, { 
            firstName: formattedValues.firstName,
            lastName: formattedValues.lastName,
        }, { merge: true });

        toast({
          title: "Perfil Atualizado",
          description: "Suas informações foram salvas com sucesso.",
        });

    } catch (error: any) {
        toast({
            title: "Erro ao Salvar",
            description: `Ocorreu um erro: ${error.message}`,
            variant: "destructive"
        });
    }
  }

  async function onHealthSubmit(values: z.infer<typeof healthFormSchema>) {
      if (!firestore || !user) return;
      
      const promises = [];
      
      // 1. Update user document with birthDate and height
      const userUpdateData: { birthDate?: string; height?: number } = {};
      if (values.birthDate && values.birthDate !== user.birthDate) {
          userUpdateData.birthDate = values.birthDate;
      }
      if (values.height && values.height !== user.height) {
          userUpdateData.height = values.height;
      }

      if (Object.keys(userUpdateData).length > 0) {
        const userRef = doc(firestore, "users", user.id);
        promises.push(setDoc(userRef, userUpdateData, { merge: true }));
      }

      // 2. Add new weight log if it has changed
      if (values.weight && values.weight !== currentWeight) {
        const healthLogCollection = collection(firestore, `users/${user.id}/health_logs`);
        promises.push(addDoc(healthLogCollection, {
            userId: user.id,
            date: new Date().toISOString(),
            weight: values.weight,
        }));
      }

      try {
        await Promise.all(promises);
        toast({
            title: "Dados de Saúde Salvos",
            description: "Suas informações de saúde foram atualizadas.",
        });
      } catch (error: any) {
         toast({
            title: "Erro ao Salvar",
            description: `Ocorreu um erro: ${error.message}`,
            variant: "destructive"
        });
      }
  }

  function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    console.log(values);
    toast({
      title: "Senha Alterada",
      description: "Sua senha foi alterada com sucesso.",
      variant: "default",
    });
    passwordForm.reset();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        <div>
            <h1 className="text-3xl font-bold font-headline">Gerenciamento de Perfil</h1>
            <p className="text-muted-foreground">Atualize suas informações pessoais e de saúde.</p>
        </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
             <Image
                src={`https://picsum.photos/seed/${user?.id || '1'}/200/200`}
                width={80}
                height={80}
                alt="Avatar"
                className="rounded-full border-2 border-primary"
                data-ai-hint="person portrait"
            />
            <div>
                <CardTitle>{user?.firstName} {user?.lastName}</CardTitle>
                <CardDescription>Gerencie suas informações pessoais e de login.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={e => field.onChange(capitalize(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input {...field} onChange={e => field.onChange(capitalize(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit">Salvar Alterações</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Separator />

       <Card>
        <CardHeader>
            <CardTitle>Minha Saúde</CardTitle>
            <CardDescription>Mantenha seus dados de saúde atualizados para um melhor acompanhamento.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-center">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Idade</p>
                    <p className="text-2xl font-bold">{age ?? '--'}</p>
                </div>
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Altura</p>
                    <p className="text-2xl font-bold">{user?.height ? `${user.height} cm` : '--'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Peso</p>
                    <p className="text-2xl font-bold">{isHealthLogLoading ? '...' : currentWeight ? `${currentWeight} kg` : '--'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">IMC</p>
                    <p className="text-2xl font-bold">{imc ?? '--'}</p>
                </div>
            </div>
             <Form {...healthForm}>
                <form onSubmit={healthForm.handleSubmit(onHealthSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                            control={healthForm.control}
                            name="birthDate"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Data de Nascimento</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={healthForm.control}
                            name="height"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Altura (cm)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ex: 175" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={healthForm.control}
                            name="weight"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Peso Atual (kg)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" placeholder="Ex: 70.5" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <Button type="submit">Salvar Dados de Saúde</Button>
                </form>
             </Form>
        </CardContent>
       </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>Para sua segurança, recomendamos o uso de uma senha forte.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-sm">
              <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showCurrentPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input 
                            type={showNewPassword ? "text" : "password"} 
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Alterar Senha</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
