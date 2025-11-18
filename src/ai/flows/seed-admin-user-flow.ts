'use server';
/**
 * @fileOverview A flow to create the default admin user if it doesn't exist.
 * This flow is designed to be called once on application startup.
 *
 * - seedAdminUser - The main function to seed the admin user.
 */

import { ai } from '@/ai/genkit';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '@/firebase/config';
import { initializeFirebase } from '@/firebase';


// No input or output schema needed for this operation, as it's a one-off task.
export async function seedAdminUser(): Promise<{ status: string; message: string }> {
  return seedAdminUserFlow();
}

const seedAdminUserFlow = ai.defineFlow(
  {
    name: 'seedAdminUserFlow',
    // No input/output schema needed
  },
  async () => {
    console.log("seedAdminUserFlow: Checking for admin user...");

    const adminLogin = 'admin';
    const adminEmail = 'admin@fittrack.app';
    const adminPassword = 'admin';
    
    // Use the central initializeFirebase to get a consistent auth instance
    const { auth } = initializeFirebase();

    // Check if the user document already exists in Firestore by the 'login' field
    const userQuery = query(collection(db, "users"), where("login", "==", adminLogin));
    const userQuerySnapshot = await getDocs(userQuery);

    if (!userQuerySnapshot.empty) {
      console.log("seedAdminUserFlow: Admin user document already exists in Firestore. Skipping creation.");
      return { status: "skipped", message: "Admin user already exists." };
    }
    
    try {
      console.log("seedAdminUserFlow: Attempting to create admin user in Firebase Auth...");
      
      // We first sign in to see if the user exists in Auth, if not, create it.
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          console.log("seedAdminUserFlow: Admin user not found in Auth, creating...");
          userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        } else {
          // Rethrow other auth errors
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
        role: 'admin' as const,
      };
      
      await setDoc(userDocRef, userData);
      console.log("seedAdminUserFlow: Admin user document created/verified in Firestore.");
      
      return { status: "success", message: "Admin user created successfully." };

    } catch (error: any) {
      console.error("seedAdminUserFlow: Error creating or verifying admin user:", error);
      return { status: "error", message: `An unexpected error occurred: ${error.message}` };
    }
  }
);
