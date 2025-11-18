'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-provider";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: "O nome é obrigatório." }),
  lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
});

const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, { message: "A senha atual é obrigatória." }),
    newPassword: z.string().min(8, { message: "A nova senha deve ter pelo menos 8 caracteres." }),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAppContext();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });


  function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    console.log(values);
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
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
            <p className="text-muted-foreground">Atualize suas informações pessoais e de segurança.</p>
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Salvar Alterações</Button>
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
                        <Input type="password" {...field} />
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
                        <Input type="password" {...field} />
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
