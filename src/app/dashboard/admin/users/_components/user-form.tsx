'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import type { User } from '@/lib/types';

interface UserFormProps {
    user: User | null;
    onFinished: () => void;
}

export function UserForm({ user, onFinished }: UserFormProps) {
    const { toast } = useToast();

    const formSchema = z.object({
        firstName: z.string().min(1, { message: "O nome é obrigatório." }),
        lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
        email: z.string().email({ message: "Por favor, insira um email válido." }),
        username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres." }),
        password: user ? z.string().optional() : z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
        role: z.enum(['user', 'admin']),
      });
      

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
      password: "",
      role: user?.role || "user",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    const formattedValues = {
        ...values,
        firstName: capitalize(values.firstName),
        lastName: capitalize(values.lastName),
    };
    console.log(formattedValues);
    toast({
      title: user ? "Usuário Atualizado" : "Usuário Criado",
      description: `O usuário ${values.firstName} foi ${user ? 'atualizado' : 'criado'} com sucesso.`,
    });
    onFinished();
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
                  <Input placeholder="João" {...field} />
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
                  <Input placeholder="Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Usuário</FormLabel>
                <FormControl>
                    <Input placeholder="joao.silva" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                    <Input type="password" placeholder={user ? "Deixe em branco para não alterar" : "Mínimo 8 caracteres"}/>
                </FormControl>
                {user && <FormDescription className="text-xs">Deixe em branco para não alterar a senha.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
        />
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
        <div className="flex justify-end">
            <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
