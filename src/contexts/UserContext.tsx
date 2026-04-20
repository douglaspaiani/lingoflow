"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppData } from '../types';

interface UserContextType {
  currentUser: User | null;
  data: AppData | null;
  refreshData: () => Promise<void>;
  updateProgress: (xpToAdd: number, lessonId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshData = async () => {
    try {
      // Fetch Global Data
      const res = await fetch('/api/data');
      const d = await res.json();
      setData(d);

      // Fetch Logged-in User
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const { user } = await meRes.json();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    window.location.href = '/login';
  };

  const updateProgress = async (xpToAdd: number, lessonId?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xpToAdd, lessonId })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUser(updatedUser);
        
        // Refresh global data silently
        fetch('/api/data').then(r => r.json()).then(setData);
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
    <UserContext.Provider value={{ currentUser, data, refreshData, updateProgress, logout }}>
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
