'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

const formSchema = z.object({
  username: z.string().min(1, { message: "O nome de usuário é obrigatório." }),
  password: z.string().min(1, { message: "A senha é obrigatória." }),
})

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      username: "",
      password: "",
    },
  })
 
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviços do Firebase não estão disponíveis.",
      });
      return;
    }
    
    try {
      const email = `${values.username.toLowerCase()}@fittrack.app`;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, values.password);

      // After successful authentication, check user status in Firestore
      const userDocRef = doc(firestore, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("Documento do usuário não encontrado no Firestore.");
      }

      const userData = userDoc.data() as User;

      if (userData.status === 'inactive') {
        // If user is inactive, sign them out and show a message
        await auth.signOut();
        toast({
          variant: "destructive",
          title: "Conta Inativa",
          description: "Sua conta está aguardando aprovação de um administrador.",
          duration: 5000,
        });
        return;
      }

      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o seu painel...",
      })
      
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Login failed:", error);
      let description = "Ocorreu um erro durante o login.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-email') {
        description = "Credenciais inválidas. Verifique seu usuário e senha.";
      }
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: description,
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
