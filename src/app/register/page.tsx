"use client";
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useUser } from '@/contexts/UserContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshData, currentUser } = useUser();

  useEffect(() => {
    if (!currentUser) return;

    const papelUsuarioAtual = (currentUser.role || '').toUpperCase();
    const sessaoAdminVirtual = papelUsuarioAtual === 'ADMIN' && String(currentUser.id || '').startsWith('admin-');
    if (sessaoAdminVirtual) return;

    if (papelUsuarioAtual === 'PROFESSOR') {
      router.push('/teacher/dashboard');
      return;
    }

    router.push('/app');
  }, [currentUser, router]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, classCode })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        await refreshData();
        router.push('/app');
      } else {
        setError(data.error || 'Erro no cadastro');
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
        <div className="flex flex-col items-center mb-10">
          <img src="/images/logo.png" alt="LingoFlow" className="w-16 h-16 mb-4 drop-shadow-sm" />
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 text-center">Junte-se à sua turma!</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-center">Insira o código fornecido pelo professor.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Código da Turma</label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              required
              maxLength={5}
              className="w-full px-4 py-3 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 focus:border-yellow-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-black text-center tracking-widest text-lg uppercase"
              placeholder="12345"
              value={classCode}
              onChange={e => {
                const onlyNumbers = e.target.value.replace(/\D/g, '').slice(0, 5);
                setClassCode(onlyNumbers);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="Seu Nome"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome de Usuário</label>
            <input 
              type="text" 
              required
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="seunome123"
              value={username}
              onChange={e => {
                const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                setUsername(formatted);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Senha</label>
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
            className="w-full py-4 mt-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-[0_4px_0_0_#16a34a]"
          >
            CRIAR CONTA
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-blue-500 font-bold hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
