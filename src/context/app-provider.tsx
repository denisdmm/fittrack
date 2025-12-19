
'use client';
import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import { useUser as useAuthUser, useFirestore, useDoc } from '@/firebase';
import type { User, Workout } from '@/lib/types';
import { seedAdminUser } from '@/ai/flows/seed-admin-user-flow';

export type Role = 'user' | 'admin';

type AppContextType = {
  role: Role;
  setRole: (role: Role) => void;
  user: User | null;
  authUser: AuthUser | null;
  isUserLoading: boolean;
  activeWorkout: Workout | null;
  setActiveWorkout: (workout: Workout | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// State to prevent seed from running multiple times
let hasSeeded = false;

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isUserLoading: isAuthUserLoading } = useAuthUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: firestoreUser, isLoading: isFirestoreUserLoading } = useDoc<User>(userDocRef);

  const [role, setRole] = useState<Role>('user');
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

  // Seed database effect
  useEffect(() => {
    async function runSeed() {
      if (hasSeeded) return;
      hasSeeded = true; // Prevent re-running
      console.log("Checking if database needs to be seeded...");
      try {
        // This flow now handles both admin user and public data seeding.
        await seedAdminUser(); 
      } catch (e) {
        console.error("Seeding failed", e);
        hasSeeded = false; // Allow retrying if it failed
      }
    }
    runSeed();
  }, []);


  useEffect(() => {
    if (firestoreUser?.role) {
      setRole(firestoreUser.role);
    }
  }, [firestoreUser]);

  const isUserLoading = isAuthUserLoading || isFirestoreUserLoading;

  const value = useMemo(() => ({
    role,
    setRole,
    user: firestoreUser,
    authUser,
    isUserLoading,
    activeWorkout,
    setActiveWorkout,
  }), [role, firestoreUser, authUser, isUserLoading, activeWorkout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
