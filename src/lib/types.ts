export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  role: 'user' | 'admin';
};

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
};

export type Workout = {
  id: string;
  name: string;
  description: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  type: 'Força' | 'Cardio' | 'Flexibilidade' | 'HIIT' | 'Calistenia';
  exercises: Exercise[];
  image: string;
  imageHint: string;
};

export type ProgressRecord = {
  date: string;
  workoutName: string;
  duration: number; // in minutes
  volume: number; // total weight lifted
};
