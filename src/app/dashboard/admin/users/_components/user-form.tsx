'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from 'react';

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
import { Eye, EyeOff } from "lucide-react";

interface UserFormProps {
    user: User | null;
    onFinished: () => void;
}

export function UserForm({ user, onFinished }: UserFormProps) {
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);

    const formSchema = z.object({
        firstName: z.string().min(1, { message: "O nome é obrigatório." }),
        lastName: z.string().min(1, { message: "O sobrenome é obrigatório." }),
        username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres." }),
        password: user ? z.string().optional() : z.string().min(1, { message: "A senha é obrigatória." }),
        role: z.enum(['user', 'admin']),
      });
      

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      password: "",
      role: user?.role || "user",
    },
  });

  const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
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
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={user ? "Deixe em branco para não alterar" : "Senha"}
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
