'use client';
import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { User as AuthUser } from 'firebase/auth';
import { useUser as useAuthUser, useFirestore, useDoc } from '@/firebase';
import type { User } from '@/lib/types';
import { seedDatabase, seedUserSpecificData } from '@/lib/seed';
import { seedAdminUser } from '@/ai/flows/seed-admin-user-flow';

export type Role = 'user' | 'admin';

type AppContextType = {
  role: Role;
  setRole: (role: Role) => void;
  user: User | null;
  authUser: AuthUser | null;
  isUserLoading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isUserLoading: isAuthUserLoading } = useAuthUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: firestoreUser, isLoading: isFirestoreUserLoading } = useDoc<User>(userDocRef);

  const [role, setRole] = useState<Role>('user');

  // Seed database effect
  useEffect(() => {
    async function runSeed() {
        console.log("Checking if admin user needs to be seeded...");
        await seedAdminUser(); // Use the server-side flow for admin
        console.log("Checking if database needs to be seeded with public data...");
        await seedDatabase();
    }
    runSeed();
  }, []);

  // Seed user-specific data when user logs in
  useEffect(() => {
    async function runUserSeed() {
        if (authUser?.uid) {
            console.log(`Checking if user ${authUser.uid} needs data seeded...`);
            await seedUserSpecificData(authUser.uid);
        }
    }
    if (authUser) {
        runUserSeed();
    }
  }, [authUser]);


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
  }), [role, firestoreUser, authUser, isUserLoading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
