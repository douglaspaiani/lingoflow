"use client";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, UserMinus, Search, Users, Trophy, Star } from 'lucide-react';
import { AppData, User } from '@/types';
import { cn } from '@/lib/utils';


export default function Amigos() {
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data');
      const d = await res.json();
      setData(d);
      const mainUser = d.users.find((u: any) => u.id === '1');
      setCurrentUser(mainUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetId: string) => {
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '1', targetId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !data || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center pt-40 gap-4">
        <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-blue-500 uppercase tracking-widest animate-pulse">Buscando Amigos...</span>
      </div>
    );
  }

  const amigos = data.users.filter(u => currentUser.following.includes(u.id));
  const sugestoes = data.users.filter(u => u.id !== currentUser.id && !currentUser.following.includes(u.id));
  
  const filteredUsers = sugestoes.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-20"
    >
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-display font-black text-slate-800 dark:text-slate-100 mb-2">Amigos</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">Acompanhe e desafie seus amigos!</p>
      </div>

      {/* Busca */}
      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Buscar por nome ou usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl py-5 pl-16 pr-6 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      <div className="grid gap-12">
        {/* Seção Amigos Atuais */}
        {amigos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6 px-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Seus Amigos ({amigos.length})</h2>
            </div>
            <div className="grid gap-4">
              {amigos.map(user => (
                <UserCard key={user.id} user={user} isFollowing={true} onToggleFollow={() => handleFollow(user.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Seção Sugestões */}
        <section>
          <div className="flex items-center gap-2 mb-6 px-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Sugestões</h2>
          </div>
          <div className="grid gap-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <UserCard key={user.id} user={user} isFollowing={false} onToggleFollow={() => handleFollow(user.id)} />
              ))
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhum usuário encontrado com "{search}"</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

interface UserCardProps {
  user: User;
  isFollowing: boolean;
  onToggleFollow: () => void | Promise<void>;
  key?: React.Key;
}

function UserCard({ user, isFollowing, onToggleFollow }: UserCardProps) {
  return (
    <motion.div
      layout
      className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-200 dark:hover:border-blue-900/40 transition-all shadow-sm"
    >
      <Link href={`/perfil/${user.id}`} className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 dark:border-slate-800 shrink-0">
          <img 
            src={user.avatar || `https://picsum.photos/seed/${user.id}/200`} 
            alt={user.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-slate-800 dark:text-slate-100">{user.name}</h3>
            {user.level > 3 && <Trophy className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          </div>
          <p className="text-sm font-bold text-slate-400">@{user.username}</p>
          <div className="flex items-center gap-3 mt-1">
             <span className="text-xs font-black text-blue-500 uppercase">{user.points} XP</span>
             <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
             <span className="text-xs font-black text-orange-500 uppercase">Nível {user.level}</span>
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleFollow();
        }}
        className={cn(
          "w-full sm:w-auto px-6 py-4 sm:py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
          isFollowing 
            ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b-4 border-slate-200 dark:border-slate-950" 
            : "bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-400 shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1"
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
        </div>
      </button>
    </motion.div>
  );
}
