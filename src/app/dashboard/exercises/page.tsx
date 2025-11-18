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
import { ExerciseForm } from './_components/exercise-form';
import type { Exercise } from '@/lib/types';
import { useAppContext } from '@/context/app-provider';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function AdminExercisesPage() {
    const { role } = useAppContext();
    const firestore = useFirestore();
    const { toast } = useToast();

    const exercisesRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exercises');
    }, [firestore]);
    
    const { data: exercises, isLoading } = useCollection<Exercise>(exercisesRef);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    const handleAddExercise = () => {
      setEditingExercise(null);
      setIsDialogOpen(true);
    };

    const handleEditExercise = (exercise: Exercise) => {
      setEditingExercise(exercise);
      setIsDialogOpen(true);
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        if (!firestore) return;
        if (!confirm('Tem certeza de que deseja excluir este exercício? Esta ação não pode ser desfeita.')) return;
    
        try {
          const exerciseDocRef = doc(firestore, 'exercises', exerciseId);
          await deleteDoc(exerciseDocRef);
          toast({
            title: 'Exercício Excluído',
            description: 'O exercício foi removido com sucesso.',
          });
        } catch (error: any) {
          toast({
            title: 'Erro ao Excluir',
            description: `Não foi possível remover o exercício: ${error.message}`,
            variant: 'destructive',
          });
        }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">Gerenciamento de Exercícios</h1>
                <p className="text-muted-foreground">Adicione, edite e gerencie os exercícios da plataforma.</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                  <Button onClick={handleAddExercise}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Exercício
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                      <DialogTitle>{editingExercise ? 'Editar Exercício' : 'Adicionar Exercício'}</DialogTitle>
                      <DialogDescription>
                        {editingExercise ? 'Edite as informações do exercício abaixo.' : 'Preencha os detalhes para criar um novo exercício.'}
                      </DialogDescription>
                  </DialogHeader>
                  <ExerciseForm exercise={editingExercise} onFinished={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exercícios</CardTitle>
            <CardDescription>
              A lista de todos os exercícios disponíveis na sua plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <>
                    <TableRow>
                      <TableCell colSpan={3}><Skeleton className="h-8" /></TableCell>
                    </TableRow>
                      <TableRow>
                      <TableCell colSpan={3}><Skeleton className="h-8" /></TableCell>
                    </TableRow>
                  </>
                )}
                {exercises && exercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.name}</TableCell>
                    <TableCell>
                      <Badge variant={'outline'}>{exercise.type}</Badge>
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
                          <DropdownMenuItem onSelect={() => handleEditExercise(exercise)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDeleteExercise(exercise.id)}>Excluir</DropdownMenuItem>
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
    </>
  );
}
