"use client";
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'motion/react';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLesson = pathname?.startsWith('/licao');
  const isJogo = pathname?.startsWith('/jogo');
  const isAdmin = pathname?.startsWith('/admin');
  const isEscolas = pathname === '/';
  const isAuth =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/teacher');

  if (isAdmin || isLesson || isJogo || isEscolas || isAuth) {
    return (
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    );
  }

  return (
    <main className="pt-20 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>
    </main>
  );
}
