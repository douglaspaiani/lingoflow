"use client";
import Link from 'next/link';
import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, LineChart, Layout, Save, Sparkles, User as UserIcon, 
  Star, Settings, LogOut, ChevronRight, BookOpen, Layers, Edit3, 
  CheckCircle2, XCircle, ShieldCheck, Mail, Lock, Flame, Search,
  ArrowLeft, AlertTriangle, X, Users, Presentation, Check, Hash, Battery, Moon, Sun, Edit2
} from 'lucide-react';
import { useTheme } from '@/components/Providers';
import { Level, AppData, Exercise, User, Lesson, AdminUser, Room } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

type AdminTab = 'dashboard' | 'content' | 'users' | 'rooms' | 'admins' | 'energy';
type AdminSubview = 'list' | 'add' | 'edit';

const TAB_LABELS: Record<AdminTab, string> = {
  dashboard: 'Dashboard',
  content: 'Conteúdo',
  users: 'Alunos',
  rooms: 'Turmas',
  admins: 'Administradores',
  energy: 'Energia'
};

export default function Admin() {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin section subviews
  const [adminSubview, setAdminSubview] = useState<AdminSubview>('list');
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [adminFormError, setAdminFormError] = useState('');

  // Content state
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Turmas state
  const [isManagingStudents, setIsManagingStudents] = useState<string | null>(null); // roomId
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentsForRoom, setSelectedStudentsForRoom] = useState<string[]>([]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState<Room | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [hoveredRoomCode, setHoveredRoomCode] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const savedAdmin = localStorage.getItem('admin_session');
    if (savedAdmin && savedAdmin !== 'undefined') {
      try {
        setAdminUser(JSON.parse(savedAdmin));
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Invalid admin session data");
        localStorage.removeItem('admin_session');
      }
    }
    setIsCheckingSession(false);
  }, []);

  const fetchData = () => {
    fetch('/api/data').then(res => res.json()).then(setData);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        const result = await res.json();
        setAdminUser(result.user);
        setIsLoggedIn(true);
        localStorage.setItem('admin_session', JSON.stringify(result.user));
      } else {
        setLoginError('Acesso negado. Verifique email e senha.');
      }
    } catch (err) {
      setLoginError('Erro de conexão ao servidor.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setIsLoggedIn(false);
    setAdminUser(null);
  };

  const syncContent = async (updatedLevels: Level[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels: updatedLevels })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const syncUsers = async (updatedUsers: User[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: updatedUsers })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const syncRooms = async (updatedRooms: Room[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: updatedRooms })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const syncSettings = async (updatedSettings: any) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnergyCombo = async (roomId: string, amount: number) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/energy-combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, amount })
      });
      if (res.ok) {
        fetchData();
        alert(`Bônus de +${amount} de energia aplicado com sucesso para a turma!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingSession) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="h-20 w-20 bg-blue-500 rounded-3xl flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/20">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Portal Titã</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Administração do Sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                  placeholder="admin@app.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-xs font-black uppercase text-center">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-5 rounded-3xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest"
            >
              Entrar no Sistema
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const levels = data?.levels || [];
  const users = data?.users || [];
  const admins = data?.admins || [];
  const rooms = data?.rooms || [];

  const chartData = users.map(u => ({ name: u.name, points: u.points })).slice(0, 10);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans"
    >
      {/* Sidebar Desktop */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col p-8 fixed h-full z-40">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-12 w-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-black text-slate-800 dark:text-slate-100 text-xl tracking-tight leading-none">Admin</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{adminUser?.name}</span>
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <SidebarLink icon={LineChart} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarLink icon={Layout} label="Conteúdo" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
          <SidebarLink icon={UserIcon} label="Alunos" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SidebarLink icon={Presentation} label="Turmas" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
          <SidebarLink icon={Battery} label="Energia" active={activeTab === 'energy'} onClick={() => setActiveTab('energy')} />
          <SidebarLink icon={ShieldCheck} label="Administradores" active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} />
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-black uppercase text-xs tracking-widest mt-auto border-2 border-transparent hover:border-red-100 dark:hover:border-red-900/20"
        >
          <LogOut className="h-5 w-5" />
          Sair do Painel
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-80 p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">{TAB_LABELS[activeTab]}</h1>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase animate-pulse">
                <Save className="h-4 w-4" />
                Salvando...
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <StatCard icon={UserIcon} label="Total Alunos" value={users.length} color="blue" />
                  <StatCard icon={Star} label="XP Média" value={Math.round(users.reduce((acc, u) => acc + u.points, 0) / (users.length || 1))} color="orange" />
                  <StatCard icon={Layers} label="Módulos" value={levels.length} color="green" />
                </div>

                <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 overflow-hidden shadow-xl">
                   <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-8 tracking-tight">Top 10 Engajamento</h3>
                   <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b20" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900 }} />
                          <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                          <Bar dataKey="points" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex gap-6 items-start">
                  {/* Level Sidebar */}
                  <div className="w-80 space-y-4 shrink-0">
                    <button 
                      onClick={() => {
                        const newLevel: Level = {
                          id: Date.now().toString(),
                          title: 'Novo Módulo',
                          description: 'Descrição do novo módulo',
                          difficulty: 1,
                          lessons: []
                        };
                        syncContent([...levels, newLevel]);
                      }}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      <Plus className="h-6 w-6" />
                      Novo Módulo
                    </button>
                    <div className="space-y-2">
                       {levels.map(level => (
                         <button 
                          key={level.id}
                          onClick={() => {
                            setSelectedLevelId(level.id);
                            setSelectedLessonId(null);
                          }}
                          className={cn(
                            "w-full p-5 rounded-2xl border-2 text-left transition-all group relative overflow-hidden",
                            selectedLevelId === level.id 
                              ? "bg-white dark:bg-slate-800 border-blue-500 shadow-md" 
                              : "bg-slate-50 dark:bg-slate-900 border-transparent hover:bg-white dark:hover:bg-slate-800"
                          )}
                         >
                           <h4 className={cn("font-black text-sm", selectedLevelId === level.id ? "text-blue-500" : "text-slate-700 dark:text-slate-300")}>{level.title}</h4>
                           <span className="text-[10px] font-bold text-slate-400">{level.lessons.length} lições</span>
                           {selectedLevelId === level.id && <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Level Details & Lesson Management */}
                  {selectedLevelId ? (
                    <div className="flex-1 space-y-6">
                      {levels.filter(l => l.id === selectedLevelId).map(level => (
                        <div key={level.id} className="space-y-8 animate-in fade-in slide-in-from-right-4">
                          {/* Edit Level Info */}
                          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                               <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Título do Módulo</label>
                                  <input 
                                    value={level.title}
                                    onChange={(e) => {
                                      const updated = levels.map(l => l.id === level.id ? { ...l, title: e.target.value } : l);
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 font-bold outline-none focus:border-blue-500"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dificuldade</label>
                                  <select 
                                    value={level.difficulty}
                                    onChange={(e) => {
                                      const updated = levels.map(l => l.id === level.id ? { ...l, difficulty: parseInt(e.target.value) } : l);
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 font-bold outline-none focus:border-blue-500"
                                  >
                                    {[1,2,3,4,5].map(v => <option key={v} value={v}>Nível {v}</option>)}
                                  </select>
                               </div>
                            </div>
                            <button 
                              onClick={() => {
                                syncContent(levels.filter(l => l.id !== level.id));
                                setSelectedLevelId(null);
                              }}
                              className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-xl transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir Módulo
                            </button>
                          </div>

                          {/* Lessons Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {level.lessons.map(lesson => (
                               <button 
                                key={lesson.id}
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className={cn(
                                  "p-6 rounded-3xl border-2 text-left flex items-center justify-between transition-all group",
                                  selectedLessonId === lesson.id 
                                    ? "bg-blue-500 border-blue-600 text-white shadow-lg" 
                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200"
                                )}
                               >
                                 <div>
                                    <h5 className="font-black mb-1">{lesson.title}</h5>
                                    <span className={cn("text-[10px] font-bold uppercase", selectedLessonId === lesson.id ? "text-white/60" : "text-slate-400")}>
                                      {lesson.exercises.length} Exercícios
                                    </span>
                                 </div>
                                 <div className={cn("p-2 rounded-xl", selectedLessonId === lesson.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800")}>
                                    <BookOpen className="h-5 w-5" />
                                 </div>
                               </button>
                             ))}
                             <button 
                              onClick={() => {
                                const newLesson: Lesson = {
                                  id: `l-${Date.now()}`,
                                  title: 'Nova Lição',
                                  exercises: []
                                };
                                const updated = levels.map(l => l.id === level.id ? { ...l, lessons: [...l.lessons, newLesson] } : l);
                                syncContent(updated);
                              }}
                              className="p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-400 font-black hover:border-blue-400 hover:text-blue-500 transition-all group"
                             >
                                <Plus className="h-6 w-6" />
                                Adicionar Lição
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 h-96 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
                       <Layout className="h-16 w-16 mb-4 opacity-20" />
                       <span className="font-black uppercase tracking-widest text-xs">Selecione um módulo para começar</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                 {/* Search Bar */}
                 <div className="relative max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input 
                      type="text"
                      placeholder="Buscar alunos por nome"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-4 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-sm transition-all"
                    />
                 </div>

                 <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">XP Total</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nível</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ofensiva</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                          </tr>
                       </thead>
                       <tbody>
                          {users
                            .filter(u => 
                              u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              u.username.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(u => (
                            <tr key={u.id} className="border-b last:border-0 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                                     </div>
                                     <div>
                                        <p className="font-black text-slate-800 dark:text-slate-100">{u.name}</p>
                                        <p className="text-xs font-bold text-blue-500">@{u.username}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="font-black text-slate-800 dark:text-slate-100">{u.points}</span>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <span className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-black">NV {u.level}</span>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                     <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                                     <span className="font-black text-slate-800 dark:text-slate-100">{u.streak}</span>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <button 
                                    onClick={() => setDeleteStudentId(u.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}

            {activeTab === 'rooms' && (
              <motion.div key="rooms" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gerenciamento de Turmas</h3>
                      <p className="text-slate-400 font-bold">Crie turmas e organize seus alunos por grupos.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setNewRoomName('');
                        setIsCreatingRoom(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-400 text-white font-black px-8 py-4 rounded-3xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="h-6 w-6" />
                      Criar Nova Turma
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rooms.map(room => (
                      <div key={room.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 flex flex-col group hover:border-blue-200 dark:hover:border-blue-900/40 transition-all shadow-sm">
                        <div className="flex items-start justify-between mb-8">
                           <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                              <Presentation className="h-8 w-8" />
                           </div>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 setNewRoomName(room.name);
                                 setIsEditingRoom(room);
                               }}
                               className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-xl transition-all"
                             >
                               <Edit3 className="h-5 w-5" />
                             </button>
                             <button 
                               onClick={() => {
                                 setDeleteRoomId(room.id);
                               }}
                               className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                             >
                               <Trash2 className="h-5 w-5" />
                             </button>
                           </div>
                        </div>

                        <div className="flex-1">
                           <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">{room.name}</h4>
                            <div className="flex items-center gap-6 mb-8">
                              <div className="flex items-center gap-2 text-slate-400 font-bold">
                                 <UserIcon className="h-4 w-4" />
                                 <span className="text-sm">{room.studentIds.length} Alunos</span>
                              </div>
                              <div 
                                className="flex items-center gap-2 text-blue-500 font-black border-l-2 border-slate-100 dark:border-slate-800 pl-6 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg relative cursor-help group/code"
                                onMouseEnter={() => setHoveredRoomCode(room.id)}
                                onMouseLeave={() => setHoveredRoomCode(null)}
                              >
                                 <AnimatePresence>
                                   {hoveredRoomCode === room.id && (
                                     <motion.div 
                                       initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                       className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl z-50 text-[10px] leading-relaxed font-bold border border-slate-700 pointer-events-none"
                                     >
                                       <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 dark:bg-slate-800 rotate-45 border-r border-b border-slate-700" />
                                       <Sparkles className="h-3 w-3 text-yellow-400 mb-2" />
                                       Peça para os alunos usarem esse código de cadastro em seu registro para serem vinculados em suas turmas automaticamente.
                                     </motion.div>
                                   )}
                                 </AnimatePresence>
                                 <Hash className="h-4 w-4" />
                                 <span className="text-sm tracking-widest">{room.code || '-----'}</span>
                              </div>
                           </div>

                           <div className="flex flex-wrap gap-2 mb-8 h-20 overflow-y-auto pr-2 custom-scrollbar">
                              {room.studentIds.map(sid => {
                                const s = users.find(u => u.id === sid);
                                if (!s) return null;
                                return (
                                  <div key={sid} className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 group/tag">
                                     {s.avatar ? <img src={s.avatar} className="h-4 w-4 rounded-full object-cover" /> : <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><UserIcon className="h-2 w-2 text-slate-400" /></div>}
                                     <span className="text-[10px] font-black uppercase text-slate-500">{s.name}</span>
                                     <button 
                                      onClick={() => {
                                        syncRooms(rooms.map(r => r.id === room.id ? { ...r, studentIds: r.studentIds.filter(id => id !== sid) } : r));
                                      }}
                                      className="text-slate-300 hover:text-red-500"
                                     >
                                        <X className="h-3 w-3" />
                                     </button>
                                  </div>
                                );
                              })}
                           </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setSelectedStudentsForRoom(room.studentIds);
                              setIsManagingStudents(room.id);
                            }}
                            className="flex-1 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
                          >
                            <UserIcon className="h-4 w-4" />
                            Alunos
                          </button>
                        </div>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'energy' && (
              <motion.div key="energy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                 <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                       <Settings className="h-7 w-7 text-blue-500" />
                       Configurações de Energia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">Quantidade Diária Padrão</label>
                          <div className="flex items-center gap-4">
                             <input 
                               type="number"
                               value={data?.settings?.defaultDailyEnergy || 5}
                               onChange={(e) => {
                                 syncSettings({ ...data?.settings, defaultDailyEnergy: parseInt(e.target.value) });
                               }}
                               className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                             />
                             <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                                <Battery className="h-7 w-7" />
                             </div>
                          </div>
                          <p className="text-xs text-slate-400 font-bold ml-1 italic">* Cada lição concluída consumirá 1 ponto de energia.</p>
                       </div>

                       <div className="flex flex-wrap gap-3">
                          {[10, 20, 30].map(amount => (
                            <button 
                              key={amount}
                              onClick={() => {
                                const roomId = prompt('ID da Turma?');
                                if (roomId) handleEnergyCombo(roomId, amount);
                              }}
                              className="px-6 py-4 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-2xl border-b-4 border-orange-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs"
                            >
                              Combo +{amount}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="mt-12 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border-2 border-blue-100 dark:border-blue-800/20">
                       <h4 className="font-black text-blue-600 dark:text-blue-400 mb-4 uppercase tracking-widest text-xs">Bonificação por Turma</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {rooms.map(room => (
                            <div key={room.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                               <p className="font-black text-slate-800 dark:text-slate-100 mb-4">{room.name}</p>
                               <div className="flex gap-2">
                                  {[10, 20, 30].map(val => (
                                    <button 
                                      key={val}
                                      onClick={() => handleEnergyCombo(room.id, val)}
                                      className="flex-1 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-[10px] rounded-lg transition-all"
                                    >
                                      +{val}
                                    </button>
                                  ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                       <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Energia Individual dos Alunos</h3>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input 
                            placeholder="Buscar aluno..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 pl-12 pr-6 font-bold outline-none focus:border-blue-500"
                          />
                       </div>
                    </div>
                    <table className="w-full">
                       <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                             <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                             <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Energia Atual</th>
                             <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                          </tr>
                       </thead>
                       <tbody>
                          {users
                            .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(u => (
                            <tr key={u.id} className="border-b last:border-0 border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                               <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center">
                                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                                     </div>
                                     <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                                  </div>
                               </td>
                               <td className="px-8 py-6 text-center">
                                  <input 
                                    type="number"
                                    value={u.energy || 0}
                                    onChange={(e) => {
                                      const updatedUsers = users.map(user => user.id === u.id ? { ...user, energy: parseInt(e.target.value) } : user);
                                      syncUsers(updatedUsers);
                                    }}
                                    className="w-20 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-lg py-2 text-center font-black text-blue-500"
                                  />
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <div className="flex justify-end gap-2">
                                     <button 
                                      onClick={() => {
                                        const updatedUsers = users.map(user => user.id === u.id ? { ...user, energy: (user.energy || 0) + 10 } : user);
                                        syncUsers(updatedUsers);
                                      }}
                                      className="p-2 bg-green-50 dark:bg-green-900/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all text-[10px] font-black"
                                     >
                                        +10
                                     </button>
                                  </div>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}

            {activeTab === 'admins' && (
              <motion.div key="admins" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {adminSubview === 'list' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Time de Administradores</h3>
                      <button 
                        onClick={() => {
                          setAdminFormError('');
                          setAdminSubview('add');
                        }}
                        className="bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                      >
                        <Plus className="h-6 w-6" />
                        Novo Administrador
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {admins.map(admin => (
                        <div key={admin.id} className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col group hover:border-blue-200 dark:hover:border-blue-900/40 transition-all shadow-sm">
                          <div className="flex items-start justify-between mb-6">
                            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                              <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingAdmin(admin);
                                  setAdminSubview('edit');
                                }}
                                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-500 rounded-xl transition-all"
                              >
                                <Edit3 className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(admin.id)}
                                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-1">{admin.name}</h4>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">{admin.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(adminSubview === 'add' || adminSubview === 'edit') && (
                  <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <button 
                      onClick={() => setAdminSubview('list')}
                      className="flex items-center gap-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase text-xs tracking-widest transition-all p-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Voltar para a lista
                    </button>

                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-12 shadow-xl">
                      <div className="flex items-center gap-6 mb-12">
                        <div className="h-20 w-20 bg-blue-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg">
                          {adminSubview === 'add' ? <Plus className="h-10 w-10" /> : <Edit3 className="h-10 w-10" />}
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            {adminSubview === 'add' ? 'Cadastrar Administrador' : 'Editar Administrador'}
                          </h3>
                          <p className="text-slate-400 font-bold">Preencha os dados de acesso abaixo.</p>
                        </div>
                      </div>

                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setAdminFormError('');
                          const formData = new FormData(e.currentTarget);
                          const payload = Object.fromEntries(formData);
                          
                          const url = adminSubview === 'add' ? '/api/admin/add' : '/api/admin/update';
                          if (adminSubview === 'edit' && editingAdmin) {
                            (payload as any).id = editingAdmin.id;
                          }

                          try {
                            const res = await fetch(url, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            if (res.ok) {
                              fetchData();
                              setAdminSubview('list');
                              setEditingAdmin(null);
                            } else {
                              setAdminFormError('Erro ao realizar operação. Tente novamente.');
                            }
                          } catch (err) {
                            setAdminFormError('Erro de conexão ao servidor.');
                          }
                        }} 
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                           <input 
                            name="name" 
                            defaultValue={editingAdmin?.name || ''} 
                            required 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Profissional</label>
                           <input 
                            name="email" 
                            type="email" 
                            defaultValue={editingAdmin?.email || ''} 
                            required 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" 
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                             {adminSubview === 'add' ? 'Senha Inicial' : 'Nova Senha (deixe em branco para manter)'}
                           </label>
                           <input 
                            name="password" 
                            type="password" 
                            required={adminSubview === 'add'} 
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 px-6 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-inner" 
                           />
                        </div>

                        {adminFormError && (
                          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                            <XCircle className="h-5 w-5" />
                            {adminFormError}
                          </div>
                        )}

                        <div className="flex gap-4">
                          <button 
                            type="button" 
                            onClick={() => setAdminSubview('list')}
                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black py-5 rounded-2xl transition-all uppercase tracking-widest"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="flex-[2] bg-blue-500 hover:bg-blue-400 text-white font-black py-5 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                          >
                            {adminSubview === 'add' ? 'Finalizar Cadastro' : 'Salvar Alterações'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Students Management Modal */}
      <AnimatePresence>
        {isManagingStudents && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsManagingStudents(null)} 
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Matricular Alunos: {rooms.find(r => r.id === isManagingStudents)?.name}
                  </h3>
                  <p className="text-slate-400 font-bold text-sm">Selecione os alunos para esta turma</p>
                </div>
                <button 
                  onClick={() => setIsManagingStudents(null)}
                  className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded-2xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por nome ou @username..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                {users
                  .filter(u => 
                    u.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                    u.username.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map(u => {
                    const isSelected = selectedStudentsForRoom.includes(u.id);
                    return (
                      <button 
                        key={u.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedStudentsForRoom(prev => prev.filter(id => id !== u.id));
                          } else {
                            setSelectedStudentsForRoom(prev => [...prev, u.id]);
                          }
                        }}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group",
                          isSelected 
                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/40" 
                            : "bg-white dark:bg-slate-900 border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            isSelected ? "bg-blue-500 border-blue-500" : "border-slate-200 dark:border-slate-700"
                          )}>
                             {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          {u.avatar ? <img src={u.avatar} className="h-10 w-10 rounded-xl object-cover" /> : <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><UserIcon className="h-5 w-5 text-slate-400" /></div>}
                          <div className="text-left">
                            <p className="font-black text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                            <p className="text-xs font-bold text-slate-400">@{u.username}</p>
                          </div>
                        </div>
                        {isSelected && <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">Selecionado</span>}
                      </button>
                    );
                  })}
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <span className="text-slate-400 font-bold text-sm">
                  {selectedStudentsForRoom.length} alunos selecionados
                </span>
                <div className="flex gap-4">
                   <button 
                    onClick={() => setIsManagingStudents(null)}
                    className="px-8 py-5 rounded-3xl font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                   >
                    Cancelar
                   </button>
                   <button 
                    onClick={() => {
                      syncRooms(rooms.map(r => r.id === isManagingStudents ? { ...r, studentIds: selectedStudentsForRoom } : r));
                      setIsManagingStudents(null);
                    }}
                    className="bg-blue-500 hover:bg-blue-400 text-white font-black px-12 py-5 rounded-3xl transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                   >
                    Salvar Turma
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Room Modal */}
      <AnimatePresence>
        {(isCreatingRoom || isEditingRoom) && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setIsCreatingRoom(false);
                setIsEditingRoom(null);
              }} 
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="text-center mb-8">
                <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <Presentation className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {isCreatingRoom ? 'Nova Turma' : 'Editar Turma'}
                </h3>
                <p className="text-slate-400 font-bold text-sm">Escolha um nome para identificar a turma.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Turma</label>
                   <input 
                    type="text"
                    autoFocus
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Ex: 3º Ano A - Manhã"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-5 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                   />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setIsCreatingRoom(false);
                      setIsEditingRoom(null);
                    }}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl transition-all uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={!newRoomName.trim()}
                    onClick={() => {
                      if (newRoomName.trim()) {
                        if (isCreatingRoom) {
                          const newId = `room-${Date.now()}`;
                          const newRoom: Room = {
                            id: newId,
                            name: newRoomName,
                            studentIds: [],
                            code: Math.floor(10000 + Math.random() * 90000).toString()
                          };
                          syncRooms([...rooms, newRoom]);
                          setIsCreatingRoom(false);
                          setSelectedStudentsForRoom([]);
                          setIsManagingStudents(newId);
                        } else if (isEditingRoom) {
                          syncRooms(rooms.map(r => r.id === isEditingRoom.id ? { ...r, name: newRoomName } : r));
                          setIsEditingRoom(null);
                        }
                      }
                    }}
                    className="flex-[2] bg-blue-500 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    {isCreatingRoom ? 'Criar e Continuar' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Turma Modal */}
      <AnimatePresence>
        {deleteRoomId && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteRoomId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
              <div className="text-center">
                <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                   <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Turma?</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                  Esta ação é irreversível. Todos os vínculos de alunos nesta turma serão removidos.
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      syncRooms(rooms.filter(r => r.id !== deleteRoomId));
                      setDeleteRoomId(null);
                    }}
                    className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg"
                  >
                    Sim, Excluir Turma
                  </button>
                  <button 
                    onClick={() => setDeleteRoomId(null)}
                    className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                  >
                    Não, Manter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exercise Editor Modal */}
        <AnimatePresence>
          {selectedLessonId && selectedLevelId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[90]">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setSelectedLessonId(null)} 
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
              >
                {data?.levels.find(l => l.id === selectedLevelId)?.lessons.find(less => less.id === selectedLessonId) && (
                  <>
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                          Exercícios: {data.levels.find(l => l.id === selectedLevelId)?.lessons.find(less => less.id === selectedLessonId)?.title}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm">Gerencie o conteúdo desta lição</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            const newEx: Exercise = {
                              id: `e-${Date.now()}`,
                              type: 'translate',
                              question: '',
                              answer: '',
                              options: ['', '', '', ''],
                              xp: 10
                            };
                            const updated = data.levels.map(l => {
                              if (l.id === selectedLevelId) {
                                return {
                                  ...l,
                                  lessons: l.lessons.map(less => less.id === selectedLessonId ? { ...less, exercises: [...less.exercises, newEx] } : less)
                                };
                              }
                              return l;
                            });
                            syncContent(updated);
                          }}
                          className="bg-green-500 hover:bg-green-400 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                        >
                          <Plus className="h-5 w-5" />
                          Novo Exercício
                        </button>
                        <button 
                          onClick={() => setSelectedLessonId(null)}
                          className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded-2xl transition-all"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      {data.levels.find(l => l.id === selectedLevelId)?.lessons.find(less => less.id === selectedLessonId)?.exercises.map((ex, exIdx) => (
                        <div key={ex.id} className="bg-slate-50 dark:bg-slate-800/30 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex gap-4">
                                <div className="h-12 w-12 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 shadow-sm">
                                   {exIdx + 1}
                                </div>
                                <select 
                                 value={ex.type}
                                 onChange={(e) => {
                                   const updated = data.levels.map(l => ({
                                     ...l,
                                     lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                       ...less,
                                       exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, type: e.target.value as any } : exe)
                                     } : less)
                                   }));
                                   syncContent(updated);
                                 }}
                                 className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 font-black text-xs uppercase tracking-widest text-blue-500 outline-none focus:border-blue-500 shadow-sm"
                                >
                                   <option value="translate">Tradução</option>
                                   <option value="select">Seleção</option>
                                   <option value="listen">Audição</option>
                                    <option value="match">Pares</option>
                                    <option value="reorder">Ordenação</option>
                                </select>
                             </div>
                             <button 
                               onClick={() => {
                                 const updated = data.levels.map(l => ({
                                   ...l,
                                   lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                     ...less,
                                     exercises: less.exercises.filter(exe => exe.id !== ex.id)
                                   } : less)
                                 }));
                                 syncContent(updated);
                               }}
                               className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900/20 transition-all"
                             >
                               <Trash2 className="h-5 w-5" />
                             </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <div>
                                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Pergunta / Frase</label>
                                   <input 
                                    value={ex.question}
                                    onChange={(e) => {
                                      const updated = data.levels.map(l => ({
                                        ...l,
                                        lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                          ...less,
                                          exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, question: e.target.value } : exe)
                                        } : less)
                                      }));
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 shadow-inner"
                                   />
                                </div>
                                <div>
                                   <label className="text-xs font-black text-green-500 uppercase tracking-widest ml-1 block mb-2">Resposta Correta</label>
                                   <input 
                                    value={ex.answer}
                                    onChange={(e) => {
                                      const updated = data.levels.map(l => ({
                                        ...l,
                                        lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                          ...less,
                                          exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, answer: e.target.value } : exe)
                                        } : less)
                                      }));
                                      syncContent(updated);
                                    }}
                                    className="w-full bg-green-50 dark:bg-green-900/10 border-2 border-green-100 dark:border-green-800/20 rounded-2xl py-4 px-6 font-bold text-green-600 dark:text-green-400 outline-none focus:border-green-500 shadow-inner"
                                   />
                                </div>
                                 <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border-2 border-blue-100 dark:border-blue-800/20">
                                   <label className="text-xs font-black text-blue-500 uppercase tracking-widest shrink-0">XP:</label>
                                   <input 
                                     type="number"
                                     value={ex.xp}
                                     onChange={(e) => {
                                       const updated = data.levels.map(l => ({
                                         ...l,
                                         lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                           ...less,
                                           exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, xp: parseInt(e.target.value) } : exe)
                                         } : less)
                                       }));
                                       syncContent(updated);
                                     }}
                                     className="w-24 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-center font-black text-blue-600 dark:text-blue-400"
                                   />
                                </div>
                             </div>

                             <div className="space-y-4">
                                {ex.type === 'match' ? (
                                  <>
                                    <div className="flex items-center justify-between ml-1">
                                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Pares de Palavras</label>
                                      <button 
                                        onClick={() => {
                                          const newPairs = [...(ex.pairs || []), { left: '', right: '' }];
                                          const updated = data.levels.map(l => ({
                                            ...l,
                                            lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                              ...less,
                                              exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                            } : less)
                                          }));
                                          syncContent(updated);
                                        }}
                                        className="text-xs font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Novo Par
                                      </button>
                                    </div>
                                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900/50">
                                      {(ex.pairs || []).map((pair, pIdx) => (
                                        <div key={pIdx} className="flex gap-2 items-center">
                                          <div className="flex-1 grid grid-cols-2 gap-2">
                                            <input 
                                              value={pair.left}
                                              onChange={(e) => {
                                                const newPairs = [...(ex.pairs || [])];
                                                newPairs[pIdx] = { ...newPairs[pIdx], left: e.target.value };
                                                const updated = data.levels.map(l => ({
                                                  ...l,
                                                  lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                    ...less,
                                                    exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                                  } : less)
                                                }));
                                                syncContent(updated);
                                              }}
                                              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-all font-sans"
                                              placeholder="Português"
                                            />
                                            <input 
                                              value={pair.right}
                                              onChange={(e) => {
                                                const newPairs = [...(ex.pairs || [])];
                                                newPairs[pIdx] = { ...newPairs[pIdx], right: e.target.value };
                                                const updated = data.levels.map(l => ({
                                                  ...l,
                                                  lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                    ...less,
                                                    exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                                  } : less)
                                                }));
                                                syncContent(updated);
                                              }}
                                              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-all font-sans"
                                              placeholder="Inglês"
                                            />
                                          </div>
                                          <button 
                                            onClick={() => {
                                              const newPairs = (ex.pairs || []).filter((_, i) => i !== pIdx);
                                              const updated = data.levels.map(l => ({
                                                ...l,
                                                lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                  ...less,
                                                  exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, pairs: newPairs } : exe)
                                                } : less)
                                              }));
                                              syncContent(updated);
                                            }}
                                            className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ))}
                                      {(!ex.pairs || ex.pairs.length === 0) && (
                                        <div className="py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest italic">Nenhum par adicionado</div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 block">Opções Adicionais</label>
                                    <div className="grid gap-3">
                                      {ex.options?.map((opt, optIdx) => (
                                        <div key={optIdx} className="relative group">
                                          <input 
                                            value={opt}
                                            onChange={(e) => {
                                              const newOpts = [...(ex.options || [])];
                                              newOpts[optIdx] = e.target.value;
                                              const updated = data.levels.map(l => ({
                                                ...l,
                                                lessons: l.lessons.map(less => less.id === selectedLessonId ? {
                                                  ...less,
                                                  exercises: less.exercises.map(exe => exe.id === ex.id ? { ...exe, options: newOpts } : exe)
                                                } : less)
                                              }));
                                              syncContent(updated);
                                            }}
                                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all font-sans"
                                            placeholder={`Opção ${optIdx + 1}`}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                      <button 
                        onClick={() => setSelectedLessonId(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-black px-10 py-5 rounded-3xl transition-all uppercase tracking-widest"
                      >
                        Concluído
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Student Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteStudentId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteStudentId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                     <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Excluir Aluno?</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    Esta ação é irreversível. O aluno perderá todo o progresso e dados permanentemente.
                  </p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={() => {
                        syncUsers(users.filter(usr => usr.id !== deleteStudentId));
                        setDeleteStudentId(null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      Sim, Excluir Aluno
                    </button>
                    <button 
                      onClick={() => setDeleteStudentId(null)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                    >
                      Não, Manter Aluno
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmId && (
            <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl overflow-hidden">
                <div className="text-center">
                  <div className="h-24 w-24 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                     <AlertTriangle className="h-14 w-14 text-red-500 shrink-0" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Remover Admin?</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 leading-relaxed">
                    Esta ação é irreversível. O administrador perderá todo o acesso ao painel instantaneamente.
                  </p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={async () => {
                        await fetch('/api/admin/delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: deleteConfirmId })
                        });
                        fetchData();
                        setDeleteConfirmId(null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-5 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest shadow-lg shadow-red-500/20"
                    >
                      Sim, Confirmar
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(null)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-400 font-black py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 transition-all uppercase tracking-widest"
                    >
                      Não, Manter
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all group",
        active 
          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" 
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200")} />
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: number | string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    orange: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    green: "text-green-500 bg-green-50 dark:bg-green-900/20"
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center group cursor-default">
      <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", colorMap[color])}>
        <Icon className="h-8 w-8" />
      </div>
      <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">{value}</h3>
    </div>
  );
}
