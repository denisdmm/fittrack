'use client';
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserForm } from './_components/user-form';
import type { User } from '@/lib/types';
import { useAppContext } from '@/context/app-provider';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
    const { role } = useAppContext();
    const firestore = useFirestore();

    const usersRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);
    
    const { data: users, isLoading } = useCollection<User>(usersRef);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleAddUser = () => {
      setEditingUser(null);
      setIsDialogOpen(true);
    };

    const handleEditUser = (user: User) => {
      setEditingUser(user);
      setIsDialogOpen(true);
    };
    
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <h1 className="text-3xl font-bold font-headline">Gerenciamento de Usuários</h1>
                  <p className="text-muted-foreground">Adicione, edite e gerencie usuários do sistema.</p>
              </div>
              <DialogTrigger asChild>
                  <Button onClick={handleAddUser}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Usuário
                  </Button>
              </DialogTrigger>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
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
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
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
                            <DropdownMenuItem>Excluir</DropdownMenuItem>
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

        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Edite as informações do usuário abaixo.' : 'Preencha os detalhes para criar um novo usuário.'}
                </DialogDescription>
            </DialogHeader>
            <UserForm user={editingUser} onFinished={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
