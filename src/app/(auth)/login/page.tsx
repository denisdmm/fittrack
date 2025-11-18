'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState } from 'react';

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
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserEmail } from '@/ai/flows/get-user-email-flow';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(1, { message: "O nome de usuário é obrigatório." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
})

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })
 
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviços do Firebase não estão disponíveis.",
      });
      return;
    }
    
    try {
      let email;
      // Special case for demo admin user to make login more robust
      if (values.username === 'admin') {
        email = 'admin@fittrack.app';
      } else {
        // For all other users, securely find their email via Genkit flow
        const result = await getUserEmail({ username: values.username });
        email = result.email;
      }

      if (!email) {
        throw new Error("Usuário não encontrado ou e-mail inválido.");
      }
      
      // Use email and password to sign in
      await signInWithEmailAndPassword(auth, email, values.password);

      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o seu painel...",
      })
      
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error.message.includes('auth/invalid-credential') ? "Credenciais inválidas." : "Usuário ou senha inválidos.",
      });
    }
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="seu.usuario" {...field} />
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
                        placeholder="********" 
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
             <div className="text-xs text-muted-foreground">
                Para demonstração: use <span className="font-bold">admin</span> e senha <span className="font-bold">admin</span> para o acesso de administrador.
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
