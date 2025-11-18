'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlusCircle, Search } from 'lucide-react';
import { useMemo } from 'react';
import { collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Workout } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


export default function WorkoutsPage() {
    const firestore = useFirestore();

    const workoutsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'workout_routines_public');
    }, [firestore]);

    const { data: workouts, isLoading } = useCollection<Workout>(workoutsCollectionRef);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Biblioteca de Treinos</h1>
          <p className="text-muted-foreground">Encontre a rotina perfeita para você ou crie a sua própria.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar treinos..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Treino
            </Button>
        </div>
      </div>
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
        {workouts && workouts.map((workout) => (
          <Link href={`/dashboard/workouts/${workout.id}`} key={workout.id}>
            <Card className="overflow-hidden h-full flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={workout.image || "https://picsum.photos/seed/1/600/400"}
                    alt={workout.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    data-ai-hint={workout.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <Badge variant={workout.difficultyLevel === 'Iniciante' ? 'default' : workout.difficultyLevel === 'Intermediário' ? 'secondary' : 'destructive'} className="bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">{workout.difficultyLevel}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="mb-2 text-lg font-headline">{workout.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">{workout.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                  <Badge variant="outline">{workout.type}</Badge>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
