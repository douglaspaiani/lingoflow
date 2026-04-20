import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppData } from '../types';

interface UserContextType {
  currentUser: User | null;
  data: AppData | null;
  refreshData: () => Promise<void>;
  updateProgress: (xpToAdd: number, lessonId?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshData = async () => {
    try {
      const res = await fetch('/api/data');
      const d = await res.json();
      setData(d);
      // For now, hardcoding user 1 as the current user
      const user = d.users.find((u: any) => u.id === '1');
      setCurrentUser(user || null);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const updateProgress = async (xpToAdd: number, lessonId?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, xpToAdd, lessonId })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUser(updatedUser);
        // Also refresh global data to sync rankings etc
        const dRes = await fetch('/api/data');
        setData(await dRes.json());
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar progresso');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, data, refreshData, updateProgress }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
