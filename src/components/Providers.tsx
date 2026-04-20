"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { UserProvider } from '../contexts/UserContext';
import { HelmetProvider } from 'react-helmet-async';

const ThemeContext = createContext<{ theme: 'light' | 'dark', toggleTheme: () => void, setTheme: (t: 'light' | 'dark') => void }>({ theme: 'dark', toggleTheme: () => {}, setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
    else {
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      fetch('/api/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: nextTheme })
      }).catch(err => console.error(err));
      return nextTheme;
    });
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
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <UserProvider>
        <HelmetProvider>
          {children}
        </HelmetProvider>
      </UserProvider>
    </ThemeContext.Provider>
  );
}
