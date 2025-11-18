import { doc } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Assuming db is exported from a config file
import { setDoc } from 'firebase/firestore';
import { placeholderImages } from './placeholder-images';
import type { Workout, Exercise, ProgressRecord } from './types';

// Let's create a more structured and comprehensive set of mock data.

// EXERCISES
export const exercises: Omit<Exercise, 'id'>[] = [
  { name: 'Supino Reto', description: 'Deite-se em um banco reto, abaixe a barra até o peito e empurre para cima.', type: 'Força', sets: 4, reps: 10 },
  { name: 'Agachamento Livre', description: 'Com a barra nas costas, agache até que as coxas fiquem paralelas ao chão.', type: 'Força', sets: 4, reps: 12 },
  { name: 'Levantamento Terra', description: 'Levante a barra do chão até ficar em pé, mantendo as costas retas.', type: 'Força', sets: 3, reps: 8 },
  { name: 'Barra Fixa', description: 'Puxe o corpo para cima até que o queixo passe da barra.', type: 'Força', sets: 4, reps: 8 },
  { name: 'Corrida', description: 'Corra em um ritmo constante.', type: 'Cardio', sets: 1, reps: 30 }, // Using reps for minutes here
  { name: 'Corda Naval', description: 'Movimente as cordas em padrões ondulatórios.', type: 'HIIT', sets: 5, reps: 30 }, // Using reps for seconds
  { name: 'Alongamento de Isquiotibiais', description: 'Sente-se e estique as pernas, tentando tocar os pés.', type: 'Flexibilidade', sets: 3, reps: 60 }, // reps for seconds
  { name: 'Prancha', description: 'Mantenha a posição de prancha com o corpo reto.', type: 'Força', sets: 3, reps: 60 }, // reps for seconds
];

// WORKOUTS
const fullBodyImage = placeholderImages.find(p => p.id === 'workout-strength');
const cardioImage = placeholderImages.find(p => p.id === 'workout-cardio');
const hiitImage = placeholderImages.find(p => p.id === 'workout-hiit');
const flexibilityImage = placeholderImages.find(p => p.id === 'workout-flexibility');
const bodyweightImage = placeholderImages.find(p => p.id === 'workout-bodyweight');

export const workouts: Omit<Workout, 'id' | 'exerciseIds'>[] = [
  {
    name: 'Força Total para Iniciantes',
    description: 'Uma rotina completa para construir uma base de força sólida em todo o corpo.',
    difficultyLevel: 'Iniciante',
    type: 'Força',
    image: fullBodyImage?.imageUrl,
    imageHint: fullBodyImage?.imageHint,
  },
  {
    name: 'Cardio Queima-Calorias',
    description: 'Aumente sua frequência cardíaca e queime calorias com esta sessão de cardio revigorante.',
    difficultyLevel: 'Intermediário',
    type: 'Cardio',
    image: cardioImage?.imageUrl,
    imageHint: cardioImage?.imageHint,
  },
  {
    name: 'HIIT Intenso de 20 Minutos',
    description: 'Um treino rápido e eficaz para maximizar a queima de gordura em pouco tempo.',
    difficultyLevel: 'Avançado',
    type: 'HIIT',
    image: hiitImage?.imageUrl,
    imageHint: hiitImage?.imageHint,
  },
  {
    name: 'Flexibilidade e Relaxamento',
    description: 'Melhore sua flexibilidade, reduza a tensão muscular e relaxe a mente.',
    difficultyLevel: 'Iniciante',
    type: 'Flexibilidade',
    image: flexibilityImage?.imageUrl,
    imageHint: flexibilityImage?.imageHint,
  },
   {
    name: 'Calistenia para Força e Controle',
    description: 'Use o peso do seu próprio corpo para construir força funcional e controle motor.',
    difficultyLevel: 'Intermediário',
    type: 'Calistenia',
    image: bodyweightImage?.imageUrl,
    imageHint: bodyweightImage?.imageHint,
  },
];


// PROGRESS RECORDS
export const progressRecords: Omit<ProgressRecord, 'id' | 'userId' | 'workoutRoutineId'>[] = [
    { date: "2024-06-01T10:00:00Z", workoutName: 'Força Total para Iniciantes', duration: 60, volume: 5000 },
    { date: "2024-06-03T10:00:00Z", workoutName: 'Cardio Queima-Calorias', duration: 30, volume: 0 },
    { date: "2024-06-05T10:00:00Z", workoutName: 'Força Total para Iniciantes', duration: 65, volume: 5500 },
    { date: "2024-06-07T10:00:00Z", workoutName: 'HIIT Intenso de 20 Minutos', duration: 20, volume: 0 },
    { date: "2024-06-10T10:00:00Z", workoutName: 'Força Total para Iniciantes', duration: 70, volume: 6000 },
    { date: "2024-06-12T10:00:00Z", workoutName: 'Flexibilidade e Relaxamento', duration: 25, volume: 0 },
    { date: "2024-06-14T10:00:00Z", workoutName: 'Cardio Queima-Calorias', duration: 35, volume: 0 },
    { date: "2024-06-17T10:00:00Z", workoutName: 'Força Total para Iniciantes', duration: 75, volume: 6500 },
    { date: "2024-06-19T10:00:00Z", workoutName: 'Calistenia para Força e Controle', duration: 45, volume: 0 },
    { date: "2024-06-21T10:00:00Z", workoutName: 'Força Total para Iniciantes', duration: 70, volume: 6800 },
];
