export type User = {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: 'user' | 'admin';
  groupId?: string;
  instagramUrl?: string;
  email?: string;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  type: string;
  sets: number;
  reps: number;
};

export type Workout = {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  type: 'Força' | 'Cardio' | 'Flexibilidade' | 'HIIT' | 'Calistenia';
  exerciseIds: string[] | any[]; // Can be array of strings or array of Exercise objects
  userId?: string;
  image?: string;
  imageHint?: string;
};

export type ProgressRecord = {
  id?: string;
  date: string;
  workoutName: string;
  duration: number; // in minutes
  volume: number; // total weight lifted
  userId: string;
  workoutRoutineId: string;
  loggedSets?: Record<string, LoggedSet[]>;
};

export type LoggedSet = {
  reps: number;
  weight: number;
};
