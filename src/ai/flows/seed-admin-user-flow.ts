
'use server';
/**
 * @fileOverview A flow to create the default admin user and seed public data.
 * This flow is designed to be called once on application startup.
 *
 * - seedAdminUserAndPublicData - The main function to seed the admin user and data.
 */

import { ai } from '@/ai/genkit';
import { collection, query, where, getDocs, setDoc, doc, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/firebase/config';
import { initializeFirebase } from '@/firebase';
import type { Exercise, WorkoutPlan, SessionExercise } from '@/lib/types';
import { placeholderImages } from '@/lib/placeholder-images';

// No input or output schema needed for this operation, as it's a one-off task.
export async function seedAdminUser(): Promise<{ status: string; message: string }> {
  return seedAdminUserAndPublicDataFlow();
}

const seedAdminUserAndPublicDataFlow = ai.defineFlow(
  {
    name: 'seedAdminUserAndPublicDataFlow',
  },
  async () => {
    const { auth } = initializeFirebase();

    // --- 1. Seed Admin User ---
    console.log("seedAdminUserFlow: Checking for admin user...");

    const adminLogin = 'admin';
    const adminEmail = 'admin@fittrack.app';
    const adminPassword = 'admin';
    
    const userQuery = query(collection(db, "users"), where("login", "==", adminLogin));
    const userQuerySnapshot = await getDocs(userQuery);

    if (!userQuerySnapshot.empty) {
      console.log("seedAdminUserFlow: Admin user document already exists in Firestore. Verifying Auth user...");
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log("seedAdminUserFlow: Admin user confirmed in Firebase Auth.");
      } catch (error: any) {
         if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          console.log("seedAdminUserFlow: Admin Firestore doc exists but Auth user does not. Creating Auth user...");
          await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          console.log("seedAdminUserFlow: Admin user created in Firebase Auth.");
         } else {
            console.error("seedAdminUserFlow: Error verifying admin user in Auth:", error.message);
         }
      }
    } else {
        try {
            console.log("seedAdminUserFlow: Admin user not found. Attempting to create admin user in Firebase Auth...");
            let userCredential;
            try {
                userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    console.log("seedAdminUserFlow: Admin user not found in Auth, creating new one...");
                    userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
                } else {
                    throw error;
                }
            }

            const user = userCredential.user;
            console.log(`seedAdminUserFlow: Admin user confirmed in Auth with UID: ${user.uid}`);
            const userDocRef = doc(db, 'users', user.uid);
            const userData = {
                id: user.uid,
                firstName: 'Admin',
                lastName: 'User',
                login: adminLogin,
                email: adminEmail,
                role: 'admin' as const,
                status: 'active' as const,
            };
            await setDoc(userDocRef, userData);
            console.log("seedAdminUserFlow: Admin user document created in Firestore.");
        } catch (error: any) {
            console.error("seedAdminUserFlow: Error creating admin user:", error);
            // Don't return here, proceed to data seeding
        }
    }

    // --- 2. Seed Public Data (Exercises and Workouts) ---
    console.log("seedAdminUserFlow: Checking for public data (exercises)...");
    const exercisesCollection = collection(db, 'exercises');
    const exercisesSnapshot = await getDocs(query(exercisesCollection)); // Check if anything exists

    if (exercisesSnapshot.size > 0) { // Check size instead of empty to be more robust
        console.log("seedAdminUserFlow: Public exercises data already exists. Skipping data seed.");
        return { status: "success", message: "Admin user verified and public data exists." };
    }
    
    console.log("seedAdminUserFlow: Public data not found. Seeding exercises and workout plans...");
    
    try {
        const batch = writeBatch(db);
        const exercisesToAdd = getExercisesSeed();
        const exercisesAdded: Exercise[] = [];

        exercisesToAdd.forEach(exerciseData => {
            const docRef = doc(exercisesCollection); // Auto-generate ID
            const exerciseWithId = { ...exerciseData, id: docRef.id };
            batch.set(docRef, exerciseWithId);
            exercisesAdded.push(exerciseWithId);
        });

        console.log(`seedAdminUserFlow: Staged ${exercisesAdded.length} exercises for batch write.`);

        const workoutsToAdd = getWorkoutsSeed(exercisesAdded);
        const workoutsCollection = collection(db, 'workout_routines_public');

        workoutsToAdd.forEach(workoutData => {
            const docRef = doc(workoutsCollection);
            batch.set(docRef, { ...workoutData, id: docRef.id });
        });

        console.log(`seedAdminUserFlow: Staged ${workoutsToAdd.length} workout plans for batch write.`);

        await batch.commit();
        console.log("seedAdminUserFlow: Successfully seeded public exercises and workout plans.");

        return { status: "success", message: "Admin user and public data seeded successfully." };
    } catch (error: any) {
        console.error("seedAdminUserFlow: Error seeding public data:", error);
        return { status: "error", message: `Error seeding public data: ${error.message}` };
    }
  }
);


// --- Seeding Data Definitions ---

function getExercisesSeed(): Omit<Exercise, 'id'>[] {
    return [
      { name: 'Supino Reto com Barra', description: 'Deite-se em um banco reto, abaixe a barra até o peito e empurre para cima.', type: 'Força', muscleGroup: 'Peito', equipment: 'Livres' },
      { name: 'Agachamento Livre com Barra', description: 'Com a barra nas costas, agache até que as coxas fiquem paralelas ao chão.', type: 'Força', muscleGroup: 'Pernas', equipment: 'Livres' },
      { name: 'Remada Curvada com Barra', description: 'Incline o tronco para a frente e puxe a barra em direção ao abdômen.', type: 'Força', muscleGroup: 'Costas', equipment: 'Livres' },
      { name: 'Desenvolvimento Militar com Barra', description: 'Em pé, levante a barra acima da cabeça até estender os cotovelos.', type: 'Força', muscleGroup: 'Ombros', equipment: 'Livres' },
      { name: 'Prancha', description: 'Mantenha a posição de prancha com o corpo reto.', type: 'Calistenia', muscleGroup: 'Core', equipment: 'Calistenia' },
      { name: 'Corrida na Esteira', description: 'Corra em um ritmo constante ou intervalado na esteira.', type: 'Cardio', muscleGroup: 'Cardio', equipment: 'Aparelhos' },
      { name: 'Bicicleta Ergométrica', description: 'Pedale em um ritmo constante ou intervalado.', type: 'Cardio', muscleGroup: 'Cardio', equipment: 'Aparelhos' },
      { name: 'Burpee', description: 'Combine uma flexão, um agachamento e um salto em um movimento fluido.', type: 'HIIT', muscleGroup: 'Corpo Inteiro', equipment: 'Calistenia' },
      { name: 'Polichinelo', description: 'Salte abrindo e fechando pernas e braços simultaneamente.', type: 'HIIT', muscleGroup: 'Corpo Inteiro', equipment: 'Calistenia' },
      { name: 'Alongamento de Isquiotibiais', description: 'Sente-se e estique as pernas, tentando tocar os pés.', type: 'Flexibilidade', muscleGroup: 'Flexibilidade', equipment: 'Calistenia' },
      { name: 'Alongamento de Quadríceps', description: 'Em pé, puxe um dos pés em direção ao glúteo.', type: 'Flexibilidade', muscleGroup: 'Flexibilidade', equipment: 'Calistenia' },
      { name: 'Postura do Gato-Vaca', description: 'Alterne entre arquear e arredondar a coluna em quatro apoios.', type: 'Flexibilidade', muscleGroup: 'Flexibilidade', equipment: 'Calistenia' },
      { name: 'Puxada Frontal na Barra', description: 'Sente-se na máquina e puxe a barra da polia alta até a parte superior do peito.', type: 'Força', muscleGroup: 'Costas', equipment: 'Aparelhos' },
      { name: 'Remada Máquina (Pegada Neutra)', description: 'Puxe as alças em direção ao abdômen, mantendo as costas retas e os cotovelos próximos ao corpo.', type: 'Força', muscleGroup: 'Costas', equipment: 'Aparelhos' },
      { name: 'Rosca Direta com Barra W', description: 'Segure a barra W com as palmas para cima e flexione os cotovelos.', type: 'Hipertrofia', muscleGroup: 'Braços', equipment: 'Livres' },
      { name: 'Mesa Flexora', description: 'Deite-se de bruços e flexione as pernas contra a resistência.', type: 'Hipertrofia', muscleGroup: 'Pernas', equipment: 'Aparelhos' },
      { name: 'Cadeira Extensora', description: 'Sente-se na máquina e estenda as pernas para trabalhar o quadríceps.', type: 'Hipertrofia', muscleGroup: 'Pernas', equipment: 'Aparelhos' },
      { name: 'Elevação Lateral com Halteres', description: 'Em pé, levante os halteres para os lados até a altura dos ombros.', type: 'Hipertrofia', muscleGroup: 'Ombros', equipment: 'Livres' },
      { name: 'Abdominal na Máquina', description: 'Sente-se na máquina e flexione o tronco contra a resistência.', type: 'Hipertrofia', muscleGroup: 'Core', equipment: 'Aparelhos' },
    ];
}

function getWorkoutsSeed(allExercises: Exercise[]): Omit<WorkoutPlan, 'id'>[] {
    const findExId = (name: string) => allExercises.find(ex => ex.name === name)?.id || '';

    const createSessionExercises = (exerciseNames: string[], series: string[][]): SessionExercise[] => {
        return exerciseNames.map((name, index) => ({
            exerciseId: findExId(name),
            seriesAndReps: series[index]
        }));
    };
    
    return [
        {
            name: 'Hipertrofia Essencial (ABC)',
            description: 'Um plano de treino ABC clássico, focado em hipertrofia para resultados sólidos.',
            difficultyLevel: 'Intermediário',
            frequency: 12,
            image: placeholderImages.find(p => p.id === 'workout-strength')?.imageUrl,
            imageHint: 'dumbbells gym',
            sessions: [
                { 
                    sessionTag: 'A',
                    description: 'Peito, Ombros e Tríceps',
                    exerciseIds: [findExId('Supino Reto com Barra'), findExId('Desenvolvimento Militar com Barra'), findExId('Elevação Lateral com Halteres')],
                    exercises: createSessionExercises(
                        ['Supino Reto com Barra', 'Desenvolvimento Militar com Barra', 'Elevação Lateral com Halteres'],
                        [
                            ["10-12 reps @ 60s", "10-12 reps @ 60s", "8-10 reps @ 60s", "8-10 reps @ 60s"],
                            ["10-12 reps @ 60s", "10-12 reps @ 60s", "8-10 reps @ 60s"],
                            ["15 reps @ 60s", "12 reps @ 60s", "12 reps @ 60s"]
                        ]
                    )
                },
                { 
                    sessionTag: 'B', 
                    description: 'Costas e Bíceps',
                    exerciseIds: [findExId('Remada Curvada com Barra'), findExId('Puxada Frontal na Barra'), findExId('Rosca Direta com Barra W')],
                    exercises: createSessionExercises(
                        ['Remada Curvada com Barra', 'Puxada Frontal na Barra', 'Rosca Direta com Barra W'],
                        [
                            ["10-12 reps @ 60s", "10-12 reps @ 60s", "8-10 reps @ 60s"],
                            ["12 reps @ 60s", "12 reps @ 60s", "10 reps @ 60s", "10 reps @ 60s"],
                            ["15 reps @ 60s", "12 reps @ 60s", "10 reps @ 60s"]
                        ]
                    )
                },
                { 
                    sessionTag: 'C', 
                    description: 'Pernas e Abdômen',
                    exerciseIds: [findExId('Agachamento Livre com Barra'), findExId('Mesa Flexora'), findExId('Cadeira Extensora'), findExId('Abdominal na Máquina')],
                    exercises: createSessionExercises(
                        ['Agachamento Livre com Barra', 'Mesa Flexora', 'Cadeira Extensora', 'Abdominal na Máquina'],
                        [
                            ["12-15 reps @ 60s", "10-12 reps @ 60s", "10-12 reps @ 60s"],
                            ["15 reps @ 60s", "12 reps @ 60s", "10 reps @ 60s"],
                            ["15 reps @ 60s", "15 reps @ 60s", "12 reps @ 60s", "12 reps @ 60s"],
                            ["20 reps @ 45s", "20 reps @ 45s", "15 reps @ 45s"]
                        ]
                    )
                },
            ]
        },
        {
            name: 'Queima de Gordura e Hipertrofia',
            description: 'Combine queima calórica com estímulo de hipertrofia. Treinos intensos para máxima eficiência.',
            difficultyLevel: 'Avançado',
            frequency: 16,
            image: placeholderImages.find(p => p.id === 'workout-hiit')?.imageUrl,
            imageHint: 'jumping exercise',
            sessions: [
                { 
                    sessionTag: 'A',
                    description: 'Full Body Força + HIIT',
                    exerciseIds: [findExId('Supino Reto com Barra'), findExId('Remada Curvada com Barra'), findExId('Desenvolvimento Militar com Barra'), findExId('Burpee')],
                    exercises: createSessionExercises(
                        ['Supino Reto com Barra', 'Remada Curvada com Barra', 'Desenvolvimento Militar com Barra', 'Burpee'],
                        [
                            ["8-10 reps @ 60s", "8-10 reps @ 60s", "6-8 reps @ 60s"],
                            ["8-10 reps @ 60s", "8-10 reps @ 60s", "6-8 reps @ 60s"],
                            ["10-12 reps @ 60s", "8-10 reps @ 60s", "8-10 reps @ 60s"],
                            ["15 reps", "15 reps", "15 reps", "15 reps"]
                        ]
                    )
                },
                { 
                    sessionTag: 'B', 
                    description: 'Full Body Força + Cardio',
                    exerciseIds: [findExId('Agachamento Livre com Barra'), findExId('Bicicleta Ergométrica'), findExId('Puxada Frontal na Barra'), findExId('Rosca Direta com Barra W')],
                    exercises: createSessionExercises(
                         ['Agachamento Livre com Barra', 'Bicicleta Ergométrica', 'Puxada Frontal na Barra', 'Rosca Direta com Barra W'],
                         [
                            ["10-12 reps @ 60s", "10-12 reps @ 60s", "8-10 reps @ 60s"],
                            ["20min"],
                            ["10-12 reps @ 60s", "8-10 reps @ 60s", "8-10 reps @ 60s"],
                            ["12 reps @ 60s", "10 reps @ 60s", "10 reps @ 60s"]
                         ]
                    )
                },
            ]
        },
    ];
}
