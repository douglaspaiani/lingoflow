"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Medal, Users, Flame, Search, ChevronDown, Check } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

type AlunoTurmaRanking = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  level: number;
  streak: number;
  xp: number;
  points: number;
};

type TurmaProfessorRanking = {
  id: string;
  name: string;
  code: string;
  nivelTurma: number;
  alunos: AlunoTurmaRanking[];
};

type RespostaPainelProfessorRanking = {
  professor: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  turmas: TurmaProfessorRanking[];
};

function obterEmojiPosicao(posicao: number) {
  if (posicao === 0) return '🥇';
  if (posicao === 1) return '🥈';
  if (posicao === 2) return '🥉';
  return `#${posicao + 1}`;
}

export default function PaginaRankingProfessor() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [carregandoRankingProfessor, setCarregandoRankingProfessor] = useState(true);
  const [erroRankingProfessor, setErroRankingProfessor] = useState('');
  const [dadosRankingProfessor, setDadosRankingProfessor] = useState<RespostaPainelProfessorRanking | null>(null);
  const [idTurmaSelecionadaRanking, setIdTurmaSelecionadaRanking] = useState('');
  const [filtroBuscaTurma, setFiltroBuscaTurma] = useState('');
  const [seletorTurmaAberto, setSeletorTurmaAberto] = useState(false);
  const referenciaSeletorTurma = useRef<HTMLDivElement | null>(null);

  const roleUsuarioAtual = useMemo(() => (currentUser?.role || '').toUpperCase(), [currentUser?.role]);
  const acessoProfessorPermitido = roleUsuarioAtual === 'PROFESSOR';

  useEffect(() => {
    if (!currentUser || !acessoProfessorPermitido) return;

    const buscarRankingProfessor = async () => {
      setCarregandoRankingProfessor(true);
      setErroRankingProfessor('');
      try {
        const resposta = await fetch('/api/professor/painel', { cache: 'no-store' });
        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
          setErroRankingProfessor(dados?.error || 'Não foi possível carregar o ranking das turmas.');
          return;
        }

        setDadosRankingProfessor(dados);

        const primeiraTurma = dados?.turmas?.[0];
        if (primeiraTurma?.id) {
          setIdTurmaSelecionadaRanking(primeiraTurma.id);
        }
      } catch (erro) {
        setErroRankingProfessor('Erro de conexão ao carregar o ranking.');
      } finally {
        setCarregandoRankingProfessor(false);
      }
    };

    buscarRankingProfessor();
  }, [acessoProfessorPermitido, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/teacher');
      return;
    }

    if (!acessoProfessorPermitido) {
      router.replace('/teacher');
    }
  }, [acessoProfessorPermitido, currentUser, router]);

  const turmaSelecionadaRanking = useMemo(() => {
    if (!dadosRankingProfessor) return null;
    return dadosRankingProfessor.turmas.find((turma) => turma.id === idTurmaSelecionadaRanking) || null;
  }, [dadosRankingProfessor, idTurmaSelecionadaRanking]);

  const alunosOrdenadosRanking = useMemo(() => {
    const alunos = turmaSelecionadaRanking?.alunos || [];
    return [...alunos].sort((alunoA, alunoB) => {
      if (alunoB.xp !== alunoA.xp) return alunoB.xp - alunoA.xp;
      if (alunoB.streak !== alunoA.streak) return alunoB.streak - alunoA.streak;
      return alunoA.name.localeCompare(alunoB.name, 'pt-BR');
    });
  }, [turmaSelecionadaRanking]);

  const xpTotalTurma = useMemo(() => {
    return alunosOrdenadosRanking.reduce((acumulador, aluno) => acumulador + (Number(aluno.xp) || 0), 0);
  }, [alunosOrdenadosRanking]);

  const turmasFiltradasBusca = useMemo(() => {
    const turmas = dadosRankingProfessor?.turmas || [];
    const textoBusca = filtroBuscaTurma.trim().toLowerCase();
    if (!textoBusca) return turmas;

    return turmas.filter((turma) => {
      const nomeTurma = turma.name.toLowerCase();
      const codigoTurma = turma.code.toLowerCase();
      return nomeTurma.includes(textoBusca) || codigoTurma.includes(textoBusca);
    });
  }, [dadosRankingProfessor?.turmas, filtroBuscaTurma]);

  const textoTurmaSelecionada = useMemo(() => {
    if (!turmaSelecionadaRanking) return 'Selecione uma turma...';
    return turmaSelecionadaRanking.name;
  }, [turmaSelecionadaRanking]);

  const selecionarTurmaDoRanking = (idTurma: string) => {
    setIdTurmaSelecionadaRanking(idTurma);
    setFiltroBuscaTurma('');
    setSeletorTurmaAberto(false);
  };

  useEffect(() => {
    const fecharSeletorAoClicarFora = (evento: MouseEvent) => {
      if (!seletorTurmaAberto) return;
      if (!referenciaSeletorTurma.current) return;
      if (referenciaSeletorTurma.current.contains(evento.target as Node)) return;
      setSeletorTurmaAberto(false);
    };

    document.addEventListener('mousedown', fecharSeletorAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharSeletorAoClicarFora);
  }, [seletorTurmaAberto]);

  if (!currentUser || !acessoProfessorPermitido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="bg-slate-700 hover:bg-slate-600 text-white font-black px-4 py-2 rounded-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>

          <div className="flex items-center gap-2 text-emerald-400">
            <Trophy className="h-5 w-5" />
            <p className="font-black uppercase tracking-widest text-xs">Ranking por turma</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Ranking do Professor</h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-300 mt-1">
            Selecione uma turma para ver a classificação dos alunos.
          </p>

          <div className="mt-5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Turma</label>
            <div ref={referenciaSeletorTurma} className="mt-2 relative">
              <button
                type="button"
                onClick={() => setSeletorTurmaAberto((valorAtual) => !valorAtual)}
                className="w-full rounded-2xl border-2 border-slate-200/80 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 px-4 py-3.5 font-black text-sm text-slate-700 dark:text-slate-100 outline-none hover:border-blue-400/70 focus:border-blue-500 transition-all flex items-center justify-between gap-3 shadow-[0_8px_24px_-18px_rgba(37,99,235,0.45)]"
              >
                <span className="truncate text-left">{textoTurmaSelecionada}</span>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform ${seletorTurmaAberto ? 'rotate-180' : ''}`}
                />
              </button>

              {seletorTurmaAberto && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        autoFocus
                        value={filtroBuscaTurma}
                        onChange={(evento) => setFiltroBuscaTurma(evento.target.value)}
                        placeholder="Buscar turma por nome ou código..."
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                    {turmasFiltradasBusca.length === 0 && (
                      <p className="px-3 py-4 text-xs font-black text-slate-400 text-center uppercase tracking-widest">
                        Nenhuma turma encontrada
                      </p>
                    )}

                    {turmasFiltradasBusca.map((turma) => {
                      const turmaEstaSelecionada = turma.id === idTurmaSelecionadaRanking;
                      return (
                        <button
                          key={turma.id}
                          type="button"
                          onClick={() => selecionarTurmaDoRanking(turma.id)}
                          className={`w-full text-left rounded-xl px-3 py-2.5 transition-all border-2 ${
                            turmaEstaSelecionada
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{turma.name}</p>
                            </div>
                            {turmaEstaSelecionada && <Check className="h-4 w-4 text-blue-500 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {carregandoRankingProfessor && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-10 flex justify-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregandoRankingProfessor && erroRankingProfessor && (
          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-[2rem] p-6 text-red-600 dark:text-red-300 font-bold">
            {erroRankingProfessor}
          </div>
        )}

        {!carregandoRankingProfessor && !erroRankingProfessor && turmaSelecionadaRanking && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <p className="font-black text-slate-800 dark:text-slate-100">
                Turma: {turmaSelecionadaRanking.name}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  Nível {turmaSelecionadaRanking.nivelTurma} • {alunosOrdenadosRanking.length} aluno(s)
                </p>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest">
                  XP total da turma: {xpTotalTurma}
                </p>
              </div>
            </div>

            {alunosOrdenadosRanking.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-6 text-center">
                <Users className="h-7 w-7 mx-auto text-slate-400 mb-2" />
                <p className="font-black text-slate-500 dark:text-slate-300">Nenhum aluno nesta turma ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alunosOrdenadosRanking.map((aluno, indice) => (
                  <div
                    key={aluno.id}
                    className="rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        {aluno.avatar ? (
                          <img src={aluno.avatar} alt={`Avatar de ${aluno.name}`} className="w-full h-full object-cover" />
                        ) : (
                          <Medal className="h-5 w-5 text-slate-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-slate-800 dark:text-slate-100 truncate">{aluno.name}</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-300 truncate">@{aluno.username}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-slate-800 dark:text-slate-100">{obterEmojiPosicao(indice)}</p>
                      <p className="text-xs font-black text-blue-600 dark:text-blue-300">{aluno.xp} XP</p>
                      <p className="text-[10px] font-black text-orange-500 dark:text-orange-300 uppercase tracking-widest flex items-center justify-end gap-1">
                        <Flame className="h-3 w-3" />
                        Ofensiva {aluno.streak}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
