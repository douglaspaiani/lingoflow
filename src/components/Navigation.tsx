"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Trophy, User as UserIcon, Flame, Star, Sun, Moon, Users, Zap, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useTheme } from './Providers';
import { useUser } from '../contexts/UserContext';

function formatarTempoXpDobro(segundosTotais: number) {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

export function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useUser();
  const roleUsuarioAtual = (currentUser?.role || '').toUpperCase();

  const navItems = [
    { icon: Home, label: 'Início', path: '/app' },
    { icon: Trophy, label: 'Ranking', path: '/ranking' },
    { icon: Users, label: 'Amigos', path: '/amigos' },
    { icon: UserIcon, label: 'Perfil', path: '/perfil' },
  ];
  const itensSemAreaSocial =
    roleUsuarioAtual === 'PROFESSOR'
      ? navItems.filter((item) => item.path !== '/amigos' && item.path !== '/perfil')
      : navItems;

  const noNav =
    !pathname ||
    pathname.startsWith('/licao') ||
    pathname.startsWith('/jogo') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/teacher') ||
    pathname === '/';
  if (noNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t z-40 h-20 px-4 transition-colors duration-300 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
      <div className="max-w-xl mx-auto h-full flex justify-around items-center">
        {itensSemAreaSocial.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 transition-all group min-w-[72px]",
                isActive ? "text-blue-500" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavTab"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <item.icon className={cn("h-7 w-7 transition-transform group-active:scale-80", isActive && "fill-blue-500/10")} />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const { toggleTheme } = useTheme();
  const { currentUser } = useUser();
  const roleUsuarioAtual = (currentUser?.role || '').toUpperCase();
  const usuarioComEnergiaIlimitada = roleUsuarioAtual === 'ADMIN' || roleUsuarioAtual === 'PROFESSOR';
  const segundosXpDobroDoServidor = currentUser?.resumoRecompensasBauTrilha?.xpDobroSegundosRestantes || 0;
  const [segundosXpDobroRestantes, setSegundosXpDobroRestantes] = useState(segundosXpDobroDoServidor);

  useEffect(() => {
    setSegundosXpDobroRestantes(segundosXpDobroDoServidor);
  }, [segundosXpDobroDoServidor]);

  useEffect(() => {
    if (segundosXpDobroRestantes <= 0) return;

    const temporizadorXpDobro = window.setInterval(() => {
      setSegundosXpDobroRestantes((segundosAtuais) => (segundosAtuais > 0 ? segundosAtuais - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(temporizadorXpDobro);
    };
  }, [segundosXpDobroRestantes > 0]);
  
  const noNav =
    !pathname ||
    pathname.startsWith('/licao') ||
    pathname.startsWith('/jogo') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/teacher') ||
    pathname === '/';
  if (noNav) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-20 backdrop-blur-md border-b z-40 transition-colors duration-300 bg-white/80 dark:bg-slate-950/80 border-slate-100 dark:border-slate-800">
      <div className="h-full max-w-5xl mx-auto flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-3 group cursor-default">
          <motion.img 
            src="/images/logo.png"
            alt="LingoFlow"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            className="h-10 w-10 object-contain drop-shadow-sm"
          />
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight hidden sm:block" style={{ fontFamily: "'Fredoka', sans-serif" }}>lingoflow</span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6 mr-1">
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 text-orange-500 font-black cursor-default">
              <Flame className="fill-orange-500 h-5 w-5 animate-pulse text-orange-500" />
              <span className="text-lg">{currentUser?.streak || 0}</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 text-blue-400 font-black cursor-default">
              <Star className="fill-blue-400 h-5 w-5 text-blue-400" />
              <span className="text-lg text-nowrap">{currentUser?.points || 0}</span>
            </motion.div>
            {segundosXpDobroRestantes > 0 && (
              <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 text-emerald-500 font-black cursor-default">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <span className="text-sm sm:text-base text-nowrap">
                  2x {formatarTempoXpDobro(segundosXpDobroRestantes)}
                </span>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 text-yellow-500 font-black cursor-default">
              <div className="relative">
                 <div className="absolute inset-0 bg-yellow-400 blur-md opacity-20 animate-pulse" />
                 <Zap className="fill-yellow-500 h-5 w-5 text-yellow-500 relative z-10" />
              </div>
              <span className="text-lg">{usuarioComEnergiaIlimitada ? '∞' : (currentUser?.energy || 0)}</span>
            </motion.div>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all active:scale-95 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400"
          >
            <div className="dark:hidden"><Moon className="h-5 w-5" /></div>
            <div className="hidden dark:block"><Sun className="h-5 w-5" /></div>
          </button>
        </div>
      </div>
    </div>
  );
}
