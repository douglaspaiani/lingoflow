"use client";
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useUser } from '@/contexts/UserContext';

export default function PaginaLoginProfessor() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrandoProfessor, setEntrandoProfessor] = useState(false);
  const router = useRouter();
  const { refreshData, currentUser } = useUser();

  useEffect(() => {
    if (!currentUser) return;

    const roleUsuarioAtual = (currentUser.role || '').toUpperCase();

    if (roleUsuarioAtual === 'PROFESSOR') {
      router.replace('/teacher/dashboard');
      return;
    }
  }, [currentUser, router]);

  const handleLoginProfessor = async (evento: FormEvent) => {
    evento.preventDefault();
    if (entrandoProfessor) return;

    setErro('');
    setEntrandoProfessor(true);
    try {
      const resposta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha })
      });
      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        setErro(dados.error || 'Credenciais inválidas');
        return;
      }

      if (dados.user?.role !== 'PROFESSOR') {
        await fetch('/api/auth/logout', { method: 'POST' });
        setErro('Este acesso é exclusivo para professores.');
        return;
      }

      await refreshData();
      router.replace('/teacher/dashboard');
    } catch (error) {
      setErro('Erro de conexão ao servidor.');
    } finally {
      setEntrandoProfessor(false);
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-20 w-20 rounded-3xl flex items-center justify-center overflow-hidden p-2 shadow-xl">
              <img src="/images/logo.png" alt="Logotipo do sistema" className="w-full h-full object-contain" />
            </div>
            <span
              className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight pb-1"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              lingoflow
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Acesso do Professor</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Vamos deixar os alunos viciados em aprender?</p>
        </div>

        <form onSubmit={handleLoginProfessor} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">E-mail</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="Insira seu e-mail"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Senha</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-medium"
              placeholder="••••••"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
            />
          </div>

          {erro && <p className="text-red-500 text-sm font-bold text-center">{erro}</p>}

          <button
            type="submit"
            disabled={entrandoProfessor}
            className="w-full py-4 mt-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-[0_4px_0_0_#2563eb] flex items-center justify-center gap-2"
          >
            {entrandoProfessor && <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {entrandoProfessor ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
