

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Search, Trash2, Eye, PlayCircle, CheckCircle, LayoutGrid, List, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { collection, deleteDoc, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Workout, Exercise, WorkoutPlan, SessionExercise } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WorkoutForm } from './_components/workout-form';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Routine = Workout | WorkoutPlan;

function isPlan(item: Routine): item is WorkoutPlan {
    return 'sessions' in item && Array.isArray(item.sessions);
}

export default function WorkoutsAdminPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user, role, setActiveWorkout } = useAppContext();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [deletingWorkout, setDeletingWorkout] = useState<Routine | null>(null);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');


    const workoutsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'workout_routines_public');
    }, [firestore]);
    
    const exercisesCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exercises');
    }, [firestore]);

    const { data: routines, isLoading: isWorkoutsLoading } = useCollection<WorkoutPlan>(workoutsCollectionRef);
    const { data: allExercises, isLoading: areExercisesLoading } = useCollection<Exercise>(exercisesCollectionRef);
    
    const routinesWithExercises = useMemo(() => {
        if (!routines || !allExercises) return [];
        return routines.map(routine => {
            if (isPlan(routine)) {
                return {
                    ...routine,
                    sessions: routine.sessions.map(session => {
                        // The 'exercises' array on the session now holds { exerciseId, seriesAndReps }
                        const exercisesWithDetails = (session.exercises || []).map((sessionEx: any) => {
                           const fullExercise = allExercises.find(e => e.id === sessionEx.exerciseId);
                           return fullExercise ? { ...sessionEx, exercise: fullExercise } : null;
                        }).filter(Boolean) as SessionExercise[];

                        return {
                            ...session,
                            exercises: exercisesWithDetails
                        }
                    })
                };
            }
            return routine;
        });
    }, [routines, allExercises]);

    const isLoading = isWorkoutsLoading || areExercisesLoading;

    const handleStartWorkout = (workout: Workout) => {
        setActiveWorkout(workout);
        toast({
            title: "Treino Iniciado!",
            description: `A sessão "${workout.name}" foi adicionada ao seu logger.`,
        });
    }

    const handleCreate = () => {
        setEditingWorkout(null);
        setIsDialogOpen(true);
    }
    
    const handleEdit = (routine: Routine) => {
        const fullRoutine = routinesWithExercises.find(r => r.id === routine.id);

        if (fullRoutine && isPlan(fullRoutine)) {
            setEditingWorkout(fullRoutine);
            setIsDialogOpen(true);
        } else {
            toast({ title: "Ação não disponível", description: "A edição de treinos avulsos ainda não foi implementada." });
        }
    }

    const canEditOrDelete = (routine: Routine) => {
        if (!user) return false;
        if (role === 'admin') return true;
        return routine.userId === user.id;
    }

    const promptDelete = (routine: Routine) => {
        if (!canEditOrDelete(routine)) {
            toast({
                title: 'Acesso Negado',
                description: 'Você não tem permissão para excluir este treino.',
                variant: 'destructive',
            });
            return;
        }
        setDeletingWorkout(routine);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!firestore || !deletingWorkout) return;
        try {
            const workoutDocRef = doc(firestore, 'workout_routines_public', deletingWorkout.id);
            await deleteDoc(workoutDocRef);
            toast({
                title: 'Item Excluído',
                description: `"${deletingWorkout.name}" foi removido.`,
            });
        } catch (error: any) {
            toast({
                title: 'Erro ao Excluir',
                description: `Não foi possível remover o item: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsAlertOpen(false);
            setDeletingWorkout(null);
        }
    };

    const renderActions = (routine: Routine) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 z-20 relative">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {!isPlan(routine) && (
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleStartWorkout(routine as Workout)}}>
                        <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Treino Avulso
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                    <Link href={`/dashboard/athlete/workouts/${routine.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => handleEdit(routine)} disabled={!canEditOrDelete(routine) || !isPlan(routine)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => promptDelete(routine)} disabled={!canEditOrDelete(routine)} className="text-red-500 focus:text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );


  return (
    <>
    <TooltipProvider>
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gerenciar Planos de Treino</h1>
          <p className="text-muted-foreground">Crie, edite e organize os planos de treino da plataforma.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar treinos..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[280px]"
              />
            </div>
             <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grade</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8">
                      <List className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Lista</TooltipContent>
                </Tooltip>
             </div>
             {role === 'admin' && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Plano
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingWorkout ? "Editar Plano de Treino" : "Criar Novo Plano de Treino"}</DialogTitle>
                        <DialogDescription>
                            {editingWorkout ? "Edite os detalhes do seu plano abaixo." : "Preencha os detalhes para criar um novo plano de treino com sessões."}
                        </DialogDescription>
                    </DialogHeader>
                    <WorkoutForm 
                        workoutPlan={editingWorkout}
                        onFinished={() => setIsDialogOpen(false)} 
                    />
                </DialogContent>
                </Dialog>
             )}
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading && (
                Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden h-full flex flex-col">
                        <CardHeader className="p-0">
                            <Skeleton className="h-48 w-full" />
                        </CardHeader>
                        <CardContent className="p-4 flex-grow">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2 mt-1" />
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Skeleton className="h-6 w-20" />
                        </CardFooter>
                    </Card>
                ))
            )}
            {routinesWithExercises && routinesWithExercises.map((routine) => (
                <Card key={routine.id} className="overflow-hidden h-full flex flex-col group transition-all hover:shadow-xl">
                    <div className="relative">
                        <Link href={`/dashboard/athlete/workouts/${routine.id}`} className='absolute inset-0 z-10' aria-label={`Ver detalhes de ${routine.name}`}/>
                        <div className="absolute top-2 right-2 z-20">
                            {renderActions(routine)}
                        </div>
                        <CardHeader className="p-0">
                            <div className="relative h-48 w-full">
                            <Image
                                src={routine.image || "https://picsum.photos/seed/1/600/400"}
                                alt={routine.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                data-ai-hint={routine.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-4">
                                <Badge variant={routine.difficultyLevel === 'Iniciante' ? 'default' : routine.difficultyLevel === 'Intermediário' ? 'secondary' : 'destructive'} className="bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">{routine.difficultyLevel}</Badge>
                            </div>
                            </div>
                        </CardHeader>
                    </div>

                    <CardContent className="p-4 flex-grow">
                        <CardTitle className="mb-2 text-lg font-headline group-hover:text-primary transition-colors">
                            <Link href={`/dashboard/athlete/workouts/${routine.id}`} className='relative z-10'>{routine.name}</Link>
                        </CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{routine.description}</CardDescription>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                        <div className="flex-wrap gap-1">
                            {isPlan(routine) ? 
                                routine.sessions.map(s => <Badge key={s.sessionTag} variant="outline">Sessão {s.sessionTag}</Badge>) :
                                (routine as Workout).sessionTag && <Badge variant="outline">Sessão {(routine as Workout).sessionTag}</Badge>
                            }
                            {!isPlan(routine) && !(routine as Workout).sessionTag && <Badge variant="secondary">Avulso</Badge>}
                        </div>
                         {canEditOrDelete(routine) && isPlan(routine) && (
                           <Button 
                             size="sm" 
                             variant="secondary" 
                             onClick={() => handleEdit(routine)} 
                             className="relative z-20"
                             aria-label={`Editar ${routine.name}`}
                           >
                             <Pencil className="mr-2 h-4 w-4" /> Editar
                           </Button>
                         )}
                    </CardFooter>
                </Card>
            ))}
        </div>
      ) : (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[40%]">Treino</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead className="hidden md:table-cell">Tipo / Sessões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                     {isLoading && (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                            </TableRow>
                        ))
                    )}
                    {routinesWithExercises && routinesWithExercises.map((routine) => (
                        <TableRow key={routine.id}>
                            <TableCell>
                                <Link href={`/dashboard/athlete/workouts/${routine.id}`} className="font-medium hover:underline">{routine.name}</Link>
                                <div className="text-sm text-muted-foreground line-clamp-1">{routine.description}</div>
                            </TableCell>
                            <TableCell>
                               <Badge variant={routine.difficultyLevel === 'Iniciante' ? 'default' : routine.difficultyLevel === 'Intermediário' ? 'secondary' : 'destructive'}>{routine.difficultyLevel}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {isPlan(routine) ? 
                                        routine.sessions.map(s => <Badge key={s.sessionTag} variant="outline">{s.sessionTag}</Badge>) :
                                        (routine as Workout).sessionTag ? <Badge variant="outline">Sessão {(routine as Workout).sessionTag}</Badge> : <Badge variant="secondary">Avulso</Badge>
                                    }
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                             <Button variant="ghost" size="icon" disabled>
                                                <CheckCircle className={`h-4 w-4 ${user?.activeWorkoutPlanId === routine.id ? 'text-green-500' : 'text-muted-foreground/50'}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Apenas admins podem alterar o plano ativo.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    {!isPlan(routine) && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleStartWorkout(routine as Workout)}>
                                                <PlayCircle className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Iniciar Treino Avulso</p></TooltipContent>
                                    </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(routine)} disabled={!canEditOrDelete(routine) || !isPlan(routine)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Editar</p></TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/dashboard/athlete/workouts/${routine.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Ver Detalhes</p></TooltipContent>
                                    </Tooltip>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => promptDelete(routine)} disabled={!canEditOrDelete(routine)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Excluir</p></TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      )}

    </div>
    </TooltipProvider>
     <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o item
                    <span className="font-semibold"> &quot;{deletingWorkout?.name}&quot;</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
