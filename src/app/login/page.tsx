"use client";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useUser } from '@/contexts/UserContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshData } = useUser();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        await refreshData();
        router.push('/app');
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border-4 border-slate-100 dark:border-slate-800 shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/images/logo.png" alt="LingoFlow" className="w-16 h-16 mb-4 drop-shadow-sm" />
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Bem-vindo de volta!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Continue sua jornada de aprendizado.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="Insira seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full py-4 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-[0_4px_0_0_#2563eb]"
          >
            ENTRAR
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Primeira vez por aqui?{' '}
            <Link href="/register" className="text-blue-500 font-bold hover:underline">
              Crie sua conta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
