'use client';
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/data';

export type Role = 'user' | 'admin';

type AppContextType = {
  role: Role;
  setRole: (role: Role) => void;
  user: User | null;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('user');
  
  const user = useMemo(() => {
    if (role === 'admin') {
        return mockUsers.find(u => u.role === 'admin') || null;
    }
    return mockUsers.find(u => u.role === 'user') || null;
  }, [role]);

  const value = useMemo(() => ({ role, setRole, user }), [role, user]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
