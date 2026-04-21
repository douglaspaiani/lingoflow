"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, Gamepad2, LogOut, AlertCircle, Play, X, CheckCircle2, Trophy, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/contexts/UserContext';

type TurmaProfessor = {
  id: string;
  name: string;
  code: string;
  nivelTurma: number;
  alunos: Array<{ id: string }>;
};

type JogoProfessor = {
  id: string;
  slug: string;
  nome: string;
  descricao?: string;
  totalFases: number;
  configuracaoBattleMode?: {
    tipoResposta: string;
    duracaoSegundos: number;
  } | null;
};

type SessaoAtivaProfessor = {
  id: string;
  turmaId: string;
  jogoId: string;
  faseAtualId?: string | null;
  nivelTurma: number;
  iniciadaEm: string;
};

type PainelProfessor = {
  appUrl?: string;
  professor: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  turmas: TurmaProfessor[];
  jogos: JogoProfessor[];
  sessoesAtivas: SessaoAtivaProfessor[];
};

export default function PaginaDashboardTeacher() {
  const router = useRouter();
  const { currentUser, logout } = useUser();
  const [carregandoPainelProfessor, setCarregandoPainelProfessor] = useState(true);
  const [erroPainelProfessor, setErroPainelProfessor] = useState('');
  const [dadosPainelProfessor, setDadosPainelProfessor] = useState<PainelProfessor | null>(null);
  const [modalIniciarJogoAberto, setModalIniciarJogoAberto] = useState(false);
  const [jogoSelecionadoParaInicio, setJogoSelecionadoParaInicio] = useState<JogoProfessor | null>(null);
  const [idTurmaSelecionadaParaInicioJogo, setIdTurmaSelecionadaParaInicioJogo] = useState('');
  const [iniciandoJogoTempoReal, setIniciandoJogoTempoReal] = useState(false);
  const [erroInicioJogoTempoReal, setErroInicioJogoTempoReal] = useState('');
  const [notificacaoSessaoIniciada, setNotificacaoSessaoIniciada] = useState('');
  const [modalCodigoCadastroAberto, setModalCodigoCadastroAberto] = useState(false);
  const [codigoCadastroSelecionado, setCodigoCadastroSelecionado] = useState('');

  const roleUsuarioAtual = useMemo(() => (currentUser?.role || '').toUpperCase(), [currentUser?.role]);
  const acessoProfessorPermitido = roleUsuarioAtual === 'PROFESSOR';

  useEffect(() => {
    if (!currentUser) {
      router.replace('/teacher');
      return;
    }

    if (!acessoProfessorPermitido) {
      router.replace('/teacher');
      return;
    }

    const buscarPainelProfessor = async () => {
      setCarregandoPainelProfessor(true);
      setErroPainelProfessor('');
      try {
        const resposta = await fetch('/api/professor/painel', { cache: 'no-store' });
        const dados = await resposta.json().catch(() => null);

        if (!resposta.ok) {
          setErroPainelProfessor(dados?.error || 'Não foi possível carregar o painel do professor.');
          return;
        }

        setDadosPainelProfessor(dados);
      } catch (error) {
        setErroPainelProfessor('Erro de conexão ao carregar o painel.');
      } finally {
        setCarregandoPainelProfessor(false);
      }
    };

    buscarPainelProfessor();
  }, [acessoProfessorPermitido, currentUser, router]);

  const abrirModalIniciarJogo = (jogo: JogoProfessor) => {
    const primeiraTurmaDisponivel = dadosPainelProfessor?.turmas?.[0];
    setJogoSelecionadoParaInicio(jogo);
    setIdTurmaSelecionadaParaInicioJogo(primeiraTurmaDisponivel?.id || '');
    setErroInicioJogoTempoReal('');
    setModalIniciarJogoAberto(true);
  };

  const fecharModalIniciarJogo = () => {
    if (iniciandoJogoTempoReal) return;
    setModalIniciarJogoAberto(false);
    setJogoSelecionadoParaInicio(null);
    setIdTurmaSelecionadaParaInicioJogo('');
    setErroInicioJogoTempoReal('');
  };

  const obterNomeTurmaPorId = (idTurma: string) => {
    return dadosPainelProfessor?.turmas.find((turma) => turma.id === idTurma)?.name || 'Turma';
  };

  const obterSlugJogoPorId = (idJogo: string) => {
    return dadosPainelProfessor?.jogos.find((jogo) => jogo.id === idJogo)?.slug || 'traduzir-imagem';
  };

  const irParaRanking = () => {
    router.push('/teacher/ranking');
  };

  const irParaApp = () => {
    router.push('/app');
  };

  const realizarLogoutProfessor = async () => {
    await logout('/teacher');
  };

  const abrirModalCodigoCadastro = (codigoTurma: string) => {
    setCodigoCadastroSelecionado(codigoTurma);
    setModalCodigoCadastroAberto(true);
  };

  const fecharModalCodigoCadastro = () => {
    setModalCodigoCadastroAberto(false);
    setCodigoCadastroSelecionado('');
  };

  const obterUrlCadastro = () => {
    const urlBaseConfigurada = (dadosPainelProfessor?.appUrl || '').trim();
    const urlBase = urlBaseConfigurada || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${urlBase.replace(/\/$/, '')}/cadastro`;
  };

  const iniciarJogoTempoReal = async () => {
    if (!jogoSelecionadoParaInicio) return;

    if (!idTurmaSelecionadaParaInicioJogo) {
      setErroInicioJogoTempoReal('Selecione uma turma para iniciar o jogo.');
      return;
    }

    setIniciandoJogoTempoReal(true);
    setErroInicioJogoTempoReal('');
    try {
      const resposta = await fetch('/api/playground/professor/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: idTurmaSelecionadaParaInicioJogo,
          jogoSlug: jogoSelecionadoParaInicio.slug
        })
      });

      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroInicioJogoTempoReal(dados?.error || 'Não foi possível iniciar o jogo.');
        return;
      }

      const idSessaoCriada = typeof dados?.sessao?.id === 'string' ? dados.sessao.id : '';
      if (!idSessaoCriada) {
        setErroInicioJogoTempoReal('Sessão iniciada sem ID válido. Tente novamente.');
        return;
      }

      setNotificacaoSessaoIniciada(
        `Sessão iniciada para ${obterNomeTurmaPorId(idTurmaSelecionadaParaInicioJogo)}. Alunos podem entrar no jogo agora.`
      );
      setModalIniciarJogoAberto(false);
      router.push(`/teacher/jogos/${jogoSelecionadoParaInicio.slug}/sessao/${idSessaoCriada}`);
    } catch (erro) {
      setErroInicioJogoTempoReal('Erro de conexão ao iniciar o jogo.');
    } finally {
      setIniciandoJogoTempoReal(false);
    }
  };

  if (!currentUser || !acessoProfessorPermitido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800">
            <img src="/images/logo.png" alt="Logotipo do sistema" className="w-full h-full object-contain" />
          </div>
          <span
            className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-500 tracking-tight pb-1"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            lingoflow
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Dashboard do Professor</h1>
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                Tenha uma boa aula, teacher {dadosPainelProfessor?.professor?.name || currentUser.name}!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={irParaApp}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Acessar app
            </button>
            <button
              onClick={irParaRanking}
              className="bg-blue-500 hover:bg-blue-400 text-white font-black px-6 py-3 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Ranking
            </button>
            <button
              onClick={() => {
                void realizarLogoutProfessor();
              }}
              className="bg-red-500 hover:bg-red-400 text-white font-black px-6 py-3 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {notificacaoSessaoIniciada && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-300 text-sm font-black">
                <CheckCircle2 className="h-4 w-4" />
                {notificacaoSessaoIniciada}
              </div>
              <button
                onClick={() => setNotificacaoSessaoIniciada('')}
                className="text-emerald-500 hover:text-emerald-400"
                aria-label="Fechar aviso de sessão iniciada"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {carregandoPainelProfessor && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 flex justify-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregandoPainelProfessor && erroPainelProfessor && (
          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-[2.5rem] p-6 text-red-600 dark:text-red-300 font-bold flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            {erroPainelProfessor}
          </div>
        )}

        {!carregandoPainelProfessor && !erroPainelProfessor && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Minhas Turmas
              </h2>
              <div className="space-y-3">
                {(dadosPainelProfessor?.turmas || []).length === 0 && (
                  <p className="text-slate-400 font-bold text-sm">Nenhuma turma vinculada.</p>
                )}
                {(dadosPainelProfessor?.turmas || []).map((turma) => (
                  <div key={turma.id} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                    <p className="font-black text-slate-800 dark:text-slate-100">{turma.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
                        Nível {turma.nivelTurma} • {turma.alunos.length} aluno(s)
                      </p>
                      <button
                        onClick={() => abrirModalCodigoCadastro(turma.code)}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-black px-3 py-1.5 rounded-xl border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-[10px] shrink-0"
                      >
                        Código cadastro
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-emerald-500" />
                Jogos Disponíveis
              </h2>
              <div className="space-y-3">
                {(dadosPainelProfessor?.jogos || []).length === 0 && (
                  <p className="text-slate-400 font-bold text-sm">Nenhum jogo disponível no momento.</p>
                )}
                {(dadosPainelProfessor?.jogos || []).map((jogo) => (
                  <div key={jogo.id} className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-800 dark:text-slate-100">{jogo.nome}</p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-300 mt-1">
                          {jogo.descricao || 'Jogo em tempo real para a turma.'}
                        </p>
                        {jogo.configuracaoBattleMode && (
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-2">
                            {jogo.configuracaoBattleMode.tipoResposta} • {Math.round(jogo.configuracaoBattleMode.duracaoSegundos / 60)} min
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => abrirModalIniciarJogo(jogo)}
                        className="bg-blue-500 hover:bg-blue-400 text-white font-black px-4 py-2 rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all uppercase tracking-widest text-[10px] flex items-center gap-1.5 shrink-0"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Iniciar jogo
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {(dadosPainelProfessor?.sessoesAtivas || []).length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Sessões ativas</p>
                  {(dadosPainelProfessor?.sessoesAtivas || []).map((sessaoAtiva) => (
                    <div key={sessaoAtiva.id} className="flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/20 rounded-xl px-3 py-2">
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                        {obterNomeTurmaPorId(sessaoAtiva.turmaId)} • Nível {sessaoAtiva.nivelTurma}
                      </p>
                      <button
                        onClick={() =>
                          router.push(`/teacher/jogos/${obterSlugJogoPorId(sessaoAtiva.jogoId)}/sessao/${sessaoAtiva.id}`)
                        }
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-300 hover:text-emerald-500"
                      >
                        Abrir sessão
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalIniciarJogoAberto && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={fecharModalIniciarJogo}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <button
                onClick={fecharModalIniciarJogo}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Fechar modal de iniciar jogo"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Iniciar jogo</h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                  {jogoSelecionadoParaInicio?.nome || 'Jogo selecionado'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Selecione a turma</label>
                <select
                  value={idTurmaSelecionadaParaInicioJogo}
                  onChange={(evento) => setIdTurmaSelecionadaParaInicioJogo(evento.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="">Escolha uma turma...</option>
                  {(dadosPainelProfessor?.turmas || []).map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.name} • Nível {turma.nivelTurma}
                    </option>
                  ))}
                </select>
              </div>

              {erroInicioJogoTempoReal && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl p-3 text-red-500 text-sm font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {erroInicioJogoTempoReal}
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={fecharModalIniciarJogo}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 font-black py-3 rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={iniciarJogoTempoReal}
                  disabled={iniciandoJogoTempoReal || !idTurmaSelecionadaParaInicioJogo}
                  className="flex-[1.5] bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black py-3 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                  {iniciandoJogoTempoReal && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {iniciandoJogoTempoReal ? 'Iniciando...' : 'Iniciar sessão'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {modalCodigoCadastroAberto && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={fecharModalCodigoCadastro}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <button
                onClick={fecharModalCodigoCadastro}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Fechar modal de código de cadastro"
              >
                <X className="h-4 w-4" />
              </button>

              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-3">Código de cadastro</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 mb-4">Insira o código abaixo em</h3>
              <p className="text-lg font-black text-blue-600 dark:text-blue-300 break-all mb-8">{obterUrlCadastro()}</p>

              <div className="rounded-3xl border-2 border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/10 p-8 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">Código da turma</p>
                <p className="text-5xl md:text-6xl font-black text-indigo-600 dark:text-indigo-300 tracking-[0.15em]">
                  {codigoCadastroSelecionado}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
