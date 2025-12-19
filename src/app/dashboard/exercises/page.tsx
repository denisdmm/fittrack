'use client';
import React, { useState, useMemo, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { ExerciseForm } from './_components/exercise-form';
import type { Exercise } from '@/lib/types';
import { useAppContext } from '@/context/app-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const muscleGroups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Corpo Inteiro', 'Cardio', 'Flexibilidade'];
const equipments = ['Todos', 'Livres', 'Aparelhos', 'Calistenia', 'Ambos'];


export default function AdminExercisesPage() {
    const { role, user } = useAppContext();
    const firestore = useFirestore();
    const { toast } = useToast();

    const exercisesRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exercises');
    }, [firestore]);
    
    const { data: exercises, isLoading } = useCollection<Exercise>(exercisesRef);
    
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
    const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [muscleGroupFilter, setMuscleGroupFilter] = useState('Todos');
    const [equipmentFilter, setEquipmentFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExercises = useMemo(() => {
      if (!exercises) return [];
      
      let tempExercises = [...exercises];

      if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        tempExercises = tempExercises.filter(exercise => 
          exercise.name.toLowerCase().includes(lowercasedTerm) ||
          (exercise.aliases && exercise.aliases.some(alias => alias.toLowerCase().includes(lowercasedTerm)))
        );
      } else {
        if (muscleGroupFilter !== 'Todos') {
          tempExercises = tempExercises.filter(exercise => 
            exercise.muscleGroup === muscleGroupFilter
          );
        }
        
        if (equipmentFilter !== 'Todos') {
          tempExercises = tempExercises.filter(exercise => 
            exercise.equipment === equipmentFilter || (exercise.equipment === 'Ambos')
          );
        }
      }

      return tempExercises;
    }, [exercises, muscleGroupFilter, equipmentFilter, searchTerm]);

    useEffect(() => {
      if (searchTerm) {
        setMuscleGroupFilter('Todos');
        setEquipmentFilter('Todos');
      }
    }, [searchTerm]);

    const handleAddExercise = () => {
      setEditingExercise(null);
      setIsDuplicating(false);
      setIsFormDialogOpen(true);
    };

    const handleEditExercise = (exercise: Exercise) => {
      if (!canEditOrDelete(exercise)) {
        toast({ title: 'Acesso Negado', description: 'Você só pode editar exercícios que você criou ou que são do sistema (como admin).', variant: 'destructive' });
        return;
      }
      setEditingExercise(exercise);
      setIsDuplicating(false);
      setIsFormDialogOpen(true);
    };

    const handleDuplicateExercise = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setIsDuplicating(true);
        setIsFormDialogOpen(true);
    };

    const promptDeleteExercise = (exercise: Exercise) => {
      if (!canEditOrDelete(exercise)) {
        toast({ title: 'Acesso Negado', description: 'Você não tem permissão para excluir este exercício.', variant: 'destructive' });
        return;
      }
      setDeletingExercise(exercise);
      setIsDeleteDialogOpen(true);
    };


    const handleDeleteExercise = async () => {
        if (!firestore || !deletingExercise) return;

        try {
          const exerciseDocRef = doc(firestore, 'exercises', deletingExercise.id);
          await deleteDoc(exerciseDocRef);
          toast({
            title: 'Exercício Excluído',
            description: `O exercício "${deletingExercise.name}" foi removido com sucesso.`,
          });
        } catch (error: any) {
          console.error("Failed to delete exercise:", error);
          toast({
            title: 'Erro ao Excluir',
            description: `Não foi possível remover o exercício: ${error.message}`,
            variant: 'destructive',
          });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingExercise(null);
        }
    };
    
    const getDialogTitle = () => {
        if (isDuplicating) return 'Duplicar Exercício';
        if (editingExercise) return 'Editar Exercício';
        return 'Adicionar Exercício';
    };

    const getDialogDescription = () => {
        if (isDuplicating) return 'Altere o nome e outros detalhes para criar um novo exercício baseado neste.';
        if (editingExercise) return 'Edite as informações do exercício abaixo.';
        return 'Preencha os detalhes para criar um novo exercício.';
    };

    const canEditOrDelete = (exercise: Exercise) => {
      if (!user) return false;
      if (role === 'admin') return true;
      return exercise.userId === user.id;
    }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">Gerenciamento de Exercícios</h1>
                <p className="text-muted-foreground">Adicione, edite e gerencie os exercícios da plataforma.</p>
            </div>
            {role === 'admin' && (
              <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleAddExercise}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Exercício
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                        <DialogDescription>
                          {getDialogDescription()}
                        </DialogDescription>
                    </DialogHeader>
                    <ExerciseForm 
                      exercise={editingExercise} 
                      isDuplicating={isDuplicating}
                      onFinished={() => setIsFormDialogOpen(false)} 
                      allExercises={exercises || []}
                    />
                </DialogContent>
              </Dialog>
            )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <CardTitle>Exercícios</CardTitle>
                <CardDescription>
                  A lista de todos os exercícios disponíveis na sua plataforma.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full md:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nome..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <div className="w-full sm:w-[150px]">
                  <Select value={equipmentFilter} onValueChange={setEquipmentFilter} disabled={!!searchTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipments.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[200px]">
                  <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter} disabled={!!searchTerm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grupo muscular" />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Também conhecido como</TableHead>
                  <TableHead className="hidden md:table-cell">Grupo Muscular</TableHead>
                  <TableHead className="hidden md:table-cell">Equipamento</TableHead>
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
                {filteredExercises && filteredExercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {exercise.aliases?.map(alias => (
                          <Badge key={alias} variant="outline" className="font-normal">{alias}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={'secondary'}>{exercise.muscleGroup}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={'outline'}>{exercise.equipment}</Badge>
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
                          <DropdownMenuItem onSelect={() => handleEditExercise(exercise)} disabled={!canEditOrDelete(exercise)}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDuplicateExercise(exercise)}>Duplicar</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => promptDeleteExercise(exercise)} disabled={!canEditOrDelete(exercise)} className="text-red-600 focus:bg-red-50 focus:text-red-700">Excluir</DropdownMenuItem>
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o exercício
              <span className="font-semibold"> "{deletingExercise?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExercise} className="bg-destructive hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
