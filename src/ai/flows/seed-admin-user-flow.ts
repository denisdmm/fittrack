'use server';
/**
 * @fileOverview A flow to create the default admin user if it doesn't exist.
 * This flow is designed to be called once on application startup.
 *
 * - seedAdminUser - The main function to seed the admin user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

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

    const adminUsername = 'admin';
    const adminEmail = 'admin@fittrack.app';
    const adminPassword = 'admin';
    
    // Check if the user document already exists in Firestore
    const userQuery = query(collection(db, "users"), where("username", "==", adminUsername));
    const userQuerySnapshot = await getDocs(userQuery);

    if (!userQuerySnapshot.empty) {
      console.log("seedAdminUserFlow: Admin user document already exists in Firestore. Skipping creation.");
      return { status: "skipped", message: "Admin user already exists." };
    }

    // Use a temporary, secondary Firebase app instance for this admin operation
    // This avoids conflicts with the client-side Firebase instance.
    const adminAppName = 'seedAdminApp';
    let adminApp;
    try {
      adminApp = getApp(adminAppName);
    } catch (e) {
      adminApp = initializeApp(firebaseConfig, adminAppName);
    }
    
    const adminAuth = getAuth(adminApp);
    
    try {
      console.log("seedAdminUserFlow: Attempting to create admin user in Firebase Auth...");
      const userCredential = await createUserWithEmailAndPassword(adminAuth, adminEmail, adminPassword);
      const user = userCredential.user;
      console.log(`seedAdminUserFlow: Admin user created in Auth with UID: ${user.uid}`);

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
      console.log("seedAdminUserFlow: Admin user document created in Firestore.");
      
      return { status: "success", message: "Admin user created successfully." };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log("seedAdminUserFlow: Admin user already exists in Firebase Auth. Skipping Auth creation.");
        // If auth user exists but firestore doc doesn't, we should probably create it
        // This is a recovery step in case of partial failure. For now, we just log.
        return { status: "skipped", message: "Admin user already in Auth." };
      } else {
        console.error("seedAdminUserFlow: Error creating admin user:", error);
        return { status: "error", message: error.message };
      }
    } finally {
        // Clean up the temporary app instance
        try {
            await deleteApp(adminApp);
        } catch (e) {
            console.error("Failed to delete temporary admin app", e);
        }
    }
  }
);
