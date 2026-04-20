"use client";
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { Calendar, Flame, Target, Star, MoreHorizontal, User as UserIcon, Camera, UserPlus, UserMinus, Pencil } from 'lucide-react';
import { User, AppData } from '@/types';
import { cn } from '@/lib/utils';

export default function Perfil() {
  const { userId } = useParams() as { userId: string };
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const targetId = userId || '1';
  const isOwnProfile = targetId === '1';
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = () => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: AppData) => {
        setUser(data.users.find((u: any) => u.id === targetId) || null);
        setCurrentUser(data.users.find((u: any) => u.id === '1') || null);
      });
  };

  useEffect(() => {
    fetchData();
  }, [targetId]);

  const handlePhotoClick = (type: 'avatar' | 'coverPhoto') => {
    if (!isOwnProfile) return;
    if (type === 'avatar') avatarInputRef.current?.click();
    if (type === 'coverPhoto') coverInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/user/update-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: '1', type, url: dataUrl })
        });
        if (res.ok) fetchData();
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleFollow = async () => {
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '1', targetId })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <span className="font-bold text-slate-400">Carregando Perfil...</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-8"
    >
      {/* Hidden Inputs for Photos */}
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'coverPhoto')} />

      {/* Profile Header (Centered) */}
      <div className="relative pt-12 pb-8 flex flex-col items-center">
        {/* Options Button (Top Right) */}
        <div className="absolute top-4 right-4" ref={optionsRef}>
           {isOwnProfile ? (
             <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="h-12 w-12 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                title="Opções"
              >
                <MoreHorizontal className="h-6 w-6" />
              </button>
              
              <AnimatePresence>
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 top-14 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-100 dark:border-slate-800 py-2 z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        router.push('/editar-perfil');
                      }}
                      className="w-full px-4 py-3 text-left font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                      Editar Perfil
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
             </div>
           ) : (
             <button 
              onClick={handleToggleFollow}
              className={cn(
                "px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all shadow-lg",
                currentUser?.following?.includes(user.id) 
                  ? "bg-slate-100 dark:bg-slate-800 border-b-4 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300" 
                  : "bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-400"
              )}
             >
                {currentUser?.following?.includes(user.id) ? (
                  <UserMinus className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                {currentUser?.following?.includes(user.id) ? 'Seguindo' : 'Seguir'}
             </button>
           )}
        </div>

        {/* Avatar */}
        <div 
          onClick={() => handlePhotoClick('avatar')}
          className={cn(
            "h-40 w-40 rounded-[3rem] border-4 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl relative mb-6",
            isOwnProfile && "cursor-pointer group"
          )}
        >
          <img 
            src={user.avatar || `https://picsum.photos/seed/${user.id}/200`} 
            alt={user.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isOwnProfile && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-10 w-10 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
            {user.name}
            {user.level > 3 && <Target className="h-6 w-6 text-blue-500 fill-blue-500" />}
          </h1>
          <p className="text-blue-500 font-black text-lg">@{user.username || user.name.toLowerCase()}</p>
          
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{(user.following || []).length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguindo</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-slate-800 dark:text-slate-100">{(user.followers || []).length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seguidores</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* About / Info */}
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Calendar className="h-5 w-5 text-slate-400" />
             <span className="text-slate-500 font-bold">Entrou em Abril de 2026</span>
          </div>
          <div className="flex items-center -space-x-3">
             {[1,2,3].map(i => (
               <div key={i} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                 <img src={`https://picsum.photos/seed/friend${i}/50`} alt="" referrerPolicy="no-referrer" />
               </div>
             ))}
             <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
               +12
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
            <Flame className="h-8 w-8 text-orange-500 fill-orange-500 mb-1" />
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{user.streak}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ofensiva</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
            <Star className="h-8 w-8 text-blue-400 fill-blue-400 mb-1" />
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{user.points}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
            <Target className="h-8 w-8 text-yellow-400 fill-yellow-400 mb-1" />
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{user.level}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-sm">
            <UserIcon className="h-8 w-8 text-green-500 mb-1" />
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">Top 3</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking</span>
          </div>
        </div>

        {/* Achievements / Desafios Diários */}
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 mb-4 px-2">Conquistas Recentes</h2>
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
          {[
            { icon: Star, color: 'text-yellow-400', title: 'Colecionador de XP', desc: 'Acumulou mais de 1000 pontos', progress: 100 },
            { icon: Flame, color: 'text-orange-500', title: 'Fogo nos Olhos', desc: 'Manteve 5 dias de ofensiva', progress: 100 },
            { icon: Target, color: 'text-blue-500', title: 'Atirador de Elite', desc: 'Concluiu 10 lições perfeitas', progress: 60 },
          ].map((challenge, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className={cn("h-16 w-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-inner", challenge.color)}>
                <challenge.icon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100">{challenge.title}</h4>
                    <p className="text-sm font-bold text-slate-400">{challenge.desc}</p>
                  </div>
                  <span className="text-xs font-black text-slate-500">{challenge.progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${challenge.progress}%` }}
                    className={cn("h-full rounded-full", challenge.color.replace('text', 'bg'))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
