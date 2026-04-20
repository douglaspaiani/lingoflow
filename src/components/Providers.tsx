"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { UserProvider } from '../contexts/UserContext';
import { HelmetProvider } from 'react-helmet-async';

const ThemeContext = createContext<{ theme: 'light' | 'dark', toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <UserProvider>
        <HelmetProvider>
          {children}
        </HelmetProvider>
      </UserProvider>
    </ThemeContext.Provider>
  );
}
