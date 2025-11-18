'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from '@/context/app-provider';

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
})

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setRole } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
 
  function onSubmit(values: z.infer<typeof formSchema>) {
    // NOTE: This is a mock authentication.
    // In a real app, you would integrate with Firebase Auth.
    toast({
      title: "Login bem-sucedido!",
      description: "Redirecionando para o seu painel...",
    })

    if (values.email === 'admin@fittrack.com' && values.password === 'admin') {
      setRole('admin');
    } else {
      setRole('user');
    }
    
    router.push('/dashboard');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="text-2xl font-headline">Bem-vindo de volta!</CardTitle>
        <CardDescription>Faça login na sua conta para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="seu@email.com" {...field} />
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
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             <div className="text-xs text-muted-foreground">
                Para demonstração: use <span className="font-bold">admin@fittrack.com</span> e senha <span className="font-bold">admin</span> para o acesso de administrador.
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Link href="/signup" className="underline">
            Cadastre-se
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
