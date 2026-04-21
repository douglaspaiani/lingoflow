"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Trophy, AlertCircle, Gamepad2, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '@/contexts/UserContext';
import { SLUG_JOGO_BATTLE_MODE_V1 } from '@/lib/playground-jogos';

type DadosSessaoJogoAluno = {
  sessao: {
    id: string;
    status: 'EM_ANDAMENTO' | 'ENCERRADO' | string;
    nivelTurma: number;
    turma: {
      id: string;
      name: string;
      code: string;
    };
    jogo: {
      id: string;
      slug: string;
      nome: string;
    };
    cronometro?: {
      tipoResposta: string;
      duracaoSegundos: number;
      segundosRestantes: number;
      encerraEm: string;
      tempoEsgotado: boolean;
    } | null;
    faseAtual: {
      id: string;
      nivel: number;
      ordem: number;
      imagem: string;
      pergunta?: string;
      opcoes?: string[];
      tipoResposta?: string;
    } | null;
  };
  placar: Array<{
    alunoId: string;
    nome: string;
    avatar?: string;
    acertos: number;
    pontos: number;
  }>;
  respostaAlunoFaseAtual?: {
    id: string;
    correta: boolean;
    pontos: number;
    resposta: string;
  } | null;
  progressoBattleModeAluno?: {
    totalPerguntas: number;
    perguntasRespondidas: number;
    perguntasRestantes: number;
  } | null;
};

export default function PaginaSessaoJogoAluno() {
  const router = useRouter();
  const params = useParams();
  const { currentUser, registrarConquistasDesbloqueadas } = useUser();

  const idSessao = typeof params?.sessaoId === 'string' ? params.sessaoId : '';
  const roleUsuarioAtual = useMemo(() => (currentUser?.role || '').toUpperCase(), [currentUser?.role]);
  const usuarioPodeAcessarSessao =
    roleUsuarioAtual === 'ALUNO' || roleUsuarioAtual === 'ADMIN' || roleUsuarioAtual === 'PROFESSOR';

  const [dadosSessaoJogoAluno, setDadosSessaoJogoAluno] = useState<DadosSessaoJogoAluno | null>(null);
  const [carregandoSessaoJogoAluno, setCarregandoSessaoJogoAluno] = useState(true);
  const [erroSessaoJogoAluno, setErroSessaoJogoAluno] = useState('');
  const [respostaTraducaoAluno, setRespostaTraducaoAluno] = useState('');
  const [enviandoRespostaJogoAluno, setEnviandoRespostaJogoAluno] = useState(false);
  const [feedbackRespostaBattleMode, setFeedbackRespostaBattleMode] = useState<'acerto' | 'erro' | null>(null);
  const [segundosRestantesCronometro, setSegundosRestantesCronometro] = useState<number | null>(null);

  const formatarTempoRestante = (segundos: number) => {
    const totalSegundos = Math.max(0, Number(segundos) || 0);
    const minutos = Math.floor(totalSegundos / 60).toString().padStart(2, '0');
    const segundosFormatados = (totalSegundos % 60).toString().padStart(2, '0');
    return `${minutos}:${segundosFormatados}`;
  };

  const buscarDadosSessaoJogoAluno = async () => {
    if (!idSessao) return;
    setErroSessaoJogoAluno('');
    try {
      const resposta = await fetch(`/api/playground/sessoes/${idSessao}`, { cache: 'no-store' });
      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        setErroSessaoJogoAluno(dados?.error || 'Não foi possível carregar a sessão do jogo.');
        return;
      }

      setDadosSessaoJogoAluno(dados);
    } catch (erro) {
      setErroSessaoJogoAluno('Erro de conexão ao carregar sessão do jogo.');
    } finally {
      setCarregandoSessaoJogoAluno(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (!usuarioPodeAcessarSessao) {
      router.replace('/login');
      return;
    }

    buscarDadosSessaoJogoAluno();
  }, [currentUser, roleUsuarioAtual, usuarioPodeAcessarSessao, idSessao, router]);

  useEffect(() => {
    if (!dadosSessaoJogoAluno?.sessao) return;
    if (dadosSessaoJogoAluno.sessao.status !== 'EM_ANDAMENTO') return;

    const intervaloAtualizacaoSessaoJogoAluno = setInterval(() => {
      buscarDadosSessaoJogoAluno();
    }, 5000);

    return () => clearInterval(intervaloAtualizacaoSessaoJogoAluno);
  }, [dadosSessaoJogoAluno?.sessao?.status, idSessao]);

  useEffect(() => {
    if (!dadosSessaoJogoAluno?.sessao) return;
    if (dadosSessaoJogoAluno.sessao.status !== 'ENCERRADO') return;

    router.replace('/app');
  }, [dadosSessaoJogoAluno?.sessao?.status, router]);

  useEffect(() => {
    if (!currentUser || roleUsuarioAtual !== 'ALUNO' || !idSessao) return;

    let conexaoWebsocket: WebSocket | null = null;
    let efeitoCancelado = false;

    const conectarWebsocketAluno = async () => {
      try {
        const resposta = await fetch('/api/playground/tempo-real/config', { cache: 'no-store' });
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok || !dados?.porta || efeitoCancelado) return;

        const protocoloWebsocket = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const hostWebsocket = window.location.hostname;
        const parametrosWebsocket = new URLSearchParams({
          sessaoId: idSessao,
          usuarioId: currentUser.id,
          nome: currentUser.name || 'Aluno',
          avatar: currentUser.avatar || '',
          role: 'ALUNO'
        });

        conexaoWebsocket = new WebSocket(`${protocoloWebsocket}://${hostWebsocket}:${Number(dados.porta)}?${parametrosWebsocket.toString()}`);

        conexaoWebsocket.onmessage = (eventoMensagem) => {
          try {
            const payload = JSON.parse(eventoMensagem.data || '{}');
            const tipoEvento = String(payload?.tipo || '');
            if (
              tipoEvento === 'resposta_registrada' ||
              tipoEvento === 'fase_avancada' ||
              tipoEvento === 'sessao_encerrada' ||
              tipoEvento === 'sessao_iniciada'
            ) {
              void buscarDadosSessaoJogoAluno();
            }
          } catch {
            // Ignora payload inválido para manter o jogo estável.
          }
        };
      } catch {
        // Se websocket falhar, o polling periódico continua garantindo atualização.
      }
    };

    void conectarWebsocketAluno();

    return () => {
      efeitoCancelado = true;
      if (conexaoWebsocket) {
        conexaoWebsocket.close();
      }
    };
  }, [currentUser, idSessao, roleUsuarioAtual]);

  useEffect(() => {
    const encerraEmSessao = dadosSessaoJogoAluno?.sessao?.cronometro?.encerraEm;
    if (!encerraEmSessao) {
      setSegundosRestantesCronometro(null);
      return;
    }

    const atualizarTempoRestante = () => {
      const segundosRestantes = Math.max(
        0,
        Math.ceil((new Date(encerraEmSessao).getTime() - Date.now()) / 1000)
      );
      setSegundosRestantesCronometro(segundosRestantes);
    };

    atualizarTempoRestante();
    const intervaloCronometro = setInterval(atualizarTempoRestante, 1000);
    return () => clearInterval(intervaloCronometro);
  }, [dadosSessaoJogoAluno?.sessao?.cronometro?.encerraEm]);

  const enviarRespostaAlunoNoJogo = async (respostaBattleMode?: string) => {
    if (roleUsuarioAtual !== 'ALUNO') return;
    if (!dadosSessaoJogoAluno?.sessao?.faseAtual) return;
    if (dadosSessaoJogoAluno.sessao.status !== 'EM_ANDAMENTO') return;
    const sessaoEhBattleMode = dadosSessaoJogoAluno.sessao.jogo.slug === SLUG_JOGO_BATTLE_MODE_V1;
    const respostaFinal = (sessaoEhBattleMode ? respostaBattleMode : respostaTraducaoAluno).trim();

    if (!respostaFinal) {
      setErroSessaoJogoAluno('Digite sua resposta antes de enviar.');
      return;
    }
    if (!sessaoEhBattleMode && dadosSessaoJogoAluno.respostaAlunoFaseAtual?.id) {
      setErroSessaoJogoAluno('Você já respondeu esta fase.');
      return;
    }

    setEnviandoRespostaJogoAluno(true);
    setErroSessaoJogoAluno('');
    try {
      const resposta = await fetch('/api/playground/aluno/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessaoId: idSessao,
          faseId: dadosSessaoJogoAluno.sessao.faseAtual.id,
          resposta: respostaFinal
        })
      });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setErroSessaoJogoAluno(dados?.error || 'Não foi possível enviar sua resposta.');
        return;
      }

      if (Array.isArray(dados?.novasConquistasDesbloqueadas)) {
        registrarConquistasDesbloqueadas(dados.novasConquistasDesbloqueadas);
      }

      if (sessaoEhBattleMode) {
        setFeedbackRespostaBattleMode(dados?.resposta?.correta ? 'acerto' : 'erro');
        setTimeout(() => setFeedbackRespostaBattleMode(null), 1200);
      } else {
        setRespostaTraducaoAluno('');
      }
      await buscarDadosSessaoJogoAluno();
    } catch (erro) {
      setErroSessaoJogoAluno('Erro de conexão ao enviar resposta.');
    } finally {
      setEnviandoRespostaJogoAluno(false);
    }
  };

  if (!currentUser || !usuarioPodeAcessarSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sessaoEhBattleMode = dadosSessaoJogoAluno?.sessao?.jogo?.slug === SLUG_JOGO_BATTLE_MODE_V1;
  const faseAtualBattleMode = sessaoEhBattleMode ? dadosSessaoJogoAluno?.sessao?.faseAtual : null;
  const opcoesPerguntaBattleMode = Array.isArray(faseAtualBattleMode?.opcoes)
    ? faseAtualBattleMode.opcoes.filter((opcao) => typeof opcao === 'string' && opcao.trim().length > 0)
    : [];
  const cronometroAtivoBattleMode = typeof segundosRestantesCronometro === 'number';
  const respostaJaEnviadaNestaFase = Boolean(dadosSessaoJogoAluno?.respostaAlunoFaseAtual?.id);

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/app')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black uppercase tracking-widest text-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {carregandoSessaoJogoAluno && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 flex justify-center">
            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregandoSessaoJogoAluno && erroSessaoJogoAluno && (
          <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl p-4 text-red-500 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {erroSessaoJogoAluno}
          </div>
        )}

        {!carregandoSessaoJogoAluno && dadosSessaoJogoAluno?.sessao && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">
                      {dadosSessaoJogoAluno.sessao.jogo.nome}
                    </h1>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-300">
                      Turma {dadosSessaoJogoAluno.sessao.turma.name} • Nível {dadosSessaoJogoAluno.sessao.nivelTurma}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sessaoEhBattleMode && cronometroAtivoBattleMode && (
                    <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatarTempoRestante(segundosRestantesCronometro || 0)}
                    </span>
                  )}
                  <span
                    className={
                      dadosSessaoJogoAluno.sessao.status === 'EM_ANDAMENTO'
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest'
                    }
                  >
                    {dadosSessaoJogoAluno.sessao.status}
                  </span>
                </div>
              </div>

              {sessaoEhBattleMode ? (
                faseAtualBattleMode ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-5 md:p-6">
                      <p className="text-[10px] uppercase tracking-widest font-black text-blue-500 mb-2">
                        {faseAtualBattleMode.tipoResposta || dadosSessaoJogoAluno.sessao.cronometro?.tipoResposta || 'Tipo de resposta'}
                      </p>
                      <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {faseAtualBattleMode.pergunta || 'Pergunta sem enunciado'}
                      </h2>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-300 mt-3">
                        Pergunta {faseAtualBattleMode.ordem + 1} • Nível {faseAtualBattleMode.nivel}
                      </p>
                    </div>

                    {roleUsuarioAtual === 'ALUNO' && (
                      <div className="space-y-3">
                        <label className="text-xs uppercase tracking-widest font-black text-slate-400">Escolha a resposta correta</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {opcoesPerguntaBattleMode.map((opcaoPergunta) => (
                            <button
                              key={`${faseAtualBattleMode.id}-${opcaoPergunta}`}
                              onClick={() => enviarRespostaAlunoNoJogo(opcaoPergunta)}
                              disabled={
                                enviandoRespostaJogoAluno ||
                                dadosSessaoJogoAluno.sessao.status !== 'EM_ANDAMENTO' ||
                                !faseAtualBattleMode ||
                                (segundosRestantesCronometro !== null && segundosRestantesCronometro <= 0)
                              }
                              className="bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-slate-700 dark:text-slate-100 font-black px-4 py-4 rounded-2xl transition-all text-sm text-left"
                            >
                              {opcaoPergunta}
                            </button>
                          ))}
                        </div>

                        {feedbackRespostaBattleMode && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={
                              feedbackRespostaBattleMode === 'acerto'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-2xl px-4 py-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-300 text-sm font-black'
                                : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/40 rounded-2xl px-4 py-3 flex items-center gap-2 text-red-600 dark:text-red-300 text-sm font-black'
                            }
                          >
                            {feedbackRespostaBattleMode === 'acerto' ? (
                              <>
                                <CheckCircle2 className="h-5 w-5" />
                                Resposta correta! Continue para somar mais pontos.
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5" />
                                Resposta incorreta. Tente a próxima pergunta.
                              </>
                            )}
                          </motion.div>
                        )}

                        {dadosSessaoJogoAluno.progressoBattleModeAluno && (
                          <p className="text-xs font-black text-slate-500 dark:text-slate-300">
                            Respondidas: {dadosSessaoJogoAluno.progressoBattleModeAluno.perguntasRespondidas}/{dadosSessaoJogoAluno.progressoBattleModeAluno.totalPerguntas}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-400">
                    Você respondeu todas as perguntas disponíveis. Aguarde o encerramento da sessão.
                  </p>
                )
              ) : (
                <>
                  {dadosSessaoJogoAluno.sessao.faseAtual ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                        <img
                          src={dadosSessaoJogoAluno.sessao.faseAtual.imagem}
                          alt={`Fase ${dadosSessaoJogoAluno.sessao.faseAtual.ordem}`}
                          className="w-full max-h-[360px] object-cover"
                        />
                      </div>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                        Fase {dadosSessaoJogoAluno.sessao.faseAtual.ordem} • Nível {dadosSessaoJogoAluno.sessao.faseAtual.nivel}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Aguardando próxima fase...</p>
                  )}

                  {roleUsuarioAtual === 'ALUNO' && (
                    <div className="space-y-3">
                      <label className="text-xs uppercase tracking-widest font-black text-slate-400">Sua tradução</label>
                      <div className="flex gap-3">
                        <input
                          value={respostaTraducaoAluno}
                          onChange={(evento) => setRespostaTraducaoAluno(evento.target.value)}
                          disabled={
                            enviandoRespostaJogoAluno ||
                            respostaJaEnviadaNestaFase ||
                            dadosSessaoJogoAluno.sessao.status !== 'EM_ANDAMENTO' ||
                            !dadosSessaoJogoAluno.sessao.faseAtual
                          }
                          placeholder="Digite a tradução correta"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-blue-500 disabled:opacity-70"
                        />
                        <button
                          onClick={() => enviarRespostaAlunoNoJogo()}
                          disabled={
                            enviandoRespostaJogoAluno ||
                            respostaJaEnviadaNestaFase ||
                            dadosSessaoJogoAluno.sessao.status !== 'EM_ANDAMENTO' ||
                            !dadosSessaoJogoAluno.sessao.faseAtual
                          }
                          className="bg-blue-500 hover:bg-blue-400 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black px-5 py-3 rounded-2xl border-b-8 border-blue-700 active:border-b-0 active:translate-y-2 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {enviandoRespostaJogoAluno ? 'Enviando...' : 'Enviar'}
                        </button>
                      </div>
                      {respostaJaEnviadaNestaFase && (
                        <p className="text-xs font-black text-emerald-500">
                          Resposta enviada. Aguarde a próxima fase.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>

            <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8">
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Placar
              </h2>
              {dadosSessaoJogoAluno.placar.length === 0 ? (
                <p className="text-sm font-bold text-slate-400">Ainda não há respostas registradas.</p>
              ) : (
                <div className="space-y-3">
                  {dadosSessaoJogoAluno.placar.map((jogador, indice) => (
                    <div key={jogador.alunoId} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-3">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                        #{indice + 1} {jogador.nome}
                      </p>
                      <p className="text-xs font-black text-slate-500 dark:text-slate-300">
                        {jogador.pontos} pts • {jogador.acertos} acerto(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
