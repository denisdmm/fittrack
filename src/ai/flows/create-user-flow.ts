'use server';
/**
 * @fileOverview A flow to create a new user by an administrator.
 * 
 * - createUser - The main function to trigger user creation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/firebase/config';
import { initializeFirebase } from '@/firebase';
import { CreateUserInputSchema, type CreateUserInput } from '@/lib/schemas/user-schema';


export async function createUser(input: CreateUserInput): Promise<{ success: boolean; message: string; userId?: string }> {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      userId: z.string().optional(),
    }),
  },
  async (values) => {
    const { auth } = initializeFirebase();
    const email = `${values.login.toLowerCase()}@fittrack.app`;

    try {
        // Check if login (username) already exists in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("login", "==", values.login));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return { success: false, message: "Este nome de usuário já está em uso." };
        }

        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
        const user = userCredential.user;

        // 2. Create user document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userData = {
            id: user.uid,
            firstName: values.firstName,
            lastName: values.lastName,
            login: values.login,
            email: email,
            role: values.role,
            status: values.status,
            instagramUrl: values.instagramUrl || "",
            activeWorkoutPlanId: values.activeWorkoutPlanId || "",
        };
        
        await setDoc(userDocRef, userData);

        return { success: true, message: "Usuário criado com sucesso.", userId: user.uid };

    } catch (error: any) {
        console.error("createUserFlow: Error creating user:", error);
        let message = "Ocorreu um erro ao criar o usuário.";
        if (error.code === 'auth/email-already-in-use') {
            message = "Este nome de usuário já está em uso (e-mail já registrado na autenticação).";
        } else if (error.code === 'auth/weak-password') {
            message = "A senha fornecida é muito fraca.";
        }
        return { success: false, message };
    }
  }
);
