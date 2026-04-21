"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Search, User as IconeUsuario, Users } from 'lucide-react';
import { AppData, User } from '@/types';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

type AbaConexao = 'seguindo' | 'seguidores';

function obterAbaValida(aba: string | null): AbaConexao {
  return aba === 'seguidores' ? 'seguidores' : 'seguindo';
}

function filtrarUsuariosPorBusca(usuarios: User[], busca: string) {
  const termoNormalizado = busca.trim().toLowerCase();
  if (!termoNormalizado) {
    return usuarios;
  }

  return usuarios.filter((usuario) => {
    return (
      usuario.name.toLowerCase().includes(termoNormalizado) ||
      usuario.username.toLowerCase().includes(termoNormalizado)
    );
  });
}

export default function ConexoesPerfilPage() {
  const router = useRouter();
  const parametros = useParams() as { userId?: string };
  const parametrosBusca = useSearchParams();
  const { currentUser: usuarioSessao } = useUser();

  const [dadosApp, setDadosApp] = useState<AppData | null>(null);
  const [usuarioPerfil, setUsuarioPerfil] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [textoBusca, setTextoBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaConexao>(obterAbaValida(parametrosBusca.get('aba')));

  const idUsuarioPerfil = typeof parametros.userId === 'string' ? parametros.userId : '';

  useEffect(() => {
    setAbaAtiva(obterAbaValida(parametrosBusca.get('aba')));
  }, [parametrosBusca]);

  useEffect(() => {
    if (!usuarioSessao) {
      router.replace('/login');
      return;
    }

    const papelUsuario = (usuarioSessao.role || '').toUpperCase();
    if (papelUsuario === 'PROFESSOR') {
      router.replace('/app');
      return;
    }

    if (papelUsuario === 'ADMIN') {
      setCarregando(false);
      setErroCarregamento('A área social não está disponível para administradores.');
      return;
    }

    if (!idUsuarioPerfil) {
      setCarregando(false);
      setErroCarregamento('Perfil inválido.');
      return;
    }

    void carregarDados();
  }, [usuarioSessao, router, idUsuarioPerfil]);

  const carregarDados = async () => {
    setCarregando(true);
    setErroCarregamento('');

    try {
      const resposta = await fetch('/api/data', { cache: 'no-store' });
      if (!resposta.ok) {
        throw new Error('Falha ao carregar conexões.');
      }

      const dados = (await resposta.json()) as AppData;
      const perfil = dados.users.find((usuario) => usuario.id === idUsuarioPerfil) || null;

      if (!perfil) {
        setDadosApp(null);
        setUsuarioPerfil(null);
        setErroCarregamento('Perfil não encontrado.');
        return;
      }

      setDadosApp(dados);
      setUsuarioPerfil(perfil);
    } catch (erro) {
      console.error('Erro ao carregar conexões do perfil:', erro);
      setErroCarregamento('Não foi possível carregar as conexões deste perfil.');
      setDadosApp(null);
      setUsuarioPerfil(null);
    } finally {
      setCarregando(false);
    }
  };

  const listasConexoes = useMemo(() => {
    if (!dadosApp || !usuarioPerfil) {
      return { listaSeguindo: [] as User[], listaSeguidores: [] as User[] };
    }

    // Usa os IDs salvos no perfil para montar listas completas com os dados públicos de cada aluno.
    const idsSeguindo = usuarioPerfil.following || [];
    const idsSeguidores = usuarioPerfil.followers || [];

    const listaSeguindo = dadosApp.users.filter((usuario) => idsSeguindo.includes(usuario.id));
    const listaSeguidores = dadosApp.users.filter((usuario) => idsSeguidores.includes(usuario.id));

    return { listaSeguindo, listaSeguidores };
  }, [dadosApp, usuarioPerfil]);

  const listaVisivel = abaAtiva === 'seguindo' ? listasConexoes.listaSeguindo : listasConexoes.listaSeguidores;
  const listaFiltrada = filtrarUsuariosPorBusca(listaVisivel, textoBusca);
  const totalSeguindo = listasConexoes.listaSeguindo.length;
  const totalSeguidores = listasConexoes.listaSeguidores.length;

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-black text-slate-400 uppercase tracking-widest">Carregando conexões...</span>
      </div>
    );
  }

  if (erroCarregamento || !usuarioPerfil || !dadosApp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-6 text-center">
        <p className="font-black text-slate-500 dark:text-slate-300">
          {erroCarregamento || 'Não foi possível carregar as conexões.'}
        </p>
        <button
          onClick={() => router.push('/app')}
          className="bg-blue-500 hover:bg-blue-400 text-white font-black py-3 px-6 rounded-2xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-xs"
        >
          Voltar ao app
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="pb-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push(`/perfil/${usuarioPerfil.id}`)}
          className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 shadow-sm hover:scale-105 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">Conexões</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold">@{usuarioPerfil.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setAbaAtiva('seguindo')}
          className={cn(
            'rounded-2xl px-4 py-4 border-2 transition-all text-left',
            abaAtiva === 'seguindo'
              ? 'bg-blue-500 border-blue-700 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200'
          )}
        >
          <span className="text-xs uppercase tracking-widest font-black opacity-80">Seguindo</span>
          <p className="text-2xl font-black">{totalSeguindo}</p>
        </button>

        <button
          onClick={() => setAbaAtiva('seguidores')}
          className={cn(
            'rounded-2xl px-4 py-4 border-2 transition-all text-left',
            abaAtiva === 'seguidores'
              ? 'bg-blue-500 border-blue-700 text-white'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200'
          )}
        >
          <span className="text-xs uppercase tracking-widest font-black opacity-80">Seguidores</span>
          <p className="text-2xl font-black">{totalSeguidores}</p>
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder={`Buscar em ${abaAtiva}...`}
          value={textoBusca}
          onChange={(evento) => setTextoBusca(evento.target.value)}
          className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-4 font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {listaFiltrada.length > 0 ? (
        <div className="grid gap-4">
          {listaFiltrada.map((usuario) => (
            <Link
              key={usuario.id}
              href={`/perfil/${usuario.id}`}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl p-4 flex items-center gap-4 hover:border-blue-200 dark:hover:border-blue-900/40 transition-all"
            >
              <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200 dark:border-slate-800 shrink-0">
                <img
                  src={usuario.avatar || `https://picsum.photos/seed/${usuario.id}/200`}
                  alt={usuario.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="min-w-0">
                <p className="font-black text-slate-800 dark:text-slate-100 truncate">{usuario.name}</p>
                <p className="text-sm font-bold text-slate-400 truncate">@{usuario.username}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            {abaAtiva === 'seguindo' ? <Users className="h-7 w-7 text-slate-400" /> : <IconeUsuario className="h-7 w-7 text-slate-400" />}
          </div>
          <p className="font-black text-slate-500 dark:text-slate-300">
            {textoBusca.trim()
              ? 'Nenhum perfil encontrado para esta busca.'
              : abaAtiva === 'seguindo'
                ? 'Este aluno ainda não está seguindo ninguém.'
                : 'Este aluno ainda não possui seguidores.'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
