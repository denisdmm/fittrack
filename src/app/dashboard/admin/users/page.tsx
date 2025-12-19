'use client';
import React, { useState } from 'react';
import * as z from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Trash, History } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserForm } from './_components/user-form';
import type { User } from '@/lib/types';
import { useAppContext } from '@/context/app-provider';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { resetUserHistory } from '@/ai/flows/reset-user-history-flow';

// Define the schema here, in the client component, instead of the 'use server' file.
const ResetUserHistoryInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose history should be reset."),
});

export default function AdminUsersPage() {
    const { role } = useAppContext();
    const firestore = useFirestore();
    const { toast } = useToast();

    const usersRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);
    
    const { data: users, isLoading } = useCollection<User>(usersRef);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [alertConfig, setAlertConfig] = useState<{title: string, description: string, onConfirm: () => void}>({
      title: '',
      description: '',
      onConfirm: () => {}
    });

    const handleAddUser = () => {
      setEditingUser(null);
      setIsFormOpen(true);
    };

    const handleEditUser = (user: User) => {
      setEditingUser(user);
      setIsFormOpen(true);
    };
    
    const handleDeleteUser = async () => {
      if (!selectedUser) return;
      toast({ title: "Ação não implementada", description: `A exclusão do usuário ${selectedUser.firstName} ainda não foi implementada.`});
      // In a real app, you would call a server function to delete the user from Auth and Firestore.
      setIsAlertOpen(false);
    }
    
    const handleResetHistory = async () => {
      if (!selectedUser) return;
      try {
        // Validate input with the locally defined schema
        const input = ResetUserHistoryInputSchema.parse({ userId: selectedUser.id });
        const result = await resetUserHistory(input);
        if (result.success) {
          toast({ title: "Histórico Resetado", description: `O histórico de treinos de ${selectedUser.firstName} foi limpo.` });
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        toast({ title: "Erro", description: `Falha ao resetar o histórico: ${error.message}`, variant: "destructive" });
      }
      setIsAlertOpen(false);
    }

    const openAlert = (user: User, type: 'delete' | 'reset') => {
      setSelectedUser(user);
      if (type === 'delete') {
        setAlertConfig({
          title: `Tem certeza que deseja excluir ${user.firstName}?`,
          description: "Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e todos os seus dados.",
          onConfirm: handleDeleteUser,
        });
      } else {
        setAlertConfig({
          title: `Resetar histórico de ${user.firstName}?`,
          description: "Esta ação excluirá permanentemente todos os registros de treino deste usuário. Isso não pode ser desfeito.",
          onConfirm: handleResetHistory,
        });
      }
      setIsAlertOpen(true);
    }
    
    if (role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-2xl font-bold">Acesso Negado</h2>
              <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
              <Button asChild className="mt-4">
                  <Link href="/dashboard">Voltar ao Dashboard</Link>
              </Button>
          </div>
      );
    }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">Gerenciamento de Usuários</h1>
                <p className="text-muted-foreground">Adicione, edite e gerencie usuários do sistema.</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                  <Button onClick={handleAddUser}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Usuário
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                      <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
                      <DialogDescription>
                        {editingUser ? 'Edite as informações do usuário abaixo.' : 'Preencha os detalhes para criar um novo usuário.'}
                      </DialogDescription>
                  </DialogHeader>
                  <UserForm user={editingUser} onFinished={() => setIsFormOpen(false)} />
              </DialogContent>
            </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Uma lista de todos os usuários em sua plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    <TableRow>
                      <TableCell colSpan={5}><Skeleton className="h-8" /></TableCell>
                    </TableRow>
                      <TableRow>
                      <TableCell colSpan={5}><Skeleton className="h-8" /></TableCell>
                    </TableRow>
                  </>
                )}
                {users && users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.login}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'secondary' : 'default'} className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEditUser(user)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openAlert(user, 'reset')}>
                            <History className="mr-2 h-4 w-4" />
                            Resetar Histórico
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openAlert(user, 'delete')} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                             <Trash className="mr-2 h-4 w-4" />
                            Excluir Usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={alertConfig.onConfirm} className="bg-destructive hover:bg-destructive/90">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
