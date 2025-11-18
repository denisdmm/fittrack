'use server';
/**
 * @fileOverview A flow to create the default admin user if it doesn't exist.
 * This flow is designed to be called once on application startup.
 *
 * - seedAdminUser - The main function to seed the admin user.
 */

import { ai } from '@/ai/genkit';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
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
      
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      console.log(`seedAdminUserFlow: Admin user created in Auth with UID: ${user.uid}`);

      const userDocRef = doc(db, 'users', user.uid);
      
      const userData = {
        id: user.uid,
        firstName: 'Admin',
        lastName: 'User',
        login: adminLogin,
        email: adminEmail,
        role: 'admin' as const,
      };
      
      await setDoc(userDocRef, userData);
      console.log("seedAdminUserFlow: Admin user document created in Firestore.");
      
      return { status: "success", message: "Admin user created successfully." };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.warn("seedAdminUserFlow: Admin user already exists in Firebase Auth. Skipping Auth creation. Verifying Firestore doc.");
        
        // If auth user exists, but we didn't find the doc earlier, it means the doc is missing.
        // We need to find the user by email to get the UID and create the doc.
        // NOTE: This requires admin privileges in a real app. For this dev setup, it's a workaround.
        // A better approach in prod is a callable function to sync this.
        return { status: "skipped", message: "Admin user already in Auth, but doc might be missing. Manual check needed if login fails." };
      } else {
        console.error("seedAdminUserFlow: Error creating admin user:", error);
        return { status: "error", message: `An unexpected error occurred: ${error.message}` };
      }
    }
  }
);
