import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Trophy, User as UserIcon, Settings, ShieldCheck, Flame, Star, BookOpen, Sun, Moon, Users, Battery } from 'lucide-react';
import { cn } from './lib/utils';
import Inicio from './pages/Inicio';
import Licao from './pages/Licao';
import Ranking from './pages/Ranking';
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import Admin from './pages/Admin';
import Amigos from './pages/Amigos';
import Escolas from './pages/Escolas';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { HelmetProvider } from 'react-helmet-async';

const ThemeContext = createContext<{ theme: 'light' | 'dark', toggleTheme: () => void }>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

function BottomNav() {
  const location = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { icon: Home, label: 'Início', path: '/app' },
    { icon: Trophy, label: 'Ranking', path: '/ranking' },
    { icon: Users, label: 'Amigos', path: '/amigos' },
    { icon: UserIcon, label: 'Perfil', path: '/perfil' },
  ];

  if (location.pathname.startsWith('/licao') || location.pathname.startsWith('/admin') || location.pathname === '/') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t z-40 h-20 px-4 transition-colors duration-300 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800">
      <div className="max-w-xl mx-auto h-full flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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

function TopBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useUser();
  
  if (location.pathname.startsWith('/licao') || location.pathname.startsWith('/admin') || location.pathname === '/') return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-20 backdrop-blur-md border-b z-40 transition-colors duration-300 bg-white/80 dark:bg-slate-950/80 border-slate-100 dark:border-slate-800">
      <div className="h-full max-w-5xl mx-auto flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-3 group cursor-default">
          <motion.img 
            src="/src/images/logo.png"
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
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1.5 text-yellow-500 font-black cursor-default">
              <div className="relative">
                 <div className="absolute inset-0 bg-yellow-400 blur-md opacity-20 animate-pulse" />
                 <Battery className="fill-yellow-500 h-5 w-5 text-yellow-500 relative z-10" />
              </div>
              <span className="text-lg">{currentUser?.energy || 0}</span>
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

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });

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
          <Router>
            <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
              <TopBar />
              <AppContent />
              <BottomNav />
            </div>
          </Router>
        </HelmetProvider>
      </UserProvider>
    </ThemeContext.Provider>
  );
}

function AppContent() {
  const location = useLocation();
  const isLesson = location.pathname.startsWith('/licao');
  const isAdmin = location.pathname.startsWith('/admin');
  const isEscolas = location.pathname === '/';

  if (isAdmin || isLesson || isEscolas) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<Escolas />} />
          <Route path="/app" element={<Inicio />} />
          <Route path="/licao/:id" element={<Licao />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/:userId" element={<Perfil />} />
          <Route path="/editar-perfil" element={<EditarPerfil />} />
          <Route path="/amigos" element={<Amigos />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <main className="pt-20 pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<Escolas />} />
            <Route path="/app" element={<Inicio />} />
            <Route path="/licao/:id" element={<Licao />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/:userId" element={<Perfil />} />
            <Route path="/editar-perfil" element={<EditarPerfil />} />
            <Route path="/amigos" element={<Amigos />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AnimatePresence>
      </div>
    </main>
  );
}
