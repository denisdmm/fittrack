
'use server';

import { collection, writeBatch, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { exercises, workouts, progressRecords } from '@/lib/data';
import { db } from '@/firebase/config';
import { placeholderImages } from './placeholder-images';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';


// Helper to get a random subset of items
const getRandomSubarray = <T>(arr: T[], size: number): T[] => {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
};

// A separate, temporary Firebase App instance for admin actions during seed.
const getSeedAdminApp = () => {
    const apps = getApps();
    const adminApp = apps.find(app => app.name === 'seedAdmin');
    if (adminApp) {
      return adminApp;
    }
    return initializeApp(firebaseConfig, 'seedAdmin');
};

async function createAdminUser() {
    console.log("Checking for admin user...");
    const adminApp = getSeedAdminApp();
    const auth = getAuth(adminApp);
    const adminEmail = 'admin@fittrack.app';
    const adminPassword = 'admin';
    const adminUsername = 'admin';

    // Check if user document already exists in Firestore
    // This is a simplified check. A more robust solution might query by email or username.
    // For this seed script, we'll assume if any user exists, the admin might too.
    // A better approach is to have a dedicated admin user creation flow or check.
    // For demo purposes, we will try to create it and catch the error if it exists.
    
    try {
        // First check if a user with this username exists in Firestore
        const userQuerySnapshot = await getDocs(query(collection(db, "users"), where("username", "==", adminUsername)));
        if (!userQuerySnapshot.empty) {
            console.log("Admin user document already exists in Firestore. Skipping creation.");
            return;
        }

        console.log("Attempting to create admin user in Firebase Auth...");
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;
        console.log(`Admin user created in Auth with UID: ${user.uid}`);

        // Now create the Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        const userData = {
            id: user.uid,
            firstName: 'Admin',
            lastName: 'User',
            username: adminUsername,
            email: adminEmail,
            role: 'admin' as const,
        };
        await setDoc(userDocRef, userData);
        console.log("Admin user document created in Firestore.");

    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("Admin user already exists in Firebase Auth. Skipping creation.");
        } else {
            console.error("Error creating admin user:", error);
        }
    }
}


export async function seedDatabase() {
    console.log("Starting to seed database...");

    // Create admin user first
    await createAdminUser();

    const exercisesCollection = collection(db, 'exercises');
    const workoutsCollection = collection(db, 'workout_routines_public');
    
    // Check if collections are empty before seeding
    const exercisesSnapshot = await getDocs(exercisesCollection);
    const workoutsSnapshot = await getDocs(workoutsCollection);
    
    if (!exercisesSnapshot.empty && !workoutsSnapshot.empty) {
        console.log("Database already seeded with workouts/exercises. Skipping.");
        return { success: true, message: "Database already seeded." };
    }
    
    const batch = writeBatch(db);

    // 1. Seed Exercises
    const exerciseDocs: any[] = [];
    exercises.forEach((exerciseData) => {
        const exerciseRef = doc(exercisesCollection);
        batch.set(exerciseRef, exerciseData);
        exerciseDocs.push({ id: exerciseRef.id, ...exerciseData });
    });
    console.log(`${exerciseDocs.length} exercises prepared for batch.`);

    // 2. Seed Workouts
    workouts.forEach((workoutData) => {
        const workoutRef = doc(workoutsCollection);

        // Assign some exercises to each workout
        let associatedExercises: any[] = [];
        if (workoutData.type === 'Força') {
            associatedExercises = getRandomSubarray(exerciseDocs.filter(e => e.type === 'Força'), 4);
        } else if (workoutData.type === 'Cardio') {
            associatedExercises = getRandomSubarray(exerciseDocs.filter(e => e.type === 'Cardio'), 1);
        } else if (workoutData.type === 'HIIT') {
            associatedExercises = getRandomSubarray(exerciseDocs.filter(e => e.type === 'HIIT'), 3);
        } else if (workoutData.type === 'Flexibilidade') {
            associatedExercises = getRandomSubarray(exerciseDocs.filter(e => e.type === 'Flexibilidade'), 5);
        } else { // Calistenia
            associatedExercises = getRandomSubarray(exerciseDocs.filter(e => e.type === 'Força'), 4);
        }

        const newWorkout = {
            ...workoutData,
            exerciseIds: associatedExercises.map(e => ({...e})), // Storing a copy of exercise data
        };
        batch.set(workoutRef, newWorkout);
    });
    console.log(`${workouts.length} workouts prepared for batch.`);

    try {
        await batch.commit();
        console.log("Batch committed successfully. Database seeded.");
        return { success: true, message: "Database seeded successfully!" };
    } catch (error) {
        console.error("Error seeding database: ", error);
        return { success: false, message: `Error seeding database: ${error}` };
    }
}


export async function seedUserSpecificData(userId: string) {
    if (!userId) {
        console.log("No user ID provided. Skipping user-specific seed.");
        return;
    }
    console.log(`Starting to seed data for user: ${userId}`);

    const progressCollection = collection(db, `users/${userId}/workout_logs`);

    const progressSnapshot = await getDocs(progressCollection);
    if (!progressSnapshot.empty) {
        console.log(`Progress logs for user ${userId} already exist. Skipping.`);
        return { success: true, message: "Progress logs already exist." };
    }
    
    const workoutsPublicCollection = collection(db, 'workout_routines_public');
    const publicWorkoutsSnapshot = await getDocs(workoutsPublicCollection);
    const publicWorkouts = publicWorkoutsSnapshot.docs.map(d => ({id: d.id, ...d.data()}));


    const batch = writeBatch(db);

    progressRecords.forEach((record) => {
        const logRef = doc(progressCollection);
        // Find a related workout to link
        const relatedWorkout = publicWorkouts.find(w => w.name === record.workoutName);

        batch.set(logRef, {
            ...record,
            userId: userId,
            workoutRoutineId: relatedWorkout?.id || '',
        });
    });
    console.log(`${progressRecords.length} progress records prepared for batch for user ${userId}.`);
    
    try {
        await batch.commit();
        console.log(`User-specific data seeded successfully for ${userId}.`);
        return { success: true, message: "User data seeded successfully!" };
    } catch (error) {
        console.error(`Error seeding user-specific data for ${userId}: `, error);
        return { success: false, message: `Error seeding user data: ${error}` };
    }

}
