import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, PlayCircle, Repeat, Dumbbell, Timer } from 'lucide-react';
import { mockWorkouts } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function WorkoutDetailPage({ params }: { params: { id: string } }) {
  const workout = mockWorkouts.find((w) => w.id === params.id);

  if (!workout) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/workouts">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar para a Biblioteca
          </Link>
        </Button>
      </div>

      <div className="relative h-64 w-full rounded-lg overflow-hidden mb-8">
        <Image
          src={workout.image}
          alt={workout.name}
          fill
          className="object-cover"
          data-ai-hint={workout.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <Badge variant="secondary" className="mb-2 bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">
            {workout.difficulty}
          </Badge>
          <h1 className="text-4xl font-bold text-white font-headline">{workout.name}</h1>
          <p className="text-lg text-white/90 mt-1">{workout.description}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader>
              <CardTitle>Exercícios</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {workout.exercises.map((exercise, index) => (
                  <li key={exercise.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{exercise.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-4 w-4" /> {exercise.sets} séries
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-4 w-4" /> {exercise.reps} reps
                        </span>
                         <span className="flex items-center gap-1">
                          <Timer className="h-4 w-4" /> {exercise.rest} rest
                        </span>
                      </div>
                    </div>
                    {index < workout.exercises.length - 1 && <Separator className="mt-4" />}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-1/3">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Pronto para começar?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Inicie uma sessão de treino para registrar seu progresso.
              </p>
              <Button size="lg" className="w-full">
                <PlayCircle className="mr-2 h-5 w-5" />
                Iniciar Treino
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
