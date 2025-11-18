import type { User, Workout, ProgressRecord } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const placeholderImages = PlaceHolderImages;

export const mockUsers: User[] = [
  { id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@fittrack.com', login: 'admin', role: 'admin' },
  { id: '2', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', login: 'alice', role: 'user' },
  { id: '3', firstName: 'Bob', lastName: 'Williams', email: 'bob@example.com', login: 'bob', role: 'user' },
  { id: '4', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com', login: 'charlie', role: 'user' },
];

const strengthImg = placeholderImages.find(p => p.id === 'workout-strength');
const cardioImg = placeholderImages.find(p => p.id === 'workout-cardio');
const flexibilityImg = placeholderImages.find(p => p.id === 'workout-flexibility');
const hiitImg = placeholderImages.find(p => p.id === 'workout-hiit');
const bodyweightImg = placeholderImages.find(p => p.id === 'workout-bodyweight');

export const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Força Total para Iniciantes',
    description: 'Uma rotina de corpo inteiro para construir uma base de força sólida.',
    difficulty: 'Iniciante',
    type: 'Força',
    image: strengthImg?.imageUrl || '',
    imageHint: strengthImg?.imageHint || '',
    exercises: [
      { id: 'e1', name: 'Agachamento com peso corporal', sets: 3, reps: '12-15', rest: '60s' },
      { id: 'e2', name: 'Flexões (de joelhos, se necessário)', sets: 3, reps: 'Até a falha', rest: '60s' },
      { id: 'e3', name: 'Remada com halteres', sets: 3, reps: '10-12 por braço', rest: '60s' },
      { id: 'e4', name: 'Prancha', sets: 3, reps: '30-60 segundos', rest: '45s' },
    ],
  },
  {
    id: '2',
    name: 'Cardio Queima-Calorias',
    description: 'Aumente sua frequência cardíaca e queime calorias com esta rotina de cardio.',
    difficulty: 'Intermediário',
    type: 'Cardio',
    image: cardioImg?.imageUrl || '',
    imageHint: cardioImg?.imageHint || '',
    exercises: [
      { id: 'e5', name: 'Corrida na esteira', sets: 1, reps: '20 minutos', rest: 'N/A' },
      { id: 'e6', name: 'Pular corda', sets: 5, reps: '2 minutos', rest: '60s' },
      { id: 'e7', name: 'Bicicleta ergométrica', sets: 1, reps: '15 minutos', rest: 'N/A' },
    ],
  },
  {
    id: '3',
    name: 'Flexibilidade e Mobilidade',
    description: 'Melhore sua amplitude de movimento e reduza o risco de lesões.',
    difficulty: 'Iniciante',
    type: 'Flexibilidade',
    image: flexibilityImg?.imageUrl || '',
    imageHint: flexibilityImg?.imageHint || '',
    exercises: [
      { id: 'e8', name: 'Alongamento de isquiotibiais', sets: 2, reps: '30s por perna', rest: '15s' },
      { id: 'e9', name: 'Alongamento do quadríceps', sets: 2, reps: '30s por perna', rest: '15s' },
      { id: 'e10', name: 'Postura do cachorro olhando para baixo', sets: 3, reps: '45 segundos', rest: '30s' },
      { id: 'e11', name: 'Alongamento de peito na porta', sets: 2, reps: '30 segundos', rest: '15s' },
    ],
  },
  {
    id: '4',
    name: 'HIIT Intenso',
    description: 'Um treino intervalado de alta intensidade para máximo gasto calórico em pouco tempo.',
    difficulty: 'Avançado',
    type: 'HIIT',
    image: hiitImg?.imageUrl || '',
    imageHint: hiitImg?.imageHint || '',
    exercises: [
      { id: 'e12', name: 'Burpees', sets: 4, reps: '45s de trabalho', rest: '15s' },
      { id: 'e13', name: 'Agachamento com salto', sets: 4, reps: '45s de trabalho', rest: '15s' },
      { id: 'e14', name: 'Alpinista', sets: 4, reps: '45s de trabalho', rest: '15s' },
      { id: 'e15', name: 'Prancha com remada', sets: 4, reps: '45s de trabalho', rest: '15s' },
    ],
  },
    {
    id: '5',
    name: 'Mestre do Peso Corporal',
    description: 'Use apenas o seu corpo para construir força funcional e resistência.',
    difficulty: 'Intermediário',
    type: 'Calistenia',
    image: bodyweightImg?.imageUrl || '',
    imageHint: bodyweightImg?.imageHint || '',
    exercises: [
      { id: 'e16', name: 'Barras fixas', sets: 4, reps: 'Até a falha', rest: '90s' },
      { id: 'e17', name: 'Mergulhos em paralelas', sets: 4, reps: '10-15', rest: '90s' },
      { id: 'e18', name: 'Agachamento pistola (assistido, se necessário)', sets: 3, reps: '5-8 por perna', rest: '90s' },
      { id: 'e19', name: 'Elevação de pernas suspenso', sets: 3, reps: '12-15', rest: '60s' },
    ],
  },
];

export const mockProgress: ProgressRecord[] = [
  { date: '2024-06-01', workoutName: 'Força Total para Iniciantes', duration: 45, volume: 1200 },
  { date: '2024-06-03', workoutName: 'Cardio Queima-Calorias', duration: 30, volume: 0 },
  { date: '2024-06-05', workoutName: 'Força Total para Iniciantes', duration: 48, volume: 1250 },
  { date: '2024-06-08', workoutName: 'Cardio Queima-Calorias', duration: 32, volume: 0 },
  { date: '2024-06-10', workoutName: 'Força Total para Iniciantes', duration: 46, volume: 1300 },
  { date: '2024-06-12', workoutName: 'HIIT Intenso', duration: 20, volume: 0 },
  { date: '2024-06-15', workoutName: 'Força Total para Iniciantes', duration: 50, volume: 1400 },
  { date: '2024-06-17', workoutName: 'Flexibilidade e Mobilidade', duration: 15, volume: 0 },
  { date: '2024-06-20', workoutName: 'Força Total para Iniciantes', duration: 52, volume: 1450 },
  { date: '2024-06-23', workoutName: 'HIIT Intenso', duration: 22, volume: 0 },
  { date: '2024-06-26', workoutName: 'Mestre do Peso Corporal', duration: 55, volume: 0 },
  { date: '2024-06-29', workoutName: 'Força Total para Iniciantes', duration: 53, volume: 1500 },
];
