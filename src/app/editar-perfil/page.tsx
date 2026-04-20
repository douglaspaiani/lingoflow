"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

import { ArrowLeft, Save, AtSign, User as UserIcon } from 'lucide-react';
import { User, AppData } from '@/types';
import { cn } from '@/lib/utils';

export default function EditarPerfil() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then((data: AppData) => {
        const currentUser = data.users.find(u => u.id === '1');
        if (currentUser) {
          setUser(currentUser);
          setName(currentUser.name);
          setUsername(currentUser.username);
        }
      });
  }, []);

  const handleUsernameChange = (val: string) => {
    // Letras, números e subscrito apenas. Sem acentos ou ç. Tudo minúsculo. Sem hífens.
    const cleanVal = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9_]/g, ""); // Remove tudo que não for letra, número ou _
    
    setUsername(cleanVal);
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '1', name, username })
      });
      if (res.ok) {
        router.push('/perfil');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="pb-24 max-w-xl mx-auto px-4"
    >
      <div className="flex items-center gap-4 py-8 mb-8">
        <button 
          onClick={() => router.push('/perfil')}
          className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 shadow-sm hover:scale-105 transition-transform"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Editar Perfil</h1>
      </div>

      <div className="space-y-8">
        {/* Foto Preview */}
        <div className="flex flex-col items-center mb-12">
            <div className="h-32 w-32 rounded-[2.5rem] border-8 border-white dark:border-slate-950 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl relative mb-4">
                <img 
                    src={user.avatar || `https://picsum.photos/seed/${user.id}/200`} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                />
            </div>
            <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Acesse o perfil para mudar as fotos</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
            <div className="relative">
              <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome exibido"
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Usuário</label>
            <div className="relative">
              <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="usuario_unico"
                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1">
              Apenas letras minúsculas, números e subscritos (_).
            </p>
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !username.trim()}
            className={cn(
              "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xl transition-all shadow-xl flex items-center justify-center gap-3",
              isSaving || !name.trim() || !username.trim()
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-green-500 text-white border-b-8 border-green-700 hover:bg-green-400 active:border-b-0 active:translate-y-2"
            )}
          >
            {isSaving ? (
              <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-6 w-6" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
