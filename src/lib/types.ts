

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  groupId?: string;
  instagramUrl?: string;
  email?: string;
  activeWorkoutPlanId?: string;
  birthDate?: string; // YYYY-MM-DD
  height?: number; // in cm
};

export type HealthLog = {
    id: string;
    userId: string;
    date: string; // ISO String
    weight: number; // in kg
}

export type Exercise = {
  id: string;
  name: string;
  aliases?: string[];
  description: string;
  type: string;
  muscleGroup: string;
  equipment: 'Calistenia' | 'Aparelhos' | 'Livres' | 'Ambos';
  userId?: string; // ID of the user who created it, optional for seeded exercises
  // This field is being removed as it's not scalable for different plans.
  // Series and reps will be defined within the workout session.
  // seriesAndReps?: string[]; 
};

export type SessionExercise = {
  exerciseId: string;
  seriesAndReps: string[]; // e.g., ["12-15 reps @ 60s", "10-12 reps @ 60s"]
  // Keep exercise for runtime convenience, not stored in DB
  exercise?: Exercise; 
}

export type WorkoutSession = {
  sessionTag: 'A' | 'B' | 'C' | 'D' | 'E';
  description?: string;
  exerciseIds: string[]; 
  // 'exercises' is now an array of SessionExercise, but only storing exerciseId and seriesAndReps in Firestore.
  // The full Exercise object is populated at runtime.
  exercises: SessionExercise[];
}

export type Workout = {
  id: string;
  name:string;
  description: string;
  difficultyLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  exerciseIds: string[]; 
  exercises: Exercise[];
  userId?: string;
  image?: string;
  imageHint?: string;
  sessionTag?: 'A' | 'B' | 'C' | 'D' | 'E';
};


export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  difficultyLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  frequency: number; // How many times a week
  sessions: WorkoutSession[];
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
  sessionTag?: 'A' | 'B' | 'C' | 'D' | 'E';
};

export type LoggedSet = {
  reps: number;
  weight: number;
};
