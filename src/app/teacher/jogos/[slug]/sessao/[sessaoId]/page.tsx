"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, SkipForward, Square, AlertCircle, Gamepad2, Crown, Medal, Sparkles, Eye, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useUser } from '@/contexts/UserContext';

type FaseAtualSessao = {
  id: string;
  nivel: number;
  ordem: number;
  imagem: string;
  traducaoCorreta?: string;
};

type DadosSessaoJogoProfessor = {
  sessao: {
    id: string;
    status: 'EM_ANDAMENTO' | 'ENCERRADO' | string;
    nivelTurma: number;
    iniciadaEm: string;
    encerradaEm?: string | null;
    turma: {
      id: string;
      name: string;
      code: string;
      students: Array<{
        id: string;
        name: string;
        avatar?: string;
      }>;
    };
    professor: {
      id: string;
      name: string;
    };
    jogo: {
      id: string;
      slug: string;
      nome: string;
    };
    faseAtual: FaseAtualSessao | null;
  };
  placar: Array<{
    alunoId: string;
    nome: string;
    avatar?: string;
    acertos: number;
    pontos: number;
  }>;
};

type AlunoConectadoSessao = {
  alunoId: string;
  nome: string;
  avatar?: string;
};

function formatarStatusSessao(status: string) {
  return status.replaceAll('_', ' ').trim();
}

function dispararFogosPodio() {
  if (typeof window === 'undefined') return;

  const duracaoAnimacaoMs = 2400;
  const tempoFinal = Date.now() + duracaoAnimacaoMs;

  const intervaloFogos = window.setInterval(() => {
    const tempoRestante = tempoFinal - Date.now();
    if (tempoRestante <= 0) {
      window.clearInterval(intervaloFogos);
      return;
    }

    const quantidadeParticulas = Math.max(18, Math.floor((tempoRestante / duracaoAnimacaoMs) * 56));
    confetti({
      particleCount: quantidadeParticulas,
      startVelocity: 56,
      spread: 70,
      origin: { x: 0.2 + Math.random() * 0.6, y: 0.1 + Math.random() * 0.2 },
      colors: ['#22d3ee', '#38bdf8', '#facc15', '#fb7185', '#a78bfa']
    });
  }, 220);
}

function tocarSomPalmasPodio() {
  if (typeof window === 'undefined') return;

  const FabricaAudioContexto = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!FabricaAudioContexto) return;

  const contextoAudio: AudioContext = new FabricaAudioContexto();
  const taxaAmostragem = contextoAudio.sampleRate;

  // Simula palmas com rajadas curtas de ruído branco em sequência.
  const gerarBufferPalma = () => {
    const duracaoSegundos = 0.11;
    const tamanhoBuffer = Math.floor(taxaAmostragem * duracaoSegundos);
    const buffer = contextoAudio.createBuffer(1, tamanhoBuffer, taxaAmostragem);
    const canal = buffer.getChannelData(0);

    for (let indice = 0; indice < tamanhoBuffer; indice += 1) {
      const progresso = indice / tamanhoBuffer;
      const envelope = Math.exp(-progresso * 12);
      canal[indice] = (Math.random() * 2 - 1) * envelope;
    }

    return buffer;
  };

  const bufferPalma = gerarBufferPalma();
  const tocarPalma = (instanteInicio: number, ganhoInicial: number) => {
    const fonte = contextoAudio.createBufferSource();
    fonte.buffer = bufferPalma;

    const ganho = contextoAudio.createGain();
    ganho.gain.setValueAtTime(ganhoInicial, instanteInicio);
    ganho.gain.exponentialRampToValueAtTime(0.001, instanteInicio + 0.12);

    fonte.connect(ganho).connect(contextoAudio.destination);
    fonte.start(instanteInicio);
    fonte.stop(instanteInicio + 0.13);
  };

  const inicio = contextoAudio.currentTime + 0.05;
  for (let indice = 0; indice < 14; indice += 1) {
    const variacao = (Math.random() - 0.5) * 0.02;
    const intensidade = 0.11 + Math.random() * 0.09;
    tocarPalma(inicio + indice * 0.085 + variacao, intensidade);
  }

  window.setTimeout(() => {
    void contextoAudio.close().catch(() => undefined);
  }, 2200);
}

export default function PaginaSessaoJogoProfessor() {
  const router = useRouter();
  const params = useParams();
  const { currentUser } = useUser();

  const idSessao = typeof params?.sessaoId === 'string' ? params.sessaoId : '';

  const [dadosSessaoJogoProfessor, setDadosSessaoJogoProfessor] = useState<DadosSessaoJogoProfessor | null>(null);
  const [carregandoSessaoJogoProfessor, setCarregandoSessaoJogoProfessor] = useState(true);
  const [erroSessaoJogoProfessor, setErroSessaoJogoProfessor] = useState('');
  const [avancandoFaseSessaoJogo, setAvancandoFaseSessaoJogo] = useState(false);
  const [encerrandoSessaoJogo, setEncerrandoSessaoJogo] = useState(false);
  const [alunosConectadosSessao, setAlunosConectadosSessao] = useState<AlunoConectadoSessao[]>([]);
  const [animacaoPodioExibida, setAnimacaoPodioExibida] = useState(false);
  const [fotoReveladaFaseAtual, setFotoReveladaFaseAtual] = useState(false);
  const [correcaoExibidaFaseAtual, setCorrecaoExibidaFaseAtual] = useState(false);

  const roleUsuarioAtual = useMemo(() => (currentUser?.role || '').toUpperCase(), [currentUser?.role]);
  const acessoProfessorPermitido = roleUsuarioAtual === 'PROFESSOR';
  const statusSessaoFormatado = useMemo(
    () => formatarStatusSessao(dadosSessaoJogoProfessor?.sessao?.status || ''),
    [dadosSessaoJogoProfessor?.sessao?.status]
  );
  const sessaoEncerrada = dadosSessaoJogoProfessor?.sessao?.status === 'ENCERRADO';
  const top3PodioSessao = useMemo(
    () => (dadosSessaoJogoProfessor?.placar || []).slice(0, 3),
    [dadosSessaoJogoProfessor?.placar]
  );
  const colunasPodio = useMemo(
    () => [
      { posicao: 2, jogador: top3PodioSessao[1] || null, altura: 'md:h-[200px]' },
      { posicao: 1, jogador: top3PodioSessao[0] || null, altura: 'md:h-[248px]' },
      { posicao: 3, jogador: top3PodioSessao[2] || null, altura: 'md:h-[172px]' }
    ],
    [top3PodioSessao]
  );
  const alunosTurmaSessao = useMemo(
    () => dadosSessaoJogoProfessor?.sessao?.turma?.students || [],
    [dadosSessaoJogoProfessor?.sessao?.turma?.students]
  );
  const idsAlunosConectadosSessao = useMemo(
    () => new Set(alunosConectadosSessao.map((alunoConectado) => alunoConectado.alunoId).filter(Boolean)),
    [alunosConectadosSessao]
  );
  const alunosPendentesSessao = useMemo(
    () => alunosTurmaSessao.filter((alunoTurma) => !idsAlunosConectadosSessao.has(alunoTurma.id)),
    [alunosTurmaSessao, idsAlunosConectadosSessao]
  );
  const idFaseAtualSessao = dadosSessaoJogoProfessor?.sessao?.faseAtual?.id || '';
  const traducaoCorretaFaseAtual = dadosSessaoJogoProfessor?.sessao?.faseAtual?.traducaoCorreta || '';

  const buscarDadosSessaoJogoProfessor = async () => {
    if (!idSessao) return;
    setErroSessaoJogoProfessor('');
    try {
      const resposta = await fetch(`/api/playground/sessoes/${idSessao}`, { cache: 'no-store' });
      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErroSessaoJogoProfessor(dados?.error || 'Não foi possível carregar a sessão.');
        return;
      }

      setDadosSessaoJogoProfessor(dados);
    } catch (erro) {
      setErroSessaoJogoProfessor('Erro de conexão ao carregar a sessão.');
    } finally {
      setCarregandoSessaoJogoProfessor(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.replace('/teacher');
      return;
    }

    if (!acessoProfessorPermitido) {
      router.replace('/teacher');
      return;
    }

    buscarDadosSessaoJogoProfessor();
  }, [acessoProfessorPermitido, currentUser, idSessao, router]);

  useEffect(() => {
    if (!dadosSessaoJogoProfessor?.sessao) return;
    if (dadosSessaoJogoProfessor.sessao.status !== 'EM_ANDAMENTO') return;

    const intervaloAtualizacaoSessao = setInterval(() => {
      buscarDadosSessaoJogoProfessor();
    }, 5000);

    return () => clearInterval(intervaloAtualizacaoSessao);
  }, [dadosSessaoJogoProfessor?.sessao?.status, idSessao]);

  useEffect(() => {
    if (!currentUser || !acessoProfessorPermitido || !idSessao) return;

    let conexaoWebsocket: WebSocket | null = null;
    let efeitoCancelado = false;

    const conectarWebsocketSessao = async () => {
      try {
        const resposta = await fetch('/api/playground/tempo-real/config', { cache: 'no-store' });
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok || !dados?.porta || efeitoCancelado) return;

        const protocoloWebsocket = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const hostWebsocket = window.location.hostname;
        const parametrosWebsocket = new URLSearchParams({
          sessaoId: idSessao,
          usuarioId: currentUser.id,
          nome: currentUser.name || 'Professor',
          avatar: currentUser.avatar || '',
          role: 'PROFESSOR'
        });

        conexaoWebsocket = new WebSocket(`${protocoloWebsocket}://${hostWebsocket}:${Number(dados.porta)}?${parametrosWebsocket.toString()}`);

        conexaoWebsocket.onmessage = (eventoMensagem) => {
          try {
            const payload = JSON.parse(eventoMensagem.data || '{}');
            const tipoEvento = String(payload?.tipo || '');
            const dadosEvento = payload?.dados || {};

            if (tipoEvento === 'participantes_atualizados' || tipoEvento === 'conexao_estabelecida') {
              const alunosConectadosRecebidos = Array.isArray(dadosEvento?.alunosConectados)
                ? dadosEvento.alunosConectados
                : [];

              setAlunosConectadosSessao(
                alunosConectadosRecebidos.map((aluno: any) => ({
                  alunoId: String(aluno?.alunoId || ''),
                  nome: String(aluno?.nome || 'Aluno'),
                  avatar: typeof aluno?.avatar === 'string' ? aluno.avatar : ''
                }))
              );
              return;
            }

            if (
              tipoEvento === 'resposta_registrada' ||
              tipoEvento === 'fase_avancada' ||
              tipoEvento === 'sessao_encerrada' ||
              tipoEvento === 'sessao_iniciada'
            ) {
              void buscarDadosSessaoJogoProfessor();
            }
          } catch {
            // Ignora mensagens inválidas para não quebrar a sessão ao vivo.
          }
        };
      } catch {
        // Falha de websocket não deve impedir o professor de usar a sessão.
      }
    };

    void conectarWebsocketSessao();

    return () => {
      efeitoCancelado = true;
      if (conexaoWebsocket) {
        conexaoWebsocket.close();
      }
    };
  }, [acessoProfessorPermitido, currentUser, idSessao]);

  useEffect(() => {
    if (!sessaoEncerrada || animacaoPodioExibida) return;
    dispararFogosPodio();
    tocarSomPalmasPodio();
    setAnimacaoPodioExibida(true);
  }, [animacaoPodioExibida, sessaoEncerrada]);

  useEffect(() => {
    if (!sessaoEncerrada && animacaoPodioExibida) {
      setAnimacaoPodioExibida(false);
    }
  }, [animacaoPodioExibida, sessaoEncerrada]);

  useEffect(() => {
    setFotoReveladaFaseAtual(false);
    setCorrecaoExibidaFaseAtual(false);
  }, [idFaseAtualSessao]);

  const revelarFotoFaseAtual = () => {
    if (!idFaseAtualSessao) return;
    setFotoReveladaFaseAtual(true);
  };

  const corrigirFaseAtual = () => {
    if (!fotoReveladaFaseAtual) return;
    if (!traducaoCorretaFaseAtual) return;
    setCorrecaoExibidaFaseAtual(true);
  };

  const avancarFaseSessaoJogo = async () => {
    if (!idSessao || avancandoFaseSessaoJogo || encerrandoSessaoJogo) return;
    setAvancandoFaseSessaoJogo(true);
    setErroSessaoJogoProfessor('');
    try {
      const resposta = await fetch('/api/playground/professor/avancar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessaoId: idSessao })
      });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroSessaoJogoProfessor(dados?.error || 'Não foi possível avançar a fase.');
        return;
      }

      await buscarDadosSessaoJogoProfessor();
    } catch (erro) {
      setErroSessaoJogoProfessor('Erro de conexão ao avançar fase.');
    } finally {
      setAvancandoFaseSessaoJogo(false);
    }
  };

  const encerrarSessaoJogoTempoReal = async () => {
    if (!idSessao || encerrandoSessaoJogo || avancandoFaseSessaoJogo) return;
    setEncerrandoSessaoJogo(true);
    setErroSessaoJogoProfessor('');
    try {
      const resposta = await fetch('/api/playground/professor/encerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessaoId: idSessao })
      });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroSessaoJogoProfessor(dados?.error || 'Não foi possível encerrar a sessão.');
        return;
      }

      await buscarDadosSessaoJogoProfessor();
    } catch (erro) {
      setErroSessaoJogoProfessor('Erro de conexão ao encerrar sessão.');
    } finally {
      setEncerrandoSessaoJogo(false);
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
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao dashboard
          </button>
        </div>

        {carregandoSessaoJogoProfessor && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 flex justify-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregandoSessaoJogoProfessor && erroSessaoJogoProfessor && (
          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl p-4 text-red-500 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {erroSessaoJogoProfessor}
          </div>
        )}

        {!carregandoSessaoJogoProfessor && dadosSessaoJogoProfessor?.sessao && (
          sessaoEncerrada ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 border-2 border-slate-800 rounded-[2.5rem] p-8 md:p-10"
            >
              <div className="absolute -top-20 -left-10 h-48 w-48 bg-cyan-400/20 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -top-16 right-0 h-44 w-44 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none" />

              <div className="relative z-10 text-center space-y-2">
                <p className="text-[11px] uppercase tracking-[0.25em] font-black text-cyan-300">Sessão encerrada</p>
                <h2 className="text-3xl md:text-4xl font-black text-white flex items-center justify-center gap-2">
                  <Sparkles className="h-7 w-7 text-yellow-300" />
                  Pódio Final
                </h2>
                <p className="text-sm md:text-base font-bold text-slate-200">
                  Top 3 da turma {dadosSessaoJogoProfessor.sessao.turma.name}
                </p>
              </div>

              {top3PodioSessao.length === 0 ? (
                <div className="relative z-10 mt-8 bg-slate-900/70 border border-slate-700 rounded-2xl p-6 text-center">
                  <p className="text-sm font-bold text-slate-300">Nenhum aluno pontuou nesta sessão.</p>
                </div>
              ) : (
                <div className="relative z-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  {colunasPodio.map((colunaPodio) => (
                    <div
                      key={`podio-${colunaPodio.posicao}`}
                      className={`rounded-3xl border p-4 md:p-5 flex flex-col justify-between ${colunaPodio.altura} ${
                        colunaPodio.posicao === 1
                          ? 'bg-gradient-to-b from-amber-300/30 to-yellow-500/20 border-yellow-300/50'
                          : 'bg-slate-900/70 border-slate-700'
                      }`}
                    >
                      {colunaPodio.jogador ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-200">
                              {colunaPodio.posicao}º lugar
                            </span>
                            {colunaPodio.posicao === 1 ? (
                              <Crown className="h-5 w-5 text-yellow-200" />
                            ) : (
                              <Medal className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-700 border border-slate-500">
                              {colunaPodio.jogador.avatar ? (
                                <img
                                  src={colunaPodio.jogador.avatar}
                                  alt={colunaPodio.jogador.nome}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-black text-slate-200">
                                  {colunaPodio.jogador.nome.slice(0, 1)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-black text-white truncate">{colunaPodio.jogador.nome}</p>
                              <p className="text-xs font-black text-cyan-300">
                                {colunaPodio.jogador.pontos} pts • {colunaPodio.jogador.acertos} acerto(s)
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col justify-center items-center text-center">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {colunaPodio.posicao}º lugar
                          </p>
                          <p className="text-sm font-bold text-slate-500 mt-2">Sem jogador</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                      <Gamepad2 className="h-7 w-7" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {dadosSessaoJogoProfessor.sessao.jogo.nome}
                      </h1>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                        Turma: {dadosSessaoJogoProfessor.sessao.turma.name} • Nível {dadosSessaoJogoProfessor.sessao.nivelTurma}
                      </p>
                    </div>
                  </div>
                  <span
                    className={
                      dadosSessaoJogoProfessor.sessao.status === 'EM_ANDAMENTO'
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest'
                    }
                  >
                    {statusSessaoFormatado}
                  </span>
                </div>

                {dadosSessaoJogoProfessor.sessao.faseAtual ? (
                  <div className="mt-6 space-y-4">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-950 p-3">
                      <div className="h-[220px] md:h-[290px] rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                        {fotoReveladaFaseAtual ? (
                          <img
                            src={dadosSessaoJogoProfessor.sessao.faseAtual.imagem}
                            alt={`Fase ${dadosSessaoJogoProfessor.sessao.faseAtual.ordem}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center text-center px-8">
                            <Eye className="h-10 w-10 text-white mb-3" />
                            <p className="text-white font-black text-xl md:text-2xl">Foto oculta</p>
                            <p className="text-slate-300 font-bold text-sm mt-1">Clique em revelar foto para iniciar</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-300">
                      Fase atual: nível {dadosSessaoJogoProfessor.sessao.faseAtual.nivel} • ordem {dadosSessaoJogoProfessor.sessao.faseAtual.ordem}
                    </div>

                    {correcaoExibidaFaseAtual && Boolean(traducaoCorretaFaseAtual) && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="rounded-2xl border-2 border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 px-6 py-8 text-center"
                      >
                        <p className="text-[11px] uppercase tracking-[0.25em] font-black text-emerald-600 dark:text-emerald-300 mb-2">
                          Palavra correta
                        </p>
                        <p className="text-4xl md:text-6xl font-black text-emerald-600 dark:text-emerald-300 break-words">
                          {traducaoCorretaFaseAtual}
                        </p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 text-sm font-bold text-slate-400">Nenhuma fase ativa no momento.</p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={revelarFotoFaseAtual}
                    disabled={
                      !idFaseAtualSessao ||
                      fotoReveladaFaseAtual ||
                      avancandoFaseSessaoJogo ||
                      encerrandoSessaoJogo ||
                      dadosSessaoJogoProfessor.sessao.status !== 'EM_ANDAMENTO'
                    }
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl border-b-8 border-cyan-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {fotoReveladaFaseAtual ? 'Foto revelada' : 'Revelar foto'}
                  </button>
                  <button
                    onClick={corrigirFaseAtual}
                    disabled={
                      !fotoReveladaFaseAtual ||
                      correcaoExibidaFaseAtual ||
                      !traducaoCorretaFaseAtual ||
                      avancandoFaseSessaoJogo ||
                      encerrandoSessaoJogo ||
                      dadosSessaoJogoProfessor.sessao.status !== 'EM_ANDAMENTO'
                    }
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {correcaoExibidaFaseAtual ? 'Correção exibida' : 'Corrigir'}
                  </button>
                  <button
                    onClick={avancarFaseSessaoJogo}
                    disabled={
                      !fotoReveladaFaseAtual ||
                      avancandoFaseSessaoJogo ||
                      encerrandoSessaoJogo ||
                      dadosSessaoJogoProfessor.sessao.status !== 'EM_ANDAMENTO'
                    }
                    className="bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    {avancandoFaseSessaoJogo ? 'Avançando...' : 'Avançar fase'}
                  </button>
                  <button
                    onClick={encerrarSessaoJogoTempoReal}
                    disabled={
                      encerrandoSessaoJogo ||
                      avancandoFaseSessaoJogo ||
                      dadosSessaoJogoProfessor.sessao.status !== 'EM_ANDAMENTO'
                    }
                    className="bg-red-500 hover:bg-red-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-6 py-3 rounded-2xl border-b-8 border-red-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    {encerrandoSessaoJogo ? 'Encerrando...' : 'Encerrar sessão'}
                  </button>
                </div>
              </motion.div>

              <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Placar em tempo real
                </h2>

                <div className="mb-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                    Alunos conectados ({alunosConectadosSessao.length})
                  </p>
                  {alunosConectadosSessao.length === 0 ? (
                    <p className="text-sm font-bold text-slate-400">Nenhum aluno conectado no momento.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {alunosConectadosSessao.map((aluno) => (
                        <div
                          key={aluno.alunoId || aluno.nome}
                          className="flex items-center gap-2 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2"
                        >
                          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                            {aluno.avatar ? (
                              <img src={aluno.avatar} alt={aluno.nome} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-slate-500">{aluno.nome.slice(0, 1)}</span>
                            )}
                          </div>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200">{aluno.nome}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                      Faltam entrar na sala ({alunosPendentesSessao.length})
                    </p>
                    {alunosPendentesSessao.length === 0 ? (
                      <p className="text-sm font-bold text-emerald-500 dark:text-emerald-300">
                        Todos os alunos da turma já entraram.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {alunosPendentesSessao.map((alunoPendente) => (
                          <div
                            key={alunoPendente.id}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                          >
                            <div className="h-6 w-6 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                              {alunoPendente.avatar ? (
                                <img
                                  src={alunoPendente.avatar}
                                  alt={alunoPendente.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-black text-slate-500">
                                  {alunoPendente.name.slice(0, 1)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-black text-slate-600 dark:text-slate-300">{alunoPendente.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {dadosSessaoJogoProfessor.placar.length === 0 ? (
                  <p className="text-sm font-bold text-slate-400">Nenhum aluno respondeu ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {dadosSessaoJogoProfessor.placar.map((jogador, indice) => (
                      <div key={jogador.alunoId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 text-center text-xs font-black text-slate-400">#{indice + 1}</span>
                          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                            {jogador.avatar ? (
                              <img src={jogador.avatar} alt={jogador.nome} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-black text-slate-400">{jogador.nome.slice(0, 1)}</span>
                            )}
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{jogador.nome}</p>
                        </div>
                        <div className="text-xs font-black text-slate-500 dark:text-slate-300">
                          {jogador.pontos} pts • {jogador.acertos} acerto(s)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
